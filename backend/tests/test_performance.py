"""
Performance benchmarks for Conduit API endpoints.

Runs against the live Railway app by default. Set BASE_URL env var to
point at a different environment.

Usage:
  # Against live app (requires valid credentials):
  BASE_URL=https://conduit.fireflydigital.biz \
  TEST_USERNAME=rick.boulanger TEST_PASSWORD=pass123 \
  pytest tests/test_performance.py -v -s

  # Against local dev server:
  pytest tests/test_performance.py -v -s
"""
import os
import time
import statistics
import pytest
import httpx

BASE_URL     = os.environ.get("BASE_URL", "http://localhost:8080")
USERNAME     = os.environ.get("TEST_USERNAME", "rick.boulanger")
PASSWORD     = os.environ.get("TEST_PASSWORD", "pass123")

# Thresholds (milliseconds)
P50_LIMIT = 300   # median must be under 300ms
P95_LIMIT = 800   # 95th percentile must be under 800ms
REPS      = 10    # number of requests per endpoint


def measure(client: httpx.Client, method: str, url: str, **kwargs) -> list[float]:
    """Fire REPS requests and return response times in ms."""
    times = []
    for _ in range(REPS):
        t0 = time.perf_counter()
        r = client.request(method, url, **kwargs)
        elapsed = (time.perf_counter() - t0) * 1000
        assert r.status_code < 500, f"{url} returned {r.status_code}: {r.text[:200]}"
        times.append(elapsed)
    return times


def report(name: str, times: list[float]):
    p50 = statistics.median(times)
    p95 = sorted(times)[int(len(times) * 0.95)]
    mn  = min(times)
    mx  = max(times)
    print(f"\n  {name}")
    print(f"    min={mn:.0f}ms  p50={p50:.0f}ms  p95={p95:.0f}ms  max={mx:.0f}ms")
    return p50, p95


@pytest.fixture(scope="module")
def session():
    """Authenticated httpx session against BASE_URL."""
    with httpx.Client(base_url=BASE_URL, timeout=15) as client:
        # Login to get user ID
        r = client.post("/api/users/login", json={"username": USERNAME, "password": PASSWORD})
        if r.status_code != 200:
            pytest.skip(f"Login failed ({r.status_code}) — is the server running at {BASE_URL}?")
        user = r.json()
        client.headers["X-User-ID"] = user["id"]
        yield client, user


class TestResponseTimes:

    def test_patient_list(self, session):
        client, _ = session
        times = measure(client, "GET", "/api/patients/")
        p50, p95 = report("GET /api/patients/", times)
        assert p50 < P50_LIMIT, f"Median {p50:.0f}ms exceeds {P50_LIMIT}ms limit"
        assert p95 < P95_LIMIT, f"p95 {p95:.0f}ms exceeds {P95_LIMIT}ms limit"

    def test_patient_search(self, session):
        client, _ = session
        times = measure(client, "GET", "/api/patients/", params={"search": "Dr."})
        p50, p95 = report("GET /api/patients/?search=Dr.", times)
        assert p50 < P50_LIMIT
        assert p95 < P95_LIMIT

    def test_patient_filter_region(self, session):
        client, _ = session
        times = measure(client, "GET", "/api/patients/", params={"region": "Northeast"})
        p50, p95 = report("GET /api/patients/?region=Northeast", times)
        assert p50 < P50_LIMIT
        assert p95 < P95_LIMIT

    def test_patient_filter_channel(self, session):
        client, _ = session
        times = measure(client, "GET", "/api/patients/", params={"channel": "Hub"})
        p50, p95 = report("GET /api/patients/?channel=Hub", times)
        assert p50 < P50_LIMIT
        assert p95 < P95_LIMIT

    def test_notifications(self, session):
        client, _ = session
        times = measure(client, "GET", "/api/notifications/")
        p50, p95 = report("GET /api/notifications/", times)
        assert p50 < P50_LIMIT
        assert p95 < P95_LIMIT

    def test_health(self, session):
        client, _ = session
        times = measure(client, "GET", "/api/health")
        p50, p95 = report("GET /api/health", times)
        # Health endpoint should be very fast
        assert p50 < 100, f"Health check median {p50:.0f}ms is too slow"

    def test_concurrent_patient_list(self, session):
        """Simulate 5 users hitting the patient list simultaneously."""
        import threading
        client, _ = session
        results = []
        errors  = []

        def fetch():
            t0 = time.perf_counter()
            try:
                r = client.get("/api/patients/")
                elapsed = (time.perf_counter() - t0) * 1000
                if r.status_code < 500:
                    results.append(elapsed)
                else:
                    errors.append(r.status_code)
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=fetch) for _ in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()

        assert not errors, f"Concurrent requests had errors: {errors}"
        p50, p95 = report("5x concurrent GET /api/patients/", results)
        assert p50 < P50_LIMIT * 2, f"Concurrent median {p50:.0f}ms too slow"


class TestDatabaseQueries:
    """Verify query patterns that rely on indexes are fast."""

    def test_combined_filters(self, session):
        """Worst-case: search + region + channel all at once."""
        client, _ = session
        times = measure(client, "GET", "/api/patients/", params={
            "search": "Dr.", "region": "Northeast", "channel": "Hub"
        })
        p50, p95 = report("GET /api/patients/ (search+region+channel)", times)
        assert p50 < P50_LIMIT
        assert p95 < P95_LIMIT

    def test_single_patient_lookup(self, session):
        """PK lookup — should always be sub-50ms."""
        client, _ = session
        # Get any patient ID first
        patients = client.get("/api/patients/").json()
        if not patients:
            pytest.skip("No patients in DB")
        pid = patients[0]["id"]
        times = measure(client, "GET", f"/api/patients/{pid}")
        p50, p95 = report(f"GET /api/patients/{pid} (PK lookup)", times)
        assert p50 < 150, f"PK lookup median {p50:.0f}ms — should be <150ms"
