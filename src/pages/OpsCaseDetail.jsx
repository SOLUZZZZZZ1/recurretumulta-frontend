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

export default function OpsCaseDetail() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  async function loadAll() {
    setErr("");
    if (!token) {
      setErr("Falta token de operador. Entra en /#/ops e inicia sesión con PIN.");
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

      const ai = evs.find((e) => e.type === "ai_expediente_result");
      if (ai?.payload) setAiResult(ai.payload);
      else setAiResult(null);
    } catch (e) {
      setErr(e.message || "Error cargando expediente");
      setDocuments([]);
      setEvents([]);
      setAiResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function runAI() {
    setErr("");
    if (!token) {
      setErr("Falta token de operador. Entra en /#/ops e inicia sesión con PIN.");
      return;
    }

    setLoadingAI(true);
    try {
      const data = await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
