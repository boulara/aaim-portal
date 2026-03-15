"""
Tests for case note creation, follow-up dates, mark-done, clear-date, and delete.
Run from backend/: pytest tests/
"""
import pytest


# ── helpers ────────────────────────────────────────────────────────────────────

def make_note(client, patient_id, user_id, text="Test note", follow_up_date=None):
    payload = {
        "patient_id": patient_id,
        "user_id": user_id,
        "user_name": "Test User",
        "user_team": "NCM",
        "text": text,
    }
    if follow_up_date is not None:
        payload["follow_up_date"] = follow_up_date
    r = client.post("/api/notes/", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


def patch_note(client, note_id, **fields):
    r = client.patch(f"/api/notes/{note_id}", json=fields)
    assert r.status_code == 200, r.text
    return r.json()


# ── creation tests ─────────────────────────────────────────────────────────────

def test_create_note_no_followup(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"])
    assert note["text"] == "Test note"
    assert note["follow_up_date"] is None
    assert note["completed_at"] is None


def test_create_note_with_future_date(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     text="Future follow-up", follow_up_date="2099-12-31")
    assert note["follow_up_date"] == "2099-12-31"
    assert note["completed_at"] is None


def test_create_note_with_past_date(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     text="Past follow-up", follow_up_date="2020-01-01")
    assert note["follow_up_date"] == "2020-01-01"
    assert note["completed_at"] is None


def test_create_multiple_notes_same_patient(client, test_user, test_patient):
    make_note(client, test_patient["id"], test_user["id"], text="Note 1", follow_up_date="2099-06-01")
    make_note(client, test_patient["id"], test_user["id"], text="Note 2", follow_up_date="2099-07-01")
    make_note(client, test_patient["id"], test_user["id"], text="Note 3")

    r = client.get(f"/api/notes/?patient_id={test_patient['id']}&user_id={test_user['id']}")
    assert r.status_code == 200
    assert len(r.json()) == 3


# ── mark done / undo ───────────────────────────────────────────────────────────

def test_mark_note_done(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     follow_up_date="2099-12-31")
    updated = patch_note(client, note["id"], completed_at="2026-03-15T10:00:00")
    assert updated["completed_at"] is not None
    assert updated["follow_up_date"] == "2099-12-31"  # date preserved


def test_undo_mark_done(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     follow_up_date="2099-12-31")
    # Mark done
    patch_note(client, note["id"], completed_at="2026-03-15T10:00:00")
    # Undo
    updated = patch_note(client, note["id"], completed_at=None)
    assert updated["completed_at"] is None


# ── clear follow-up date ───────────────────────────────────────────────────────

def test_clear_followup_date(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     follow_up_date="2099-12-31")
    assert note["follow_up_date"] == "2099-12-31"

    updated = patch_note(client, note["id"], follow_up_date=None)
    assert updated["follow_up_date"] is None
    assert updated["text"] == "Test note"   # text untouched


def test_clear_past_followup_date(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     follow_up_date="2020-01-01")
    updated = patch_note(client, note["id"], follow_up_date=None)
    assert updated["follow_up_date"] is None


# ── delete ─────────────────────────────────────────────────────────────────────

def test_delete_note(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"])
    r = client.delete(f"/api/notes/{note['id']}")
    assert r.status_code == 204

    # Confirm it's gone
    remaining = client.get(f"/api/notes/?patient_id={test_patient['id']}&user_id={test_user['id']}").json()
    assert all(n["id"] != note["id"] for n in remaining)


def test_delete_note_with_followup(client, test_user, test_patient):
    note = make_note(client, test_patient["id"], test_user["id"],
                     follow_up_date="2099-06-01")
    r = client.delete(f"/api/notes/{note['id']}")
    assert r.status_code == 204


# ── per-user scoping ───────────────────────────────────────────────────────────

def test_notes_scoped_to_user(client, test_patient):
    user_a = client.post("/api/users/", json={
        "username": "user.a", "password": "pass", "name": "User A", "team": "NCM", "role": "partner"
    }).json()
    user_b = client.post("/api/users/", json={
        "username": "user.b", "password": "pass", "name": "User B", "team": "SP", "role": "partner"
    }).json()

    make_note(client, test_patient["id"], user_a["id"], text="Note from A")
    make_note(client, test_patient["id"], user_b["id"], text="Note from B")

    notes_a = client.get(f"/api/notes/?user_id={user_a['id']}").json()
    notes_b = client.get(f"/api/notes/?user_id={user_b['id']}").json()

    assert len(notes_a) == 1 and notes_a[0]["text"] == "Note from A"
    assert len(notes_b) == 1 and notes_b[0]["text"] == "Note from B"


# ── completed notes excluded from follow-up list ───────────────────────────────

def test_completed_note_still_returned_in_list(client, test_user, test_patient):
    """Completed notes are still returned by the API; filtering happens client-side."""
    note = make_note(client, test_patient["id"], test_user["id"],
                     follow_up_date="2020-01-01")
    patch_note(client, note["id"], completed_at="2026-03-15T10:00:00")

    all_notes = client.get(f"/api/notes/?user_id={test_user['id']}").json()
    completed = [n for n in all_notes if n["completed_at"] is not None]
    assert len(completed) == 1
    assert completed[0]["id"] == note["id"]


# ── error cases ────────────────────────────────────────────────────────────────

def test_patch_nonexistent_note_returns_404(client):
    r = client.patch("/api/notes/nonexistent-id", json={"text": "hi"})
    assert r.status_code == 404


def test_delete_nonexistent_note_returns_404(client):
    r = client.delete("/api/notes/nonexistent-id")
    assert r.status_code == 404
