import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || `Error HTTP ${r.status}`);
  return data;
}

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function pretty(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function guessFilename(doc) {
  const key = doc?.key || "";
  const fromKey = key.split("/").pop();
  if (fromKey) return fromKey;
  const kind = (doc?.kind || "documento").toLowerCase();
  if (kind.includes("pdf")) return "documento.pdf";
  if (kind.includes("docx")) return "documento.docx";
  return "documento.bin";
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  async function loadCase() {
    setError("");

    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
      return;
    }

    setLoading(true);
    try {
      const docsRes = await fetchJson(
        `${API}/ops/cases/${encodeURIComponent(caseId)}/documents`,
        { headers }
      );

      const evRes = await fetchJson(
        `${API}/ops/cases/${encodeURIComponent(caseId)}/events`,
        { headers }
      );

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];

      setDocuments(docs);
      setEvents(evs);

      const aiEvent = evs.find((e) => e.type === "ai_expediente_result");
      setAiResult(aiEvent?.payload || null);
    } catch (e) {
      setError(e.message || "Error cargando expediente");
      setDocuments([]);
      setEvents([]);
      setAiResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function runAI() {
    setError("");

    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
      return;
    }

    setRunningAI(true);
    try {
      const data = await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });

      setAiResult(data);
      await loadCase();
    } catch (e) {
      setError(e.message || "Error ejecutando IA");
    } finally {
      setRunningAI(false);
    }
  }

  return (
    <div className="min-h-screen bg-white p-6 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Modo operador PRO</h1>
            <p className="mt-1 text-sm text-zinc-600">Expediente: {caseId}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadCase}
              className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-300"
            >
              Recargar
            </button>

            <button
              onClick={runAI}
              disabled={runningAI}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {runningAI ? "Ejecutando IA..." : "Ejecutar IA"}
            </button>

            <Link
              to={`/ops/case/${caseId}`}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Volver al detalle normal
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border p-4">Cargando datos del expediente...</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Resultado IA</h2>

                {!aiResult ? (
                  <div className="text-sm text-zinc-600">
                    ⚠️ No hay resultado IA todavía
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><b>Familia:</b> {pretty(aiResult.familia_detectada || aiResult.familia)}</p>
                    <p><b>Confianza:</b> {pretty(aiResult.confianza || aiResult.confidence)}</p>
                    <p><b>Hecho:</b> {pretty(aiResult.hecho || aiResult.hecho_para_recurso)}</p>
                  </div>
                )}
              </section>

              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Resumen técnico</h2>
                <div className="space-y-2 text-sm">
                  <p><b>Eventos:</b> {events.length}</p>
                  <p><b>Documentos:</b> {documents.length}</p>
                  <p><b>Token OPS:</b> {token ? "OK" : "No encontrado"}</p>
                </div>
              </section>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Documentos</h2>

                {documents.length === 0 ? (
                  <div className="text-sm text-zinc-600">No hay documentos</div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, i) => (
                      <div key={doc?.id || i} className="rounded border p-3 text-sm">
                        <div><b>Nombre:</b> {guessFilename(doc)}</div>
                        <div><b>Tipo:</b> {pretty(doc?.mime || doc?.mime_type || doc?.kind)}</div>
                        <div><b>Fecha:</b> {fmt(doc?.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Eventos</h2>

                {events.length === 0 ? (
                  <div className="text-sm text-zinc-600">No hay eventos</div>
                ) : (
                  <div className="space-y-3">
                    {events.map((evt, i) => (
                      <div key={evt?.id || i} className="rounded border p-3 text-sm">
                        <div><b>Tipo:</b> {pretty(evt?.type)}</div>
                        <div><b>Fecha:</b> {fmt(evt?.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="mt-4 rounded border p-4">
              <h2 className="mb-3 text-lg font-semibold">Payload IA bruto</h2>
              {!aiResult ? (
                <div className="text-sm text-zinc-600">No disponible</div>
              ) : (
                <pre className="overflow-x-auto rounded bg-zinc-100 p-3 text-xs">
                  {JSON.stringify(aiResult, null, 2)}
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}