import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = "https://recurretumulta-backend.onrender.com";

function getToken() {
  return localStorage.getItem("ops_token") || "";
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "X-Operator-Token": getToken(),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = JSON.parse(text);
      detail = data?.detail || detail;
    } catch {
      if (text) detail = text.slice(0, 200);
    }
    throw new Error(detail);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`La ruta ${path} no devolvió JSON válido`);
  }
}

function pretty(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [loading, setLoading] = useState(true);
  const [runningIA, setRunningIA] = useState(false);
  const [error, setError] = useState("");

  const [events, setEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [rawEventsError, setRawEventsError] = useState("");
  const [rawDocsError, setRawDocsError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    setRawEventsError("");
    setRawDocsError("");

    let eventsData = [];
    let docsData = [];

    try {
      eventsData = await apiFetch(`/ops/cases/${caseId}/events`);
      if (!Array.isArray(eventsData)) eventsData = [];
    } catch (e) {
      setRawEventsError(e.message || "No se pudieron cargar los eventos");
    }

    try {
      docsData = await apiFetch(`/ops/cases/${caseId}/documents`);
      if (!Array.isArray(docsData)) docsData = [];
    } catch (e) {
      setRawDocsError(e.message || "No se pudieron cargar los documentos");
    }

    setEvents(eventsData);
    setDocuments(docsData);
    setLoading(false);
  }

  useEffect(() => {
    if (caseId) loadData();
  }, [caseId]);

  const aiEvent = useMemo(() => {
    return events.find((e) => e?.type === "ai_expediente_result") || null;
  }, [events]);

  const aiPayload = aiEvent?.payload || null;

  async function runIA() {
    try {
      setRunningIA(true);
      setError("");

      const res = await fetch(`${API_BASE}/ai/expediente/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Operator-Token": getToken(),
        },
        body: JSON.stringify({ case_id: caseId }),
      });

      const text = await res.text();

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const data = JSON.parse(text);
          detail = data?.detail || detail;
        } catch {
          if (text) detail = text.slice(0, 200);
        }
        throw new Error(detail);
      }

      await loadData();
    } catch (e) {
      setError(e.message || "No se pudo ejecutar la IA");
    } finally {
      setRunningIA(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Modo operador PRO</h1>
            <p className="mt-1 text-sm text-zinc-600">Expediente: {caseId}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-300"
            >
              Recargar
            </button>

            <button
              onClick={runIA}
              disabled={runningIA}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {runningIA ? "Ejecutando IA..." : "Ejecutar IA"}
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

                {!aiPayload ? (
                  <div className="text-sm text-zinc-600">
                    ⚠️ No hay resultado IA todavía
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p>
                      <b>Familia:</b> {pretty(aiPayload.familia_detectada || aiPayload.familia)}
                    </p>
                    <p>
                      <b>Confianza:</b> {pretty(aiPayload.confianza || aiPayload.confidence)}
                    </p>
                    <p>
                      <b>Hecho:</b> {pretty(aiPayload.hecho || aiPayload.hecho_para_recurso)}
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Resumen técnico</h2>
                <div className="space-y-2 text-sm">
                  <p><b>Eventos:</b> {events.length}</p>
                  <p><b>Documentos:</b> {documents.length}</p>
                  <p><b>Token OPS:</b> {getToken() ? "OK" : "No encontrado en localStorage"}</p>
                  <p><b>API:</b> {API_BASE}</p>
                </div>
              </section>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Documentos</h2>

                {rawDocsError ? (
                  <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-700">
                    {rawDocsError}
                  </div>
                ) : null}

                {documents.length === 0 ? (
                  <div className="text-sm text-zinc-600">No hay documentos</div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc, i) => (
                      <div key={doc?.id || i} className="rounded border p-3 text-sm">
                        <div><b>Nombre:</b> {pretty(doc?.filename || doc?.name)}</div>
                        <div><b>Tipo:</b> {pretty(doc?.mime_type || doc?.type)}</div>
                        <div><b>ID:</b> {pretty(doc?.id)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded border p-4">
                <h2 className="mb-3 text-lg font-semibold">Eventos</h2>

                {rawEventsError ? (
                  <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-700">
                    {rawEventsError}
                  </div>
                ) : null}

                {events.length === 0 ? (
                  <div className="text-sm text-zinc-600">No hay eventos</div>
                ) : (
                  <div className="space-y-2">
                    {events.map((evt, i) => (
                      <div key={evt?.id || i} className="rounded border p-3 text-sm">
                        <div><b>Tipo:</b> {pretty(evt?.type)}</div>
                        <div><b>Fecha:</b> {pretty(evt?.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="mt-4 rounded border p-4">
              <h2 className="mb-3 text-lg font-semibold">Payload IA bruto</h2>
              {!aiPayload ? (
                <div className="text-sm text-zinc-600">No disponible</div>
              ) : (
                <pre className="overflow-x-auto rounded bg-zinc-100 p-3 text-xs">
                  {JSON.stringify(aiPayload, null, 2)}
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
