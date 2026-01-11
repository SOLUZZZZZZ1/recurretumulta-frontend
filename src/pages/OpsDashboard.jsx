import React, { useEffect, useState } from "react";

const API = "/api";

function fmt(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function OpsDashboard() {
  // Token real (se guarda en localStorage)
  const [token, setToken] = useState(() => localStorage.getItem("ops_token") || "");

  // PIN corto (operador lo escribe)
  const [pin, setPin] = useState("");

  const [status, setStatus] = useState("ready_to_submit");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedCase, setSelectedCase] = useState(null);

  const [docs, setDocs] = useState([]);
  const [events, setEvents] = useState([]);

  const [registro, setRegistro] = useState("");
  const [note, setNote] = useState("");

  const [justificante, setJustificante] = useState(null);
  const [justUploading, setJustUploading] = useState(false);

  const authed = token && token.trim().length > 10;
  const authHeaders = { "X-Operator-Token": token };

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson(`${API}/ops/queue?status=${encodeURIComponent(status)}`, {
        headers: authHeaders,
      });
      setCases(data.items || []);
    } catch (e) {
      setError(e.message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCaseExtras(caseId) {
    try {
      const [d, ev] = await Promise.all([
        fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/documents`, { headers: authHeaders }),
        fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/events`, { headers: authHeaders }),
      ]);
      setDocs(d.items || []);
      setEvents(ev.items || []);
    } catch (e) {
      setDocs([]);
      setEvents([]);
      alert(`No se pudieron cargar docs/logs: ${e.message}`);
    }
  }

  async function presignAndOpen(bucket, key) {
    const url = `${API}/files/presign?case_id=${encodeURIComponent(selectedCase)}&bucket=${encodeURIComponent(
      bucket
    )}&key=${encodeURIComponent(key)}`;
    const data = await fetchJson(url);
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function markSubmitted() {
    if (!selectedCase) return;

    try {
      const fd = new FormData();
      fd.append("channel", "DGT");
      if (registro) fd.append("registro", registro);
      if (note) fd.append("note", note);

      await fetchJson(`${API}/ops/cases/${encodeURIComponent(selectedCase)}/mark-submitted`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });

      alert("✅ Caso marcado como PRESENTADO");
      setRegistro("");
      setNote("");
      await loadQueue();
      await loadCaseExtras(selectedCase);
    } catch (e) {
      alert(e.message);
    }
  }

  async function uploadJustificante() {
    if (!selectedCase) return alert("Selecciona un case_id");
    if (!justificante) return alert("Selecciona un archivo");

    setJustUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", justificante);

      await fetchJson(`${API}/ops/cases/${encodeURIComponent(selectedCase)}/upload-justificante`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });

      alert("📎 Justificante subido");
      setJustificante(null);
      await loadCaseExtras(selectedCase);
    } catch (e) {
      alert(e.message);
    } finally {
      setJustUploading(false);
    }
  }

  // Login por PIN: backend devuelve token real
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

  // -----------------------
  // LOGIN SCREEN
  // -----------------------
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold mb-3">Acceso Operador</h1>
          <p className="text-sm text-gray-600 mb-4">
            Introduce tu <strong>PIN</strong> (el backend te devolverá el token real).
          </p>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN operador"
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button className="mt-4 w-full bg-black text-white rounded px-4 py-2 text-sm" onClick={loginWithPin}>
            Entrar
          </button>

          <div className="mt-4 text-xs text-gray-500">
            Si ya tenías token guardado, puedes recargar. Para limpiar: borra <code>ops_token</code> del localStorage.
          </div>
        </div>
      </div>
    );
  }

  // -----------------------
  // DASHBOARD
  // -----------------------
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

        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4 items-center">
          <label className="text-sm">Estado:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="ready_to_submit">ready_to_submit</option>
            <option value="submitted">submitted</option>
            <option value="generated">generated</option>
          </select>

          <button onClick={loadQueue} className="bg-black text-white rounded px-3 py-1 text-sm">
            Refrescar
          </button>

          {loading && <span className="text-sm text-gray-500">Cargando…</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

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
                      <Link to={`/ops/case/${c.case_id}`} className="text-xs                        underline">
                       Abrir
                      </Link>

                    >
                      Abrir
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

        {selectedCase && (
          <div className="bg-white rounded-xl shadow p-4 mt-6">
            <h2 className="font-semibold mb-2">Caso {selectedCase}</h2>

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
              <button onClick={markSubmitted} className="bg-green-600 text-white rounded px-4 py-2 text-sm">
                Marcar como presentado
              </button>

              <input
                type="file"
                onChange={(e) => setJustificante(e.target.files?.[0] || null)}
                className="text-sm"
              />

              <button
                onClick={uploadJustificante}
                disabled={justUploading}
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm"
              >
                {justUploading ? "Subiendo…" : "Subir justificante"}
              </button>

              <button onClick={() => setSelectedCase(null)} className="text-sm underline text-gray-600">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-3">
                <div className="font-semibold text-sm mb-2">Documentos</div>
                {!docs.length && <div className="text-sm text-gray-500">—</div>}
                <div className="grid gap-2">
                  {docs.map((d, idx) => (
                    <button
                      key={`${d.key}-${idx}`}
                      className="text-left border rounded-lg px-3 py-2 text-xs hover:bg-gray-50"
                      onClick={() => presignAndOpen(d.bucket, d.key)}
                      title="Descargar"
                    >
                      <div className="font-mono">{d.kind}</div>
                      <div className="text-gray-500">
                        {d.bucket}/{d.key}
                      </div>
                      <div className="text-gray-500">{fmt(d.created_at)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border rounded-xl p-3">
                <div className="font-semibold text-sm mb-2">Logs</div>
                {!events.length && <div className="text-sm text-gray-500">—</div>}
                <div className="grid gap-2 max-h-72 overflow-auto">
                  {events.map((ev, idx) => (
                    <div key={idx} className="border rounded-lg px-3 py-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <div className="font-mono">{ev.type}</div>
                        <div className="text-gray-500">{fmt(ev.created_at)}</div>
                      </div>
                      {!!ev.payload && (
                        <pre className="mt-2 text-[11px] bg-gray-50 p-2 rounded overflow-auto">
                          {typeof ev.payload === "string" ? ev.payload : JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
