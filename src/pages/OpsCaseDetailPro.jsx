import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = "/api";

const FAMILY_OPTIONS = [
  { value: "velocidad", label: "⚡ Velocidad" },
  { value: "movil", label: "📱 Móvil" },
  { value: "auriculares", label: "🎧 Auriculares" },
  { value: "cinturon", label: "🪢 Cinturón" },
  { value: "semaforo", label: "🚦 Semáforo" },
  { value: "marcas_viales", label: "🛣️ Marcas viales" },
  { value: "casco", label: "🪖 Casco" },
  { value: "seguro", label: "🛡️ Seguro" },
  { value: "itv", label: "🧰 ITV" },
  { value: "condiciones_vehiculo", label: "🚗 Condiciones vehículo" },
  { value: "carril", label: "↔️ Carril" },
  { value: "atencion", label: "👀 Atención" },
];

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || `Error HTTP ${r.status}`);
  return data;
}

async function fetchJsonAllow404(url, options = {}) {
  const r = await fetch(url, options);
  if (r.status === 404) return { __not_found__: true };
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

function compactAction(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.action || value.accion || value.name || value.title || JSON.stringify(value);
  }
  return String(value);
}

function normalizeAction(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return value.action || value.accion || value.name || value.title || JSON.stringify(value);
  }
  const text = String(value);
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed.action || parsed.accion || parsed.name || parsed.title || text;
    }
  } catch {}
  return text;
}

function shortText(value, max = 72) {
  const text = String(value || "").trim();
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function infractionLabel(value) {
  const map = {
    velocidad: "Velocidad",
    movil: "Móvil",
    auriculares: "Auriculares",
    cinturon: "Cinturón",
    semaforo: "Semáforo",
    marcas_viales: "Marcas viales",
    casco: "Casco",
    seguro: "Seguro",
    itv: "ITV",
    condiciones_vehiculo: "Condiciones vehículo",
    carril: "Carril",
    atencion: "Atención",
  };
  return map[value] || value || "—";
}

function infractionEmoji(value) {
  const map = {
    velocidad: "⚡",
    movil: "📱",
    auriculares: "🎧",
    cinturon: "🪢",
    semaforo: "🚦",
    marcas_viales: "🛣️",
    casco: "🪖",
    seguro: "🛡️",
    itv: "🧰",
    condiciones_vehiculo: "🚗",
    carril: "↔️",
    atencion: "👀",
  };
  return map[value] || "📄";
}

function toneForAction(value) {
  const v = String(value || "").toUpperCase();
  if (v.includes("ALEGACIONES") || v.includes("RECURSO")) return "info";
  if (v.includes("ARCHIVO")) return "success";
  return "default";
}

function readAi(ai) {
  if (!ai || typeof ai !== "object") {
    return { familia: "", confianza: "", hecho: "", admisibilidad: "", accion: "" };
  }

  const familia = firstNonEmpty(
    ai.ai_overrides?.familia,
    getByPath(ai, "classifier_result.family"),
    getByPath(ai, "classifier_result.familia"),
    getByPath(ai, "classification.family"),
    getByPath(ai, "classification.familia"),
    ai.familia,
    ai.family,
    ai.familia_resuelta,
    ai.tipo_infraccion,
    deepFindFirst(ai, ["family", "familia", "familia_correcta", "detected_family"])
  );

  const confianza = firstNonEmpty(
    getByPath(ai, "classifier_result.confidence"),
    getByPath(ai, "classifier_result.score"),
    getByPath(ai, "classification.confidence"),
    getByPath(ai, "classification.score"),
    ai.confianza,
    ai.confidence,
    ai.tipo_infraccion_confidence,
    deepFindFirst(ai, ["confidence", "confianza", "score", "probability"])
  );

  const hecho = firstNonEmpty(
    ai.ai_overrides?.hecho,
    getByPath(ai, "arguments.hecho"),
    getByPath(ai, "arguments.hecho_imputado"),
    getByPath(ai, "result.hecho"),
    ai.hecho,
    ai.hecho_para_recurso,
    ai.hecho_imputado,
    deepFindFirst(ai, ["hecho", "hecho_imputado", "fact", "facts", "literal", "descripcion"])
  );

  const admisibilidad = firstNonEmpty(
    getByPath(ai, "admissibility.admissibility"),
    getByPath(ai, "result.admissibility"),
    ai.admissibility,
    ai.admisibilidad,
    ai.admissibility_panel,
    deepFindFirst(ai, ["admissibility", "admisibilidad", "status"])
  );

  const accion = firstNonEmpty(
    getByPath(ai, "phase.recommended_action.action"),
    getByPath(ai, "recommended_action.action"),
    getByPath(ai, "result.recommended_action"),
    ai.recommended_action,
    ai.accion_recomendada,
    ai.accion_panel,
    deepFindFirst(ai, ["recommended_action", "accion_recomendada", "action"])
  );

  return {
    familia: typeof familia === "object" ? JSON.stringify(familia) : String(familia || ""),
    confianza: typeof confianza === "object" ? "" : String(confianza || ""),
    hecho: typeof hecho === "object" ? JSON.stringify(hecho) : String(hecho || ""),
    admisibilidad: typeof admisibilidad === "object" ? "" : String(admisibilidad || ""),
    accion: normalizeAction(compactAction(accion)),
  };
}

function StatCard({ title, value, tone = "default", compact = false }) {
  const tones = {
    default: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${tones[tone] || tones.default}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-70">{title}</div>
      <div className={`mt-2 font-semibold break-words ${compact ? "text-sm leading-5" : "text-lg leading-tight"}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function Section({ title, children, right = null }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoPill({ children, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}

function DownloadButton({ docId }) {
  const token = localStorage.getItem("ops_token") || "";

  async function handleDownload() {
    try {
      const res = await fetch(`${API}/ops/documents/${encodeURIComponent(docId)}/download`, {
        headers: { "X-Operator-Token": token },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Error descargando documento");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "documento";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Error descargando documento");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      Descargar
    </button>
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
  const [busySave, setBusySave] = useState(false);
  const [pollingMsg, setPollingMsg] = useState("");
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const [hechoEdit, setHechoEdit] = useState("");
  const [familiaEdit, setFamiliaEdit] = useState("");
  const [saveReason, setSaveReason] = useState("Corrección operador");
  const [checkPdf, setCheckPdf] = useState(false);
  const [checkHecho, setCheckHecho] = useState(false);
  const [checkFamilia, setCheckFamilia] = useState(false);
  const [checkPlazos, setCheckPlazos] = useState(false);
  const [checkCanal, setCheckCanal] = useState(false);

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
    if (!silent) {
      setError("");
      setSaveMsg("");
    }
    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
      return { docs: [], evs: [], aiEvent: null };
    }
    if (!silent) setLoading(true);

    try {
      const docsRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/documents`, { headers });
      const evRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/events`, { headers });

      const detailRes = await fetchJsonAllow404(`${API}/ops/cases/${encodeURIComponent(caseId)}`, { headers });
      const overridesRes = await fetchJsonAllow404(`${API}/ops/cases/${encodeURIComponent(caseId)}/ai-overrides`, { headers });

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];
      const aiEvent = pickLatestAiEvent(evs);

      const payload = {
        ...(aiEvent?.payload || {}),
        ai_overrides: overridesRes?.__not_found__
          ? (detailRes?.ai_overrides || {})
          : (overridesRes?.overrides || detailRes?.ai_overrides || {}),
      };

      setDocuments(docs);
      setEvents(evs);
      setAiResult(payload);

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
    setSaveMsg("");
    setPollingMsg("");
    if (!token) return setError("Falta token de operador.");

    setRunningAI(true);
    try {
      await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
      await loadCase();
      setPollingMsg("✅ IA completada.");
      setTimeout(() => setPollingMsg(""), 2500);
    } catch (e) {
      const msg = e.message || "";
      const is502 = msg.includes("502") || msg.includes("Error HTTP 502");

      if (is502) {
        setPollingMsg("La IA sigue ejecutándose. Comprobando resultado…");
        await pollForAiResult();
      } else {
        setError(msg || "Error ejecutando IA");
      }
    } finally {
      setRunningAI(false);
    }
  }

  async function saveAiChanges() {
    setError("");
    setSaveMsg("");
    if (!token) return setError("Falta token de operador.");
    if (!saveReason || saveReason.trim().length < 3) {
      return setError("Indica un motivo de al menos 3 caracteres.");
    }

    setBusySave(true);
    try {
      const saveRes = await fetch(`${API}/ops/cases/${encodeURIComponent(caseId)}/save-ai-overrides`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          familia: familiaEdit || null,
          hecho: hechoEdit || null,
          motivo: saveReason,
        }),
      });

      if (saveRes.status === 404) {
        setError("El backend aún no tiene activa la ruta save-ai-overrides. Hay que desplegar el router nuevo.");
        return;
      }

      const data = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) throw new Error(data?.detail || `Error HTTP ${saveRes.status}`);

      await loadCase({ silent: true });
      setSaveMsg("✅ Cambios IA guardados en backend.");
      setTimeout(() => setSaveMsg(""), 3500);
    } catch (e) {
      setError(e.message || "Error guardando cambios IA");
    } finally {
      setBusySave(false);
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

  useEffect(() => {
    setHechoEdit(ai.hecho || "");
    setFamiliaEdit(ai.familia || "");
  }, [ai.hecho, ai.familia]);

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

  const familyTone = familiaEdit ? "info" : "default";
  const actionTone = toneForAction(ai.accion);

  const checklistOk = [checkPdf, checkHecho, checkFamilia, checkPlazos, checkCanal].filter(Boolean).length;
  const checklistTotal = 5;
  const latestThreeDocs = documents.slice(0, 3);

  return (
    <div className="sr-container" style={{ paddingTop: 18, paddingBottom: 40 }}>
      <div className="rounded-[22px] bg-slate-950 px-4 py-4 text-white shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Modo operador PRO</div>
            <h1 className="mt-1 text-2xl font-semibold">Panel de validación</h1>
            <p className="mt-2 text-xs text-slate-300 break-all">Expediente: {caseId}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="min-w-[118px] rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              onClick={() => loadCase()}
            >
              {loading ? "Recargando..." : "Recargar"}
            </button>
            <button
              className="min-w-[146px] rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              onClick={runAI}
              disabled={runningAI}
            >
              {runningAI ? "Ejecutando IA..." : "Ejecutar IA"}
            </button>
            <button
              className="min-w-[146px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={saveAiChanges}
              disabled={busySave}
            >
              {busySave ? "Guardando..." : "Guardar cambios IA"}
            </button>
            <button
              className="min-w-[118px] rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              onClick={approve}
              disabled={busyApprove}
            >
              {busyApprove ? "Aprobando..." : "Aprobar"}
            </button>
            <button
              className="min-w-[118px] rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              onClick={manual}
              disabled={busyManual}
            >
              {busyManual ? "Enviando..." : "Manual"}
            </button>
            <Link
              to={`/ops/case/${caseId}`}
              className="min-w-[118px] rounded-xl bg-slate-800 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-700"
            >
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

      {saveMsg ? (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {saveMsg}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <b>Última IA ejecutada:</b> {latestAiEvent ? fmt(latestAiEvent.created_at) : "—"}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Familia" value={`${infractionEmoji(familiaEdit)} ${infractionLabel(familiaEdit)}`} tone={familyTone} compact />
        <StatCard title="Confianza" value={confianzaPct} compact />
        <StatCard title="Admisibilidad" value={ai.admisibilidad || "—"} tone={aiTone} compact />
        <StatCard title="Acción" value={shortText(ai.accion, 42)} tone={actionTone} compact />
        <StatCard title="Documentos" value={String(documents.length)} compact />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Section
          title="Resultado IA"
          right={
            <div className="flex items-center gap-2">
              <InfoPill tone={familyTone}>{infractionEmoji(familiaEdit)} {infractionLabel(familiaEdit)}</InfoPill>
              <InfoPill tone={aiTone}>{ai.admisibilidad || "—"}</InfoPill>
            </div>
          }
        >
          {!aiResult ? (
            <p className="text-slate-500">No hay resultado IA todavía.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Hecho imputado</div>
                <textarea
                  value={hechoEdit}
                  onChange={(e) => setHechoEdit(e.target.value)}
                  className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 text-slate-900 outline-none"
                />
                <div className="mt-2 text-xs text-slate-500">
                  Puedes corregir el hecho imputado y guardarlo en backend cuando esté activa la ruta.
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Familia</div>
                  <select
                    value={familiaEdit}
                    onChange={(e) => setFamiliaEdit(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none"
                  >
                    <option value="">Selecciona familia</option>
                    {FAMILY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-xs text-slate-500">
                    Si backend nuevo no está desplegado, la pantalla seguirá funcionando.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Motivo del cambio</div>
                  <input
                    value={saveReason}
                    onChange={(e) => setSaveReason(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none"
                    placeholder="Ej.: OCR defectuoso / familia corregida por operador"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Se usará cuando la ruta backend esté activa.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Acción recomendada</div>
                <div className="mt-2 max-h-24 overflow-auto text-sm font-medium leading-6 text-slate-900">
                  {ai.accion || "—"}
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Último regenerado">
          {documents.length === 0 ? (
            <p className="text-slate-500">No hay documentos.</p>
          ) : (
            <div className="space-y-2.5">
              {latestThreeDocs.map((d, i) => (
                <div key={d?.id || i} className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {(d.kind || "documento").includes("pdf")
                      ? "PDF"
                      : (d.kind || "documento").includes("docx")
                      ? "DOCX"
                      : "DOC"}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{d.kind || "documento"}</div>
                  <div className="mt-1 text-xs text-slate-500">{fmt(d.created_at)}</div>
                  <div className="mt-2">
                    {d.id ? <DownloadButton docId={d.id} /> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Section
          title="Checklist antes de aprobar"
          right={<InfoPill tone={checklistOk === checklistTotal ? "success" : "warn"}>{checklistOk}/{checklistTotal}</InfoPill>}
        >
          <div className="space-y-2.5">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <input type="checkbox" checked={checkPdf} onChange={() => setCheckPdf(!checkPdf)} className="mt-1" />
              <div>
                <div className="font-semibold text-slate-900">He leído el último PDF regenerado</div>
                <div className="text-xs text-slate-500">Nunca aprobar sin abrir el PDF final.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <input type="checkbox" checked={checkHecho} onChange={() => setCheckHecho(!checkHecho)} className="mt-1" />
              <div>
                <div className="font-semibold text-slate-900">El hecho denunciado es correcto y limpio</div>
                <div className="text-xs text-slate-500">Debe reflejar la conducta real sin ruido OCR.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <input type="checkbox" checked={checkFamilia} onChange={() => setCheckFamilia(!checkFamilia)} className="mt-1" />
              <div>
                <div className="font-semibold text-slate-900">La familia jurídica es la correcta</div>
                <div className="text-xs text-slate-500">Semáforo, velocidad, móvil, etc.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <input type="checkbox" checked={checkPlazos} onChange={() => setCheckPlazos(!checkPlazos)} className="mt-1" />
              <div>
                <div className="font-semibold text-slate-900">He revisado los plazos del expediente</div>
                <div className="text-xs text-slate-500">Plazo inicial y, si aplica, plazo post-presentación.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <input type="checkbox" checked={checkCanal} onChange={() => setCheckCanal(!checkCanal)} className="mt-1" />
              <div>
                <div className="font-semibold text-slate-900">Sé por qué canal se va a presentar</div>
                <div className="text-xs text-slate-500">DGT, sede electrónica, registro, CSV, etc.</div>
              </div>
            </label>
          </div>
        </Section>

        <Section title="Guía rápida operador">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Orden correcto del trabajo</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                <li>Revisar el hecho denunciado y la familia detectada.</li>
                <li>Descargar y leer el último PDF regenerado antes de aprobar.</li>
                <li>Si hay duda de encaje jurídico o de prueba, usar Manual.</li>
                <li>Si todo está correcto, aprobar y continuar con la presentación.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Cuándo tocar el hecho imputado</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                <li>Si ves ruido OCR o texto mezclado.</li>
                <li>Si el hecho está jurídicamente bien pero mal redactado.</li>
                <li>Si quieres una versión más limpia para revisión interna.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Cuándo usar Manual</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                <li>Cuando la familia no convence.</li>
                <li>Cuando el PDF final no refleja bien el caso.</li>
                <li>Cuando falte prueba, plazo o canal claro de presentación.</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Section title={`Documentos (${documents.length})`}>
          {documents.length === 0 ? (
            <p className="text-slate-500">No hay documentos.</p>
          ) : (
            <div className="space-y-2.5">
              {documents.map((d, i) => (
                <div key={d?.id || i} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{d.kind || "documento"}</div>
                      <div className="mt-1 text-xs text-slate-500 break-all">{d.bucket}/{d.key}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {d.mime || "—"} · {d.size_bytes ? `${d.size_bytes} bytes` : "—"} · {fmt(d.created_at)}
                      </div>
                    </div>
                    {d.id ? <DownloadButton docId={d.id} /> : null}
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
            <div className="space-y-2.5">
              {events.map((e, i) => (
                <div key={`${e?.type || "evento"}-${i}`} className="rounded-2xl border border-slate-200 p-3">
                  <button
                    type="button"
                    onClick={() => setOpenEvent(openEvent === i ? null : i)}
                    className="w-full text-left"
                  >
                    <div className="text-sm font-semibold text-slate-900">{e.type || "evento"}</div>
                    <div className="mt-1 text-xs text-slate-500">{fmt(e.created_at)}</div>
                    <div className="mt-2 text-xs text-blue-600">
                      {openEvent === i ? "Ocultar detalle" : "Ver detalle"}
                    </div>
                  </button>

                  {openEvent === i ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-700">
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
            <summary className="cursor-pointer list-none px-4 py-3 text-base font-semibold text-slate-900">
              Payload IA bruto
            </summary>
            <div className="border-t border-slate-100 p-4">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-700">
                {JSON.stringify(aiResult, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}