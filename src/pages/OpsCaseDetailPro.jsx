import React, { useEffect, useMemo, useRef, useState } from "react";
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

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function getByPath(obj, path) {
  try {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  } catch {
    return undefined;
  }
}

function deepFindFirst(obj, wantedKeys) {
  const seen = new Set();

  function walk(node) {
    if (node == null) return undefined;
    if (typeof node !== "object") return undefined;
    if (seen.has(node)) return undefined;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found !== undefined && found !== null && String(found).trim() !== "") return found;
      }
      return undefined;
    }

    for (const key of wantedKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const value = node[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") return value;
      }
    }

    for (const value of Object.values(node)) {
      const found = walk(value);
      if (found !== undefined && found !== null && String(found).trim() !== "") return found;
    }

    return undefined;
  }

  return walk(obj);
}

function readAi(ai) {
  if (!ai || typeof ai !== "object") {
    return { familia: "", confianza: "", hecho: "", admisibilidad: "", accion: "" };
  }

  const familia = firstNonEmpty(
    getByPath(ai, "classifier_result.family"),
    getByPath(ai, "classifier_result.familia"),
    getByPath(ai, "classification.family"),
    getByPath(ai, "classification.familia"),
    getByPath(ai, "arguments.family"),
    getByPath(ai, "arguments.familia"),
    getByPath(ai, "resultado.familia"),
    getByPath(ai, "result.family"),
    ai.familia,
    ai.family,
    deepFindFirst(ai, ["family", "familia", "familia_correcta", "detected_family"])
  );

  const confianza = firstNonEmpty(
    getByPath(ai, "classifier_result.confidence"),
    getByPath(ai, "classifier_result.score"),
    getByPath(ai, "classification.confidence"),
    getByPath(ai, "classification.score"),
    getByPath(ai, "arguments.confidence"),
    getByPath(ai, "arguments.score"),
    getByPath(ai, "resultado.confianza"),
    ai.confianza,
    ai.confidence,
    deepFindFirst(ai, ["confidence", "confianza", "score", "probability"])
  );

  const hecho = firstNonEmpty(
    getByPath(ai, "arguments.hecho"),
    getByPath(ai, "arguments.hecho_imputado"),
    getByPath(ai, "arguments.fact"),
    getByPath(ai, "arguments.facts"),
    getByPath(ai, "arguments.literal"),
    getByPath(ai, "arguments.descripcion"),
    getByPath(ai, "resultado.hecho"),
    getByPath(ai, "result.hecho"),
    getByPath(ai, "result.fact"),
    ai.hecho,
    ai.hecho_para_recurso,
    ai.detected_facts,
    deepFindFirst(ai, ["hecho", "hecho_imputado", "fact", "facts", "literal", "descripcion", "hecho_denunciado_limpio"])
  );

  const admisibilidad = firstNonEmpty(
    getByPath(ai, "admissibility.admissibility"),
    getByPath(ai, "resultado.admisibilidad"),
    getByPath(ai, "result.admissibility"),
    ai.admissibility,
    ai.admisibilidad,
    deepFindFirst(ai, ["admissibility", "admisibilidad", "status"])
  );

  const accion = firstNonEmpty(
    getByPath(ai, "phase.recommended_action.action"),
    getByPath(ai, "recommended_action.action"),
    getByPath(ai, "resultado.accion_recomendada"),
    getByPath(ai, "result.recommended_action"),
    ai.recommended_action,
    ai.accion_recomendada,
    deepFindFirst(ai, ["recommended_action", "accion_recomendada", "action"])
  );

  return {
    familia: typeof familia === "object" ? JSON.stringify(familia) : String(familia || ""),
    confianza: typeof confianza === "object" ? "" : String(confianza || ""),
    hecho: typeof hecho === "object" ? JSON.stringify(hecho) : String(hecho || ""),
    admisibilidad: typeof admisibilidad === "object" ? "" : String(admisibilidad || ""),
    accion: typeof accion === "object" ? JSON.stringify(accion) : String(accion || ""),
  };
}

function StatCard({ title, value, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || tones.default}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
      <div className="mt-2 text-2xl font-semibold break-words">{value || "—"}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
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
  const [openEvent, setOpenEvent] = useState(null);

  const [loading, setLoading] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [busyApprove, setBusyApprove] = useState(false);
  const [busyManual, setBusyManual] = useState(false);
  const [pollingMsg, setPollingMsg] = useState("");
  const [error, setError] = useState("");

  const pollTimerRef = useRef(null);

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  function clearPollTimer() {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  function pickLatestAiEvent(evs) {
    return [...(evs || [])].find((e) => e?.type === "ai_expediente_result") || null;
  }

  async function loadCase({ silent = false } = {}) {
    if (!silent) setError("");
    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
      return { docs: [], evs: [], aiEvent: null };
    }
    if (!silent) setLoading(true);

    try {
      const docsRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/documents`, { headers });
      const evRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/events`, { headers });

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];
      const aiEvent = pickLatestAiEvent(evs);

      setDocuments(docs);
      setEvents(evs);
      setAiResult(aiEvent?.payload || null);

      return { docs, evs, aiEvent };
    } catch (e) {
      if (!silent) setError(e.message || "Error cargando expediente");
      if (!silent) {
        setDocuments([]);
        setEvents([]);
        setAiResult(null);
      }
      return { docs: [], evs: [], aiEvent: null };
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
    return () => clearPollTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function pollForAiResult() {
    clearPollTimer();
    const start = Date.now();
    const maxMs = 180000;
    const intervalMs = 6000;

    async function step() {
      const { aiEvent } = await loadCase({ silent: true });
      if (aiEvent) {
        setPollingMsg("✅ Resultado IA actualizado.");
        clearPollTimer();
        setTimeout(() => setPollingMsg(""), 2500);
        return;
      }

      if (Date.now() - start > maxMs) {
        setPollingMsg("");
        setError("La IA parece haber tardado demasiado. Recarga el expediente para comprobar si terminó.");
        clearPollTimer();
        return;
      }

      setPollingMsg("La IA sigue procesando. Comprobando resultado…");
      pollTimerRef.current = setTimeout(step, intervalMs);
    }

    await step();
  }

  async function runAI() {
    setError("");
    setPollingMsg("");
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
      setPollingMsg("✅ IA completada.");
      setTimeout(() => setPollingMsg(""), 2500);
    } catch (e) {
      const msg = e.message || "";
      const is502 = msg.includes("502") || msg.includes("Error HTTP 502");

      if (is502) {
        setPollingMsg("La IA puede seguir ejecutándose aunque el navegador haya visto un 502. Comprobando resultado…");
        await pollForAiResult();
      } else {
        setError(msg || "Error ejecutando IA");
      }
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

  const latestAiEvent = useMemo(() => pickLatestAiEvent(events), [events]);

  const confianzaNum = Number(ai.confianza);
  const confianzaPct = Number.isFinite(confianzaNum)
    ? confianzaNum <= 1
      ? `${Math.round(confianzaNum * 100)}%`
      : `${Math.round(confianzaNum)}%`
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
            <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100" onClick={() => loadCase()}>
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

      {pollingMsg ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pollingMsg}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <b>Última IA ejecutada:</b> {latestAiEvent ? fmt(latestAiEvent.created_at) : "—"}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Familia" value={ai.familia || "—"} />
        <StatCard title="Confianza" value={confianzaPct} />
        <StatCard title="Admisibilidad" value={ai.admisibilidad || "—"} tone={aiTone} />
        <StatCard title="Acción" value={ai.accion || "—"} />
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

        <Section title="Último regenerado">
          {documents.length === 0 ? (
            <p className="text-slate-500">No hay documentos.</p>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 3).map((d, i) => (
                <div key={d?.id || i} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {(d.kind || "documento").includes("pdf") ? "PDF" : (d.kind || "documento").includes("docx") ? "DOCX" : "DOC"}
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">{d.kind || "documento"}</div>
                  <div className="mt-1 text-sm text-slate-500">{fmt(d.created_at)}</div>
                </div>
              ))}
            </div>
          )}
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
                <div key={`${e?.type || "evento"}-${i}`} className="rounded-2xl border border-slate-200 p-4">
                  <button
                    type="button"
                    onClick={() => setOpenEvent(openEvent === i ? null : i)}
                    className="w-full text-left"
                  >
                    <div className="font-semibold text-slate-900">{e.type || "evento"}</div>
                    <div className="mt-1 text-sm text-slate-500">{fmt(e.created_at)}</div>
                    <div className="mt-2 text-xs text-blue-600">
                      {openEvent === i ? "Ocultar detalle" : "Ver detalle"}
                    </div>
                  </button>

                  {openEvent === i ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                        {JSON.stringify(e.payload || {}, null, 2)}
                      </pre>
                    </div>
                  ) : null}
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
