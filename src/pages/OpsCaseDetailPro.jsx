// OpsCaseDetailPro.jsx — MODO PRO VISUAL (compacto y legible)
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
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
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
  } catch { return undefined; }
}

function deepFindFirst(obj, wantedKeys) {
  const seen = new Set();
  function walk(node) {
    if (node == null || typeof node !== "object" || seen.has(node)) return undefined;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const f = walk(item);
        if (f !== undefined && String(f).trim() !== "") return f;
      }
      return undefined;
    }

    for (const key of wantedKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const v = node[key];
        if (v !== undefined && String(v).trim() !== "") return v;
      }
    }

    for (const v of Object.values(node)) {
      const f = walk(v);
      if (f !== undefined && String(f).trim() !== "") return f;
    }
    return undefined;
  }
  return walk(obj);
}

function compactAction(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.action || v.accion || v.name || JSON.stringify(v);
  return String(v);
}

function readAi(ai) {
  if (!ai || typeof ai !== "object") {
    return { familia: "", confianza: "", hecho: "", admisibilidad: "", accion: "" };
  }

  const familia = firstNonEmpty(
    getByPath(ai, "classifier_result.family"),
    getByPath(ai, "classification.family"),
    ai.familia_resuelta,
    ai.tipo_infraccion,
    deepFindFirst(ai, ["family", "familia"])
  );

  const confianza = firstNonEmpty(
    getByPath(ai, "classifier_result.confidence"),
    getByPath(ai, "classification.confidence"),
    ai.tipo_infraccion_confidence,
    deepFindFirst(ai, ["confidence", "score"])
  );

  const hecho = firstNonEmpty(
    ai.hecho_imputado,
    ai.hecho_para_recurso,
    deepFindFirst(ai, ["hecho", "fact"])
  );

  const admisibilidad = firstNonEmpty(
    getByPath(ai, "admissibility.admissibility"),
    ai.admissibility_panel,
    ai.admissibility
  );

  const accion = firstNonEmpty(
    getByPath(ai, "phase.recommended_action.action"),
    ai.accion_panel,
    ai.recommended_action
  );

  return {
    familia: String(familia || ""),
    confianza: String(confianza || ""),
    hecho: String(hecho || ""),
    admisibilidad: String(admisibilidad || ""),
    accion: compactAction(accion),
  };
}

function shortText(v, max = 70) {
  const t = String(v || "");
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function emoji(tipo) {
  return {
    velocidad: "⚡",
    movil: "📱",
    auriculares: "🎧",
    cinturon: "🪢",
    semaforo: "🚦",
    atencion: "👀",
  }[tipo] || "📄";
}

function Stat({ title, value }) {
  return (
    <div className="border rounded-xl px-3 py-2 bg-white text-sm">
      <div className="text-[10px] uppercase opacity-60">{title}</div>
      <div className="mt-1 font-semibold">{value || "—"}</div>
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
  const [error, setError] = useState("");

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  async function loadCase() {
    setError("");
    if (!token) return;

    setLoading(true);
    try {
      const docsRes = await fetchJson(`${API}/ops/cases/${caseId}/documents`, { headers });
      const evRes = await fetchJson(`${API}/ops/cases/${caseId}/events`, { headers });

      const docs = docsRes.documents || [];
      const evs = evRes.events || [];

      const aiEvent = [...evs].find(e => e.type === "ai_expediente_result");

      setDocuments(docs);
      setEvents(evs);
      setAiResult(aiEvent?.payload || null);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCase(); }, [caseId]);

  async function runAI() {
    setRunningAI(true);
    try {
      await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
      await loadCase();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunningAI(false);
    }
  }

  const ai = useMemo(() => readAi(aiResult), [aiResult]);

  const conf = Number(ai.confianza);
  const confText = Number.isFinite(conf) ? `${Math.round(conf * 100)}%` : "—";

  return (
    <div className="sr-container py-6">

      {/* HEADER */}
      <div className="bg-black text-white rounded-xl px-4 py-4 flex justify-between items-center">
        <div>
          <div className="text-xs opacity-60">PRO</div>
          <div className="text-xl font-bold">Panel de validación</div>
          <div className="text-xs opacity-70">{caseId}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={loadCase} className="bg-white text-black px-3 py-1 rounded">Recargar</button>
          <button onClick={runAI} className="bg-green-500 px-3 py-1 rounded">
            {runningAI ? "..." : "Ejecutar IA"}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}

      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
        <Stat title="Familia" value={`${emoji(ai.familia)} ${ai.familia}`} />
        <Stat title="Confianza" value={confText} />
        <Stat title="Admisibilidad" value={ai.admisibilidad} />
        <Stat title="Acción" value={shortText(ai.accion, 40)} />
        <Stat title="Docs" value={documents.length} />
      </div>

      {/* RESULTADO */}
      <div className="mt-4 border rounded-xl p-4 bg-white">
        <div className="text-sm font-semibold mb-2">Resultado IA</div>

        <div className="text-xs opacity-60">Hecho</div>
        <div className="font-medium text-sm mb-3">{ai.hecho}</div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-60">Familia</div>
            <div>{ai.familia}</div>
          </div>
          <div>
            <div className="text-xs opacity-60">Acción</div>
            <div className="max-h-20 overflow-auto text-sm">{ai.accion}</div>
          </div>
        </div>
      </div>

      {/* DOCUMENTOS */}
      <div className="mt-4 border rounded-xl p-4 bg-white">
        <div className="text-sm font-semibold mb-2">Documentos</div>
        {documents.map((d, i) => (
          <div key={i} className="text-xs mb-2">
            {d.kind} · {fmt(d.created_at)}
          </div>
        ))}
      </div>

    </div>
  );
}