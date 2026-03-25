import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("ops_token") || "";
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "X-Operator-Token": getToken(),
    },
  });

  if (!res.ok) return null;

  return res.json();
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const events = await apiFetch(`/ops/cases/${caseId}/events`);

      if (!events) return;

      const ai = events.find(e => e.type === "ai_expediente_result");

      if (ai) setAiResult(ai.payload);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [caseId]);

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Operador PRO — {caseId}</h2>

      {!aiResult && (
        <div style={{ marginTop: 20 }}>
          ⚠️ No hay resultado IA todavía
        </div>
      )}

      {aiResult && (
        <div style={{ marginTop: 20 }}>
          <p><b>Familia:</b> {aiResult.familia_detectada || "-"}</p>
          <p><b>Confianza:</b> {aiResult.confianza || "-"}</p>
          <p><b>Hecho:</b> {aiResult.hecho || "-"}</p>
        </div>
      )}
    </div>
  );
}