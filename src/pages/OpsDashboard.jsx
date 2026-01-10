import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function OpsDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem("ops_token") || "");
  const [tokenInput, setTokenInput] = useState(token || "");

  const [status, setStatus] = useState("ready_to_submit");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedCase, setSelectedCase] = useState(null);
  const [registro, setRegistro] = useState("");
  const [note, setNote] = useState("");
  const [justificante, setJustificante] = useState(null);

  const authed = token && token.length > 10;

  // ------------------------
  // Helpers
  // ------------------------
  async function apiFetch(url, options = {}) {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "X-Operator-Token": token,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || "Error API");
    }
    return data;
  }

  // ------------------------
  // Load queue
  // ------------------------
  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/ops/queue?status=${status}`);
      setCases(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) loadQueue();
  }, [authed, status]);

  // ------------------------
  // Actions
  // ------------------------
  async function markSubmitted() {
    if (!selectedCase) return;
    try {
      const fd = new FormData();
      if (registro) fd.append("registro", registro);
      if (note) fd.append("note", note);

      await apiFetch(`/ops/cases/${selectedCase}/mark-submitted`, {
        method: "POST",
        body: fd,
      });

      alert("✅ Caso marcado como PRESENTADO");
      setSelectedCase(null);
      setRegistro("");
      setNote("");
      loadQueue();
    } catch (e) {
      alert(e.message);
    }
  }

  async function uploadJustificante() {
    if (!selectedCase || !justificante) return;

    try {
      const fd = new FormData();
      fd.append("file", justificante);

      await apiFetch(`/ops/cases/${selectedCase}/upload-justificante`, {
        method: "POST",
        body: fd,
      });

      alert("📎 Justificante subido correctamente");
      setJustificante(null);
    } catch (e) {
      alert(e.message);
    }
  }

  // ------------------------
  // LOGIN SCREEN
  // ------------------------
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold mb-3">Acceso Operador</h1>
          <p className="text-sm text-gray-600 mb-4">
            Introduce el <strong>OPERATOR_TOKEN</strong> configurado en Render.
          </p>

          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Token operador"
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button
            className="mt-4 w-full bg-black text-white rounded px-4 py-2 text-sm"
            onClick={() => {
              if (tokenInput.length < 10) {
                alert("Token inválido");
                return;
              }
              setToken(tokenInput);
              localStorage.setItem("ops_token", tokenInput);
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // ------------------------
  // DASHBOARD
  // ------------------------
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
              setTokenInput("");
            }}
          >
            Salir
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4 items-center">
          <label className="text-sm">Estado:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="ready_to_submit">ready_to_submit</option>
            <option value="submitted">submitted</option>
            <option value="generated">generated</option>
          </select>

          <button
            onClick={loadQueue}
            className="bg-black text-white rounded px-3 py-1 text-sm"
          >
            Refrescar
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
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
                  <td className="p-2 font-mono text-xs">{c.case_id}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">{c.payment_status}</td>
                  <td className="p-2">{c.contact_email || "-"}</td>
                  <td className="p-2">
                    <button
                      className="text-xs underline"
                      onClick={() => setSelectedCase(c.case_id)}
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
              {!cases.length && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No hay casos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Case actions */}
        {selectedCase && (
          <div className="bg-white rounded-xl shadow p-4 mt-6">
            <h2 className="font-semibold mb-3">Caso {selectedCase}</h2>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="Número de registro (opcional)"
                value={registro}
                onChange={(e) => setRegistro(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                placeholder="Nota interna (opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-3 flex gap-3 flex-wrap">
              <button
                onClick={markSubmitted}
                className="bg-green-600 text-white rounded px-4 py-2 text-sm"
              >
                Marcar como presentado
              </button>

              <input
                type="file"
                onChange={(e) => setJustificante(e.target.files[0])}
                className="text-sm"
              />

              <button
                onClick={uploadJustificante}
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm"
              >
                Subir justificante
              </button>

              <button
                onClick={() => setSelectedCase(null)}
                className="text-sm underline text-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}
