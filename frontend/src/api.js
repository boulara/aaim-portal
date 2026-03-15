const BASE = "/api";

function getUser() {
  try { return JSON.parse(localStorage.getItem("aaim_user")); } catch { return null; }
}

async function req(method, path, body) {
  const user = getUser();
  const headers = { "Content-Type": "application/json" };
  if (user) headers["X-User-ID"] = user.id;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login:              (username, password) => req("POST", "/users/login", { username, password }),

  // Patients
  getPatients:        (params = {})        => req("GET", `/patients/?${new URLSearchParams(params)}`),

  // Notifications
  getNotifications:   ()                   => req("GET", "/notifications/"),
  createNotification: (data)               => req("POST", "/notifications/", data),
  updateNotification: (id, data)           => req("PATCH", `/notifications/${id}`, data),
  addReply:           (id, data)           => req("POST", `/notifications/${id}/replies`, data),

  // Users (settings)
  getUsers:           ()                   => req("GET", "/users/"),
  createUser:         (data)               => req("POST", "/users/", data),
  updateUser:         (id, data)           => req("PATCH", `/users/${id}`, data),
  deleteUser:         (id)                 => req("DELETE", `/users/${id}`),

  // Patients (settings)
  updatePatient:      (id, data)           => req("PATCH", `/patients/${id}`, data),
  deletePatient:      (id)                 => req("DELETE", `/patients/${id}`),

  // Case notes
  getNotes:           (patientId, userId)  => {
    const p = new URLSearchParams();
    if (patientId) p.set("patient_id", patientId);
    if (userId)    p.set("user_id", userId);
    const qs = p.toString();
    return req("GET", `/notes/${qs ? `?${qs}` : ""}`);
  },
  createNote:         (data)               => req("POST", `/notes/`, data),
  updateNote:         (id, data)           => req("PATCH", `/notes/${id}`, data),
  deleteNote:         (id)                 => req("DELETE", `/notes/${id}`),
};
