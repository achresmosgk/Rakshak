import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import {
  getAdminSession,
  clearAdminSession,
  adminLogout,
  fetchUsers,
  fetchDevices,
  createDevice,
} from "../adminAuth";

const EMPTY_FORM = {
  device_id: "",
  location_name: "",
  latitude: "",
  longitude: "",
  highway_km_marker: "",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getAdminSession();

  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newApiKey, setNewApiKey] = useState(null);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [devicesData, usersData] = await Promise.all([
        fetchDevices(session.token),
        fetchUsers(session.token),
      ]);
      setDevices(devicesData);
      setUsers(usersData);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await adminLogout(session?.token);
    clearAdminSession();
    navigate("/admin/login");
  }

  async function handleCreateDevice(e) {
    e.preventDefault();
    setCreateError(null);
    setNewApiKey(null);
    setCreating(true);
    try {
      const device = await createDevice(session.token, {
        device_id: form.device_id,
        location_name: form.location_name,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        highway_km_marker: form.highway_km_marker ? parseFloat(form.highway_km_marker) : null,
      });
      setNewApiKey(device.api_key);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <nav className="navbar">
        <div className="brand">
          <Logo />
          Rakshak Admin
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </nav>

      <div className="container" style={{ padding: "32px 24px" }}>
        <div className="card" style={{ marginBottom: 32, textAlign: "left" }}>
          <h3 style={{ marginBottom: 16 }}>Register a device</h3>

          {createError && <p className="form-error">{createError}</p>}
          {newApiKey && (
            <p style={{ color: "var(--success)", fontSize: 13.5, marginBottom: 16, wordBreak: "break-all" }}>
              Device created — API key: <code>{newApiKey}</code>
            </p>
          )}

          <form onSubmit={handleCreateDevice} className="admin-form-grid">
            <div className="field" style={{ margin: 0 }}>
              <label>Device ID</label>
              <input
                required
                value={form.device_id}
                onChange={(e) => setForm({ ...form, device_id: e.target.value })}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Location name</label>
              <input
                required
                value={form.location_name}
                onChange={(e) => setForm({ ...form, location_name: e.target.value })}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Latitude</label>
              <input
                required
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Longitude</label>
              <input
                required
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Highway KM marker (optional)</label>
              <input
                type="number"
                step="any"
                value={form.highway_km_marker}
                onChange={(e) => setForm({ ...form, highway_km_marker: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create device"}
            </button>
          </form>
        </div>

        {loadError && <p className="form-error">{loadError}</p>}

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <div className="card admin-table-wrap" style={{ marginBottom: 32, textAlign: "left" }}>
              <h3 style={{ marginBottom: 16 }}>Devices ({devices.length})</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Location</th>
                    <th>Lat/Lon</th>
                    <th>KM marker</th>
                    <th>API key</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => (
                    <tr key={d.id}>
                      <td>{d.device_id}</td>
                      <td>{d.location_name}</td>
                      <td>
                        {d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}
                      </td>
                      <td>{d.highway_km_marker ?? "—"}</td>
                      <td>
                        <code>{d.api_key}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card admin-table-wrap" style={{ textAlign: "left" }}>
              <h3 style={{ marginBottom: 16 }}>Users ({users.length})</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
