
import { useState } from "react";
import { API_BASE } from "../apiBase";
import { getSession } from "../auth";

export default function DemoMode() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRunDemo() {
    const session = getSession();

    if (!session?.token) {
      setMessage("Please log in first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/demo/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to start demo");
      }

      setMessage(".");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={handleRunDemo}
        disabled={loading}
        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
      >
        {loading ? "Starting…" : "Run"}
      </button>

      {message && (
        <small style={{ color: "var(--text-dim)" }}>{message}</small>
      )}
    </div>
  );
}

