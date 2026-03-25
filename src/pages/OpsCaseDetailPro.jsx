import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("ops_token") || "";
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Operator-Token": getToken(),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.detail || "Error");

  return data;
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [events, setEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const docs = await apiFetch(`/ops/cases/${caseId}/documents`);
      const evs = await apiFetch(`/ops/cases/${caseId}/events`);

      setDocuments(docs);
      setEvents(evs);

      // 🔥 Buscar resultado IA
      const ai = evs.find(e => e.type === "ai_expediente_result");
      if (ai) {
        setAiResult(ai.payload);
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [caseId]);

  // 🚀 Ejecutar IA
  async function runIA() {
    try {
      setBusy(true);

      await apiFetch(`/ai/expediente/run`, {
        method: "POST",
        body: JSON.stringify({ case_id: caseId }),
      });

      await loadData();

      alert("IA ejecutada");

    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <h1 className="text-2xl font-bold mb-4">
        Operador PRO — Expediente {caseId}
      </h1>

      {error && (
        <div className="bg-red-100 p-3 mb-4 text-red-700">
          {error}
        </div>
      )}

      {/* DOCUMENTOS */}
      <div className="border p-4 mb-4 rounded">
        <h2 className="font-bold mb-2">Documentos</h2>
        {documents.length === 0 && <p>No hay documentos</p>}
        {documents.map((doc, i) => (
          <div key={i} className="text-sm">
            {doc.filename}
          </div>
        ))}
      </div>

      {/* IA RESULT */}
      <div className="border p-4 mb-4 rounded">
        <h2 className="font-bold mb-2">Resultado IA</h2>

        {!aiResult && (
          <button
            onClick={runIA}
            disabled={busy}
            className="bg-black text-white px-4 py-2"
          >
            Ejecutar IA
          </button>
        )}

        {aiResult && (
          <>
            <p><b>Familia:</b> {aiResult.familia_detectada}</p>
            <p><b>Confianza:</b> {aiResult.confianza}</p>
            <p><b>Hecho:</b> {aiResult.hecho}</p>
          </>
        )}
      </div>

      {/* EVENTOS */}
      <div className="border p-4 rounded">
        <h2 className="font-bold mb-2">Trazabilidad</h2>

        {events.map((e, i) => (
          <div key={i} className="text-xs mb-2">
            {e.type} — {e.created_at}
          </div>
        ))}
      </div>

    </div>
  );
}