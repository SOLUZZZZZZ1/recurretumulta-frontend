import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

function first(...v) {
  return v.find((x) => x !== undefined && x !== null && x !== "") || "";
}

function readAi(ai) {
  if (!ai || typeof ai !== "object") {
    return { familia: "", confianza: "", hecho: "", admisibilidad: "", accion: "" };
  }
  return {
    familia: first(
      ai.familia_detectada,
      ai.familia,
      ai.family,
      ai?.classification?.family,
      ai?.classifier_result?.family
    ),
    confianza: first(
      ai.confianza,
      ai.confidence,
      ai?.classification?.confidence,
      ai?.classifier_result?.confidence
    ),
    hecho: first(
      ai.hecho,
      ai.hecho_para_recurso,
      ai.facts,
      ai.detected_facts
    ),
    admisibilidad: first(
      ai?.admissibility?.admissibility,
      ai?.admissibility
    ),
    accion: first(
      ai?.phase?.recommended_action?.action,
      ai?.recommended_action?.action,
      ai?.recommended_action
    ),
  };
}

function StatCard({ title, value, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    dark: "border-slate-800 bg-slate-900 text-white",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || tones.default}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value || "—"}</div>
    </div>
  );
}

function Section({ title, children, right = null }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [busyApprove, setBusyApprove] = useState(false);
  const [busyManual, setBusyManual] = useState(false);
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
      const docsRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/documents`, { headers });
      const evRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/events`, { headers });

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];

      setDocuments(docs);
      setEvents(evs);

      const aiEvent = [...evs].reverse().find((e) => e?.type === "ai_expediente_result");
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
    if (!token) return setError("Falta token de operador.");
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

  async function approve() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    setBusyApprove(true);
    try {
      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/approve`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Aprobado desde PRO" }),
      });
      await loadCase();
      alert("Expediente aprobado");
    } catch (e) {
      setError(e.message || "Error aprobando expediente");
    } finally {
      setBusyApprove(false);
    }
  }

  async function manual() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    setBusyManual(true);
    try {
      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/manual`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: "Revisión manual desde PRO" }),
      });
      await loadCase();
      alert("Expediente enviado a revisión manual");
    } catch (e) {
      setError(e.message || "Error enviando a revisión manual");
    } finally {
      setBusyManual(false);
    }
  }

  const ai = useMemo(() => readAi(aiResult), [aiResult]);

  const confianzaNum = Number(ai.confianza);
  const confianzaPct = Number.isFinite(confianzaNum)
    ? (confianzaNum <= 1 ? `${Math.round(confianzaNum * 100)}%` : `${Math.round(confianzaNum)}%`)
    : ai.confianza || "—";

  const aiTone =
    ai.admisibilidad === "ADMISSIBLE"
      ? "success"
      : ai.admisibilidad === "NOT_ADMISSIBLE"
      ? "warn"
      : "default";

  return (
    <div className="sr-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="rounded-[28px] bg-slate-950 px-6 py-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-slate-300">Modo operador PRO</div>
            <h1 className="mt-2 text-4xl font-semibold">Panel de validación</h1>
            <p className="mt-3 text-sm text-slate-300 break-all">Expediente: {caseId}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100" onClick={loadCase}>
              {loading ? "Recargando..." : "Recargar"}
            </button>
            <button
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              onClick={runAI}
              disabled={runningAI}
            >
              {runningAI ? "Ejecutando IA..." : "Ejecutar IA"}
            </button>
            <button
              className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              onClick={approve}
              disabled={busyApprove}
            >
              {busyApprove ? "Aprobando..." : "Aprobar"}
            </button>
            <button
              className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              onClick={manual}
              disabled={busyManual}
            >
              {busyManual ? "Enviando..." : "Manual"}
            </button>
            <Link to={`/ops/case/${caseId}`} className="rounded-2xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700">
              Volver
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Familia" value={ai.familia || "—"} />
        <StatCard title="Confianza" value={confianzaPct} />
        <StatCard title="Admisibilidad" value={ai.admisibilidad || "—"} tone={aiTone} />
        <StatCard title="Documentos" value={String(documents.length)} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Section title="Resultado IA">
          {!aiResult ? (
            <p className="text-slate-500">No hay resultado IA todavía.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Hecho</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{ai.hecho || "—"}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Familia</div>
                  <div className="mt-2 font-semibold text-slate-900">{ai.familia || "—"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Acción recomendada</div>
                  <div className="mt-2 font-semibold text-slate-900">{ai.accion || "—"}</div>
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Acciones rápidas">
          <div className="space-y-3">
            <button onClick={runAI} disabled={runningAI} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-medium hover:bg-slate-50 disabled:opacity-50">
              Reejecutar IA
            </button>
            <button onClick={approve} disabled={busyApprove} className="w-full rounded-2xl border border-emerald-500 bg-emerald-500 px-4 py-3 text-left font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
              Aprobar expediente
            </button>
            <button onClick={manual} disabled={busyManual} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-medium hover:bg-slate-50 disabled:opacity-50">
              Mandar a revisión manual
            </button>
          </div>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title={`Documentos (${documents.length})`}>
          {documents.length === 0 ? (
            <p className="text-slate-500">No hay documentos.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((d, i) => (
                <div key={d?.id || i} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">{d.kind || "documento"}</div>
                  <div className="mt-1 text-sm text-slate-500 break-all">{d.bucket}/{d.key}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {d.mime || "—"} · {d.size_bytes ? `${d.size_bytes} bytes` : "—"} · {fmt(d.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Eventos (${events.length})`}>
          {events.length === 0 ? (
            <p className="text-slate-500">No hay eventos.</p>
          ) : (
            <div className="space-y-3">
              {events.map((e, i) => (
                <div key={e?.id || i} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">{e.type || "evento"}</div>
                  <div className="mt-1 text-sm text-slate-500">{fmt(e.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {aiResult ? (
        <div className="mt-5">
          <details className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer list-none px-5 py-4 text-xl font-semibold text-slate-900">
              Payload IA bruto
            </summary>
            <div className="border-t border-slate-100 p-5">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                {JSON.stringify(aiResult, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
