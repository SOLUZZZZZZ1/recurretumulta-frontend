import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DIRECT_BACKEND = "https://recurretumulta-backend.onrender.com";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  DIRECT_BACKEND;

function apiUrl(path) {
  const base = String(API || DIRECT_BACKEND).replace(/\/$/, "");
  return `${base}${path}`;
}

function getCaseId(search) {
  const qs = new URLSearchParams(search);
  return qs.get("case") || qs.get("case_id") || qs.get("id") || "";
}

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const text = await r.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!r.ok) {
    const detail = data?.detail || data?.message || text || `HTTP ${r.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return data;
}

export default function Autorizar() {
  const location = useLocation();
  const navigate = useNavigate();
  const caseId = useMemo(() => getCaseId(location.search), [location.search]);

  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadSignedAuthorization() {
    setMsg("");

    if (!caseId) {
      setMsg("❌ No se ha encontrado el expediente.");
      return;
    }

    if (!file) {
      setMsg("❌ Selecciona primero la autorización firmada.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      await fetchJson(apiUrl(`/cases/${caseId}/upload-authorization-signed`), {
        method: "POST",
        body: fd,
      });

      setMsg("✅ Autorización firmada subida correctamente.");
    } catch (e) {
      setMsg(`❌ ${e?.message || "No se pudo subir la autorización firmada."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="sr-page">
      <section className="sr-section">
        <div className="sr-card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <p className="sr-kicker">Autorización</p>
          <h1 className="sr-h1">Subir autorización firmada</h1>

          <p className="sr-p">
            Sube aquí la autorización firmada por el interesado. El documento quedará
            vinculado al expediente y permitirá continuar con la gestión.
          </p>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            Expediente: {caseId || "—"}
          </div>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,image/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setMsg("");
            }}
            style={{
              display: "block",
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          />

          {file ? (
            <p className="sr-small" style={{ marginTop: 8, color: "#475569" }}>
              Archivo seleccionado: {file.name}
            </p>
          ) : null}

          {msg ? (
            <div
              style={{
                marginTop: 14,
                color: msg.startsWith("✅") ? "#166534" : "#991b1b",
                fontWeight: 800,
              }}
            >
              {msg}
            </div>
          ) : null}

          <div className="sr-cta-row" style={{ marginTop: 18, justifyContent: "flex-start" }}>
            <button
              type="button"
              className="sr-btn-primary"
              onClick={uploadSignedAuthorization}
              disabled={loading || !file}
            >
              {loading ? "Subiendo…" : "Subir autorización firmada"}
            </button>

            <button
              type="button"
              className="sr-btn-secondary"
              onClick={() => navigate(`/resumen?case=${encodeURIComponent(caseId)}`)}
            >
              Volver al expediente
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
