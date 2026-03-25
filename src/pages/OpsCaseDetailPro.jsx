import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("operator_token") || "";
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

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  async function loadCase() {
    try {
      setLoading(true);
      const data = await apiFetch(`/ops/cases/${caseId}`);
      setCaseData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function approve() {
    try {
      setBusy(true);
      await apiFetch(`/ops/cases/${caseId}/approve`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
      await loadCase();
      alert("Aprobado");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitDGT() {
    try {
      setBusy(true);
      const res = await apiFetch(`/ops/cases/${caseId}/submit`, {
        method: "POST",
        body: JSON.stringify({ document_url: documentUrl }),
      });
      alert("Enviado a DGT: " + res.dgt_id);
      await loadCase();
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
        Expediente {caseId}
      </h1>

      {error && (
        <div className="bg-red-100 p-3 mb-4 text-red-700">
          {error}
        </div>
      )}

      {/* INFO */}
      <div className="border p-4 mb-4 rounded-xl">
        <p><b>Familia:</b> {caseData?.familia_detectada}</p>
        <p><b>Confianza:</b> {caseData?.confianza}</p>
        <p><b>Hecho:</b> {caseData?.hecho}</p>
        <p><b>Estado:</b> {caseData?.status}</p>
      </div>

      {/* APROBAR */}
      <div className="border p-4 mb-4 rounded-xl">
        <textarea
          className="w-full border p-2"
          placeholder="Nota operador"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={approve}
          disabled={busy}
          className="mt-2 bg-black text-white px-4 py-2 rounded"
        >
          Aprobar
        </button>
      </div>

      {/* DGT */}
      <div className="border p-4 rounded-xl">
        <input
          className="w-full border p-2"
          placeholder="URL documento"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
        />

        <button
          onClick={submitDGT}
          disabled={busy}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enviar a DGT
        </button>
      </div>

    </div>
  );
}