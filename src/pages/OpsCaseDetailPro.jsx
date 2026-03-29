import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OPS_HELP } from "../lib/ops_help_panel";
import ChecklistAprobacion from "../components/ChecklistAprobacion";

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
    return new Date(d).toLocaleString("es-ES");
  } catch {
    return String(d);
  }
}

function fmtDateOnly(d) {
  if (!d) return "—";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) {
      const [y, m, day] = String(d).split("-");
      return `${day}/${m}/${y}`;
    }
    return new Date(d).toLocaleDateString("es-ES");
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

  const cr = ai.classifier_result || {};
  const cl = ai.classification || {};
  const args = ai.arguments || {};
  const tags = ai.tags || {};
  const res = ai.resultado || {};
  const adm = ai.admissibility || {};
  const phase = ai.phase || {};
  const rec = ai.recommended_action || {};

  return {
    familia: first(
      cr.family, cr.familia, cr.label, cl.family, cl.familia, tags.family, tags.familia,
      args.family, args.familia, ai.familia_detectada, ai.familia, ai.family, res.familia
    ),
    confianza: first(
      cr.confidence, cr.score, cr.probability, cl.confidence, cl.score,
      args.confidence, args.score, ai.confianza, ai.confidence, res.confianza
    ),
    hecho: first(
      args.hecho, args.hecho_imputado, args.fact, args.facts, args.literal, args.descripcion,
      ai.hecho, ai.hecho_para_recurso, ai.facts, ai.detected_facts, res.hecho
    ),
    admisibilidad: first(adm.admissibility, ai.admissibility, res.admisibilidad),
    accion: first(
      phase?.recommended_action?.action, rec.action, ai.recommended_action, res.accion_recomendada
    ),
  };
}

function parseStructuredNote(note) {
  const txt = String(note || "");
  const out = {};
  txt.split("|").forEach((piece) => {
    const p = piece.trim();
    const idx = p.indexOf("=");
    if (idx > 0) out[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
  });
  return out;
}

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(deadlineStr) {
  if (!deadlineStr) return null;
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ddl = new Date(`${deadlineStr}T12:00:00`);
  if (Number.isNaN(ddl.getTime())) return null;
  return Math.round((ddl - todayMid) / 86400000);
}

function statusToneFromDays(daysLeft) {
  if (daysLeft == null) return "default";
  if (daysLeft < 0) return "danger";
  if (daysLeft <= 5) return "warn";
  return "success";
}

function labelFromDays(daysLeft, expiredText = "Fuera de plazo", dueTodayText = "Vence hoy") {
  if (daysLeft == null) return "Sin plazo";
  if (daysLeft < 0) return `${expiredText} (${Math.abs(daysLeft)} días)`;
  if (daysLeft === 0) return dueTodayText;
  return `${daysLeft} días restantes`;
}

function toneClasses(tone) {
  const tones = {
    default: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    danger: "border-rose-200 bg-rose-50",
  };
  return tones[tone] || tones.default;
}

function StatCard({ title, value, tone = "default" }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses(tone)}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value || "—"}</div>
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

function guessFilename(doc) {
  const key = doc?.key || "";
  const fromKey = key.split("/").pop();
  if (fromKey) return fromKey;
  const kind = (doc?.kind || "documento").toLowerCase();
  if (kind.includes("pdf")) return "documento.pdf";
  if (kind.includes("docx")) return "documento.docx";
  return "documento.bin";
}

function scoreGeneratedDoc(doc) {
  const kind = (doc?.kind || "").toLowerCase();
  let score = 0;
  if (kind.includes("pdf")) score += 100;
  if (kind.includes("docx")) score += 80;
  if (kind.includes("generated")) score += 60;
  return score;
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
  const [busyRewrite, setBusyRewrite] = useState(false);
  const [busyOverrideFamily, setBusyOverrideFamily] = useState(false);
  const [busyDeadline, setBusyDeadline] = useState(false);
  const [busyPresented, setBusyPresented] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  const [rewriteHecho, setRewriteHecho] = useState("");
  const [rewriteMotivo, setRewriteMotivo] = useState("Corrección manual del hecho denunciado");
  const [rewriteFamilia, setRewriteFamilia] = useState("");

  const [notifiedAt, setNotifiedAt] = useState("");
  const [deadlineMain, setDeadlineMain] = useState("");
  const [deadlineNote, setDeadlineNote] = useState("Plazo principal de alegaciones/recurso");

  const [submittedAtManual, setSubmittedAtManual] = useState("");
  const [deadlineResponse, setDeadlineResponse] = useState("");
  const [responseNote, setResponseNote] = useState("Plazo de respuesta tras presentación");
  const [expedienteEstado, setExpedienteEstado] = useState("en_tramite");

  const [manualOrg, setManualOrg] = useState("");
  const [manualCanal, setManualCanal] = useState("registro_electronico");
  const [manualUrl, setManualUrl] = useState("");
  const [manualJustificanteRef, setManualJustificanteRef] = useState("");
  const [manualPresentedNote, setManualPresentedNote] = useState("Presentado manualmente por operador");

  const [checklist, setChecklist] = useState({
    pdfLeido: false,
    hechoRevisado: false,
    familiaRevisada: false,
    plazosRevisados: false,
    canalRevisado: false,
  });

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
      const [detailRes, docsRes, evRes] = await Promise.all([
        fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}`, { headers }).catch(() => null),
        fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/documents`, { headers }),
        fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/events`, { headers }),
      ]);

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];

      setDocuments(docs);
      setEvents(evs);

      const aiEvent = [...evs].find((e) => e?.type === "ai_expediente_result");
      const aiPayload = aiEvent?.payload || null;
      setAiResult(aiPayload);

      const parsed = readAi(aiPayload);
      setRewriteHecho((prev) => prev || parsed.hecho || "");
      setRewriteFamilia((prev) => prev || parsed.familia || "");

      const rewriteEv = [...evs].find((e) => e?.type === "operator_rewrite_hecho");
      if (rewriteEv?.payload?.hecho) setRewriteHecho((prev) => prev || rewriteEv.payload.hecho);

      const familyEv = [...evs].find((e) => e?.type === "operator_override_family");
      if (familyEv?.payload?.familia) setRewriteFamilia((prev) => prev || familyEv.payload.familia);

      const controlPlazoEv = [...evs].find((e) => e?.type === "operator_note" && String(e?.payload?.note || "").includes("CONTROL_PLAZO"));
      if (controlPlazoEv?.payload?.note) {
        const parsedNote = parseStructuredNote(controlPlazoEv.payload.note);
        if (parsedNote.notified_at) setNotifiedAt(parsedNote.notified_at);
        if (parsedNote.deadline_main) setDeadlineMain(parsedNote.deadline_main);
        if (parsedNote.note) setDeadlineNote(parsedNote.note);
      }

      const postPresentEv = [...evs].find((e) => e?.type === "operator_note" && String(e?.payload?.note || "").includes("POST_PRESENTACION"));
      if (postPresentEv?.payload?.note) {
        const parsedNote = parseStructuredNote(postPresentEv.payload.note);
        if (parsedNote.submitted_at) setSubmittedAtManual(parsedNote.submitted_at);
        if (parsedNote.deadline_response) setDeadlineResponse(parsedNote.deadline_response);
        if (parsedNote.note) setResponseNote(parsedNote.note);
        if (parsedNote.estado) setExpedienteEstado(parsedNote.estado);
      }

      const presentedEv = [...evs].find((e) => e?.type === "operator_note" && String(e?.payload?.note || "").includes("MANUAL_SUBMITTED"));
      if (presentedEv?.payload?.note) {
        const parsedNote = parseStructuredNote(presentedEv.payload.note);
        if (parsedNote.organismo) setManualOrg((prev) => prev || parsedNote.organismo);
        if (parsedNote.canal) setManualCanal((prev) => prev || parsedNote.canal);
        if (parsedNote.url) setManualUrl((prev) => prev || parsedNote.url);
        if (parsedNote.justificante_ref) setManualJustificanteRef((prev) => prev || parsedNote.justificante_ref);
      }

      if (detailRes?.organismo) setManualOrg((prev) => prev || detailRes.organismo);
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
  }, [caseId]);

  async function runAI() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    setRunningAI(true);
    try {
      await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
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

  async function rewriteAndRegenerate() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    if (!rewriteHecho.trim()) return setError("Escribe un hecho denunciado limpio.");
    if (!rewriteMotivo.trim()) return setError("Indica el motivo de la corrección.");

    setBusyRewrite(true);
    try {
      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/rewrite-hecho-and-regenerate`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          hecho: rewriteHecho.trim(),
          motivo: rewriteMotivo.trim(),
          familia: rewriteFamilia.trim() || null,
        }),
      });
      await loadCase();
      alert("Hecho corregido y expediente regenerado");
    } catch (e) {
      setError(e.message || "Error regenerando desde hecho corregido");
    } finally {
      setBusyRewrite(false);
    }
  }

  async function overrideFamilyAndRegenerate() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    if (!rewriteFamilia.trim()) return setError("Selecciona o escribe una familia.");
    if (!rewriteMotivo.trim()) return setError("Indica el motivo.");

    setBusyOverrideFamily(true);
    try {
      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/override-family-and-regenerate`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          familia: rewriteFamilia.trim(),
          motivo: rewriteMotivo.trim(),
        }),
      });
      await loadCase();
      alert("Familia corregida y recurso regenerado");
    } catch (e) {
      setError(e.message || "Error regenerando por familia");
    } finally {
      setBusyOverrideFamily(false);
    }
  }

  async function saveDeadlineControl() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    if (!deadlineMain.trim()) return setError("Indica la fecha límite.");

    setBusyDeadline(true);
    try {
      const note = [
        "CONTROL_PLAZO",
        `notified_at=${notifiedAt || ""}`,
        `deadline_main=${deadlineMain || ""}`,
        `note=${deadlineNote || ""}`,
      ].join(" | ");

      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/note`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      await loadCase();
      alert("Control de plazo guardado");
    } catch (e) {
      setError(e.message || "Error guardando plazo");
    } finally {
      setBusyDeadline(false);
    }
  }

  async function savePostPresentationControl() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    if (!submittedAtManual.trim()) return setError("Indica la fecha de presentación.");
    if (!deadlineResponse.trim()) return setError("Indica la fecha límite de respuesta.");

    setBusyDeadline(true);
    try {
      const note = [
        "POST_PRESENTACION",
        `submitted_at=${submittedAtManual || ""}`,
        `deadline_response=${deadlineResponse || ""}`,
        `estado=${expedienteEstado || "en_tramite"}`,
        `note=${responseNote || ""}`,
      ].join(" | ");

      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/note`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      await loadCase();
      alert("Control post-presentación guardado");
    } catch (e) {
      setError(e.message || "Error guardando control post-presentación");
    } finally {
      setBusyDeadline(false);
    }
  }

  async function markManualPresented() {
    setError("");
    if (!token) return setError("Falta token de operador.");
    if (!manualOrg.trim()) return setError("Indica el organismo.");
    if (!manualCanal.trim()) return setError("Indica el canal.");

    setBusyPresented(true);
    try {
      const note = [
        "MANUAL_SUBMITTED",
        `organismo=${manualOrg.trim()}`,
        `canal=${manualCanal.trim()}`,
        `url=${manualUrl.trim()}`,
        `justificante_ref=${manualJustificanteRef.trim()}`,
        `note=${manualPresentedNote.trim()}`,
      ].join(" | ");

      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/note`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      }).catch(() => null);

      await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/submit`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          document_url: manualUrl.trim() || `manual://${manualCanal.trim()}`,
          force: true,
        }),
      });

      if (!submittedAtManual) {
        const today = new Date().toISOString().slice(0, 10);
        setSubmittedAtManual(today);
        if (!deadlineResponse) setDeadlineResponse(addDays(today, 30));
      }

      await loadCase();
      alert("Expediente marcado como presentado manualmente");
    } catch (e) {
      setError(e.message || "Error marcando presentación manual");
    } finally {
      setBusyPresented(false);
    }
  }

  async function downloadDoc(doc) {
    setError("");
    if (!token) return setError("Falta token de operador.");
    if (!doc?.id) return setError("Este documento no tiene id.");

    setDownloadingId(doc.id);
    try {
      const url = `${API}/ops/documents/${encodeURIComponent(doc.id)}/download`;
      const filename = guessFilename(doc);
      const r = await fetch(url, { headers });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.detail || `Error descargando (HTTP ${r.status})`);
      }
      const blob = await r.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(e.message || "Error descargando documento");
    } finally {
      setDownloadingId(null);
    }
  }

  const ai = useMemo(() => readAi(aiResult), [aiResult]);

  const latestAiEvent = useMemo(
    () => events.find((e) => e?.type === "ai_expediente_result") || null,
    [events]
  );

  const latestGeneratedDocs = useMemo(() => {
    const sorted = [...documents].sort((a, b) => {
      const da = new Date(a?.created_at || 0).getTime();
      const db = new Date(b?.created_at || 0).getTime();
      if (db !== da) return db - da;
      return scoreGeneratedDoc(b) - scoreGeneratedDoc(a);
    });
    return {
      pdf: sorted.find((d) => (d?.kind || "").toLowerCase().includes("pdf")) || null,
      docx: sorted.find((d) => (d?.kind || "").toLowerCase().includes("docx")) || null,
    };
  }, [documents]);

  const confianzaNum = Number(ai.confianza);
  const confianzaPct = Number.isFinite(confianzaNum)
    ? confianzaNum <= 1 ? `${Math.round(confianzaNum * 100)}%` : `${Math.round(confianzaNum)}%`
    : ai.confianza || "—";

  const aiTone =
    ai.admisibilidad === "ADMISSIBLE" ? "success" :
    ai.admisibilidad === "NOT_ADMISSIBLE" ? "warn" :
    "default";

  const daysLeftInitial = diffDays(deadlineMain);
  const initialTone = statusToneFromDays(daysLeftInitial);
  const initialLabel = labelFromDays(daysLeftInitial);

  const daysLeftResponse = diffDays(deadlineResponse);
  const responseTone = statusToneFromDays(daysLeftResponse);
  const responseLabel =
    daysLeftResponse == null ? "Sin control" :
    daysLeftResponse < 0 ? `Silencio administrativo alcanzado (${Math.abs(daysLeftResponse)} días)` :
    daysLeftResponse === 0 ? "Vence hoy respuesta" :
    `${daysLeftResponse} días para respuesta`;

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
            <button className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50" onClick={runAI} disabled={runningAI}>
              {runningAI ? "Ejecutando IA..." : "Ejecutar IA"}
            </button>
            <button className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-50" onClick={approve} disabled={busyApprove}>
              {busyApprove ? "Aprobando..." : "Aprobar"}
            </button>
            <button className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-50" onClick={manual} disabled={busyManual}>
              {busyManual ? "Enviando..." : "Manual"}
            </button>
            <Link to={`/ops/case/${caseId}`} className="rounded-2xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700">
              Volver
            </Link>
          </div>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <b>Última IA ejecutada:</b> {latestAiEvent ? fmt(latestAiEvent.created_at) : "—"}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Familia" value={ai.familia || "—"} />
        <StatCard title="Confianza" value={confianzaPct} />
        <StatCard title="Admisibilidad" value={ai.admisibilidad || "—"} tone={aiTone} />
        <StatCard title="Plazo inicial" value={initialLabel} tone={initialTone} />
        <StatCard title="Post-presentación" value={responseLabel} tone={responseTone} />
        <StatCard title="Documentos" value={String(documents.length)} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Section title="Resultado IA">
          {!aiResult ? <p className="text-slate-500">No hay resultado IA todavía.</p> : (
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
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">PDF</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{latestGeneratedDocs.pdf?.kind || "—"}</div>
              <div className="mt-1 text-xs text-slate-500">{fmt(latestGeneratedDocs.pdf?.created_at)}</div>
              <button onClick={() => latestGeneratedDocs.pdf && downloadDoc(latestGeneratedDocs.pdf)} disabled={!latestGeneratedDocs.pdf || downloadingId === latestGeneratedDocs.pdf?.id} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-medium hover:bg-slate-50 disabled:opacity-50">
                {downloadingId === latestGeneratedDocs.pdf?.id ? "Descargando PDF..." : "Descargar último PDF"}
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">DOCX</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{latestGeneratedDocs.docx?.kind || "—"}</div>
              <div className="mt-1 text-xs text-slate-500">{fmt(latestGeneratedDocs.docx?.created_at)}</div>
              <button onClick={() => latestGeneratedDocs.docx && downloadDoc(latestGeneratedDocs.docx)} disabled={!latestGeneratedDocs.docx || downloadingId === latestGeneratedDocs.docx?.id} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-medium hover:bg-slate-50 disabled:opacity-50">
                {downloadingId === latestGeneratedDocs.docx?.id ? "Descargando DOCX..." : "Descargar último DOCX"}
              </button>
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="Corrección experta desde panel">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Familia correcta</label>
                <input value={rewriteFamilia} onChange={(e) => setRewriteFamilia(e.target.value)} placeholder="semaforo, vehiculo, movil..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Motivo</label>
                <input value={rewriteMotivo} onChange={(e) => setRewriteMotivo(e.target.value)} placeholder="Explica por qué corriges" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
              </div>
              <button onClick={overrideFamilyAndRegenerate} disabled={busyOverrideFamily} className="w-full rounded-2xl border border-amber-500 bg-amber-500 px-4 py-3 text-left font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                {busyOverrideFamily ? "Regenerando por familia..." : "Corregir familia y regenerar"}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Hecho denunciado limpio</label>
                <textarea value={rewriteHecho} onChange={(e) => setRewriteHecho(e.target.value)} rows={7} placeholder="Ej.: No respetar la luz roja del semáforo" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
              </div>
              <button onClick={rewriteAndRegenerate} disabled={busyRewrite} className="w-full rounded-2xl border border-emerald-500 bg-emerald-500 px-4 py-3 text-left font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {busyRewrite ? "Reanalizando y regenerando..." : "Corregir hecho y regenerar"}
              </button>
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="Guía rápida para operador">
          <div className="space-y-4">
            {OPS_HELP.map((block, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">{block.title}</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {block.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-5">
        <ChecklistAprobacion
          {...checklist}
          onToggle={(key, value) =>
            setChecklist((prev) => ({ ...prev, [key]: value }))
          }
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title="Control de plazos">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Fecha de notificación</label>
              <input type="date" value={notifiedAt} onChange={(e) => { const v = e.target.value; setNotifiedAt(v); if (!deadlineMain) setDeadlineMain(addDays(v, 20)); }} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Fecha límite para recurrir</label>
              <input type="date" value={deadlineMain} onChange={(e) => setDeadlineMain(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Nota</label>
            <input value={deadlineNote} onChange={(e) => setDeadlineNote(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
          </div>
          <div className={`mt-4 rounded-2xl border p-4 text-sm text-slate-700 ${toneClasses(initialTone)}`}>
            <div><b>Notificada:</b> {fmtDateOnly(notifiedAt)}</div>
            <div><b>Límite recurso:</b> {fmtDateOnly(deadlineMain)}</div>
            <div><b>Alerta:</b> {initialLabel}</div>
          </div>
          <button onClick={saveDeadlineControl} disabled={busyDeadline} className="mt-4 w-full rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-left font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {busyDeadline ? "Guardando plazo..." : "Guardar control de plazo"}
          </button>
        </Section>

        <Section title="Presentación manual">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Organismo</label>
              <input value={manualOrg} onChange={(e) => setManualOrg(e.target.value)} placeholder="Ej.: Ayuntamiento de Burgos" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Canal</label>
              <select value={manualCanal} onChange={(e) => setManualCanal(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500">
                <option value="registro_electronico">Registro electrónico</option>
                <option value="sede_electronica">Sede electrónica</option>
                <option value="dgt">DGT</option>
                <option value="correo_administrativo">Correo administrativo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">URL de presentación</label>
              <input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="Pega la URL de la sede o del registro" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Referencia justificante</label>
              <input value={manualJustificanteRef} onChange={(e) => setManualJustificanteRef(e.target.value)} placeholder="CSV, número de registro o nota interna" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nota</label>
              <input value={manualPresentedNote} onChange={(e) => setManualPresentedNote(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
            <button onClick={markManualPresented} disabled={busyPresented} className="w-full rounded-2xl border border-blue-600 bg-blue-600 px-4 py-3 text-left font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {busyPresented ? "Marcando como presentado..." : "Marcar como presentado manualmente"}
            </button>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Usa este bloque para dejar trazabilidad interna aunque la presentación real la hagas fuera del sistema.
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="Seguimiento tras presentación / silencio administrativo">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Fecha de presentación</label>
              <input type="date" value={submittedAtManual} onChange={(e) => { const v = e.target.value; setSubmittedAtManual(v); if (!deadlineResponse) setDeadlineResponse(addDays(v, 30)); }} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Fecha límite de respuesta</label>
              <input type="date" value={deadlineResponse} onChange={(e) => setDeadlineResponse(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Estado post-presentación</label>
              <select value={expedienteEstado} onChange={(e) => setExpedienteEstado(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500">
                <option value="en_tramite">En trámite</option>
                <option value="respondido">Respondido</option>
                <option value="silencio_administrativo">Silencio administrativo</option>
                <option value="valorar_contencioso">Valorar contencioso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nota</label>
              <input value={responseNote} onChange={(e) => setResponseNote(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>

          <div className={`mt-4 rounded-2xl border p-4 text-sm text-slate-700 ${toneClasses(responseTone)}`}>
            <div><b>Presentado:</b> {fmtDateOnly(submittedAtManual)}</div>
            <div><b>Respuesta hasta:</b> {fmtDateOnly(deadlineResponse)}</div>
            <div><b>Alerta:</b> {responseLabel}</div>
            <div><b>Estado:</b> {expedienteEstado || "—"}</div>
          </div>

          <button onClick={savePostPresentationControl} disabled={busyDeadline} className="mt-4 w-full rounded-2xl border border-purple-600 bg-purple-600 px-4 py-3 text-left font-medium text-white hover:bg-purple-700 disabled:opacity-50">
            {busyDeadline ? "Guardando seguimiento..." : "Guardar seguimiento post-presentación"}
          </button>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title={`Documentos (${documents.length})`}>
          {documents.length === 0 ? <p className="text-slate-500">No hay documentos.</p> : (
            <div className="space-y-3">
              {documents.map((d, i) => (
                <div key={d?.id || i} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">{d.kind || "documento"}</div>
                  <div className="mt-1 text-sm text-slate-500 break-all">{d.bucket}/{d.key}</div>
                  <div className="mt-1 text-sm text-slate-500">{d.mime || "—"} · {d.size_bytes ? `${d.size_bytes} bytes` : "—"} · {fmt(d.created_at)}</div>
                  <button onClick={() => downloadDoc(d)} disabled={!d?.id || downloadingId === d?.id} className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                    {downloadingId === d?.id ? "Descargando..." : "Descargar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Eventos (${events.length})`}>
          {events.length === 0 ? <p className="text-slate-500">No hay eventos.</p> : (
            <div className="space-y-3">
              {events.map((e, i) => (
                <div key={`${e?.type || "evento"}-${i}`} className="rounded-2xl border border-slate-200 p-4">
                  <button type="button" onClick={() => setOpenEvent(openEvent === i ? null : i)} className="w-full text-left">
                    <div className="font-semibold text-slate-900">{e.type || "evento"}</div>
                    <div className="mt-1 text-sm text-slate-500">{fmt(e.created_at)}</div>
                    <div className="mt-2 text-xs text-blue-600">{openEvent === i ? "Ocultar detalle" : "Ver detalle"}</div>
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
            <summary className="cursor-pointer list-none px-5 py-4 text-xl font-semibold text-slate-900">Payload IA bruto</summary>
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
