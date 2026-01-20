import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES");
  } catch {
    return "—";
  }
}

function shortId(id) {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export default function OpsDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem("ops_token") || "");
  const [pin, setPin] = useState("");

  const [status, setStatus] = useState("ready_to_submit");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authed = token && token.trim().length > 10;
  const authHeaders = { "X-Operator-Token": token };

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson(
        `${API}/ops/queue?status=${encodeURIComponent(status)}`,
        { headers: authHeaders }
      );
      setCases(data.items || []);
    } catch (e) {
      setError(e.message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPin() {
    try {
      if (!pin || pin.trim().length < 4) {
        alert("PIN inválido");
        return;
      }
      const fd = new FormData();
      fd.append("pin", pin.trim());

      const data = await fetchJson(`${API}/ops/login`, {
        method: "POST",
        body: fd,
      });

      if (!data?.token) throw new Error("Login OK pero falta token");
      localStorage.setItem("ops_token", data.token);
      setToken(data.token);
      setPin("");
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    if (authed) loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, status]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold mb-3">Acceso Operador</h1>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN operador"
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button className="mt-4 w-full sr-btn-primary" onClick={loginWithPin}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Panel Operador</h1>
          <button
            className="text-sm text-gray-600 underline"
            onClick={() => {
              localStorage.removeItem("ops_token");
              setToken("");
              setPin("");
            }}
          >
            Salir
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <label className="text-sm">Estado:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="ready_to_submit">ready_to_submit</option>
            <option value="uploaded">uploaded</option>
            <option value="generated">generated</option>
            <option value="submitted">submitted</option>
            <option value="all">all</option>
          </select>

          <button onClick={loadQueue} className="sr-btn-primary" style={{ padding: "8px 14px" }}>
            Refrescar
          </button>

          {loading && <span className="text-sm text-gray-500">Cargando…</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Case ID</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Pago</th>
                <th className="p-2">Email</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.case_id} className="border-t">
                  <td className="p-2">{formatDate(c.created_at)}</td>
                  <td className="p-2 font-mono text-xs">{shortId(c.case_id)}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">{c.payment_status || "—"}</td>
                  <td className="p-2">{c.contact_email || "-"}</td>
                  <td className="p-2">
                    <Link to={`/ops/case/${c.case_id}`} className="text-xs underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {!cases.length && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No hay casos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Ordenado por fecha de creación (más antiguos arriba).
        </div>
      </div>
    </div>
  );
}