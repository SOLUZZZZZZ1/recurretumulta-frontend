import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api";
const MAX_FILES = 5;

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || data?.message || "Error API");
  return data;
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export default function UploadExpediente({ maxSizeMB = 12 }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]); // [{id,file}]
  const [dragOver, setDragOver] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const maxBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  function pickFiles() {
    inputRef.current?.click();
  }

  function addFiles(fileList) {
    setMsg("");
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    // Límite
    const space = MAX_FILES - files.length;
    const sliced = incoming.slice(0, Math.max(0, space));

    if (incoming.length > sliced.length) {
      setMsg(`Máximo ${MAX_FILES} documentos por expediente. Se han añadido solo los primeros.`);
    }

    // Validar tamaño
    const valid = [];
    for (const f of sliced) {
      if (f.size > maxBytes) {
        setMsg(`Uno de los archivos supera ${maxSizeMB} MB. Reduce el tamaño o usa otro documento.`);
        continue;
      }
      valid.push({ id: crypto.randomUUID(), file: f });
    }

    if (!valid.length) return;
    setFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((x) => x.id !== id));
  }

  function clearAll() {
    setFiles([]);
    setMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    setMsg("");

    if (files.length === 0) {
      setMsg("Primero sube al menos un documento.");
      return;
    }

    // 🚧 BACKEND aún no soporta multi:
    if (files.length > 1) {
      setMsg(
        "Has subido varios documentos. El análisis multi-expediente está en activación (fase backend). " +
          "De momento, analiza 1 documento o espera a que activemos el endpoint multi."
      );
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0].file);

      const data = await fetchJson(`${API}/analyze`, {
        method: "POST",
        body: fd,
      });

      localStorage.setItem("rtm_last_analysis", JSON.stringify(data));

      const caseId =
        data?.case_id || data?.caseId || data?.id || data?.extracted?.case_id || data?.extracted?.id;

      setMsg("Documento analizado correctamente.");

      if (caseId) {
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
      } else {
        setMsg("Documento analizado, pero no se pudo abrir el expediente automáticamente.");
      }
    } catch (e) {
      setMsg(e.message || "Error al analizar el documento.");
    } finally {
      setLoading(false);
    }
  }

  const labelBtn = files.length <= 1 ? "Analizar documento" : "Analizar expediente";

  return (
    <div className="sr-card" style={{ textAlign: "left" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="sr-h2" style={{ marginBottom: 6 }}>
            Subir documentos del expediente
          </h2>
          <p className="sr-p" style={{ marginBottom: 0 }}>
            Puedes subir hasta <b>{MAX_FILES}</b> documentos relacionados con el mismo procedimiento.
          </p>
        </div>

        <div className="sr-small" style={{ color: "#6b7280" }}>
          {files.length}/{MAX_FILES} documentos
        </div>
      </div>

      {/* Zona drop */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer?.files);
        }}
        role="button"
        tabIndex={0}
        onClick={pickFiles}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pickFiles();
        }}
        style={{
          marginTop: 14,
          border: `2px dashed ${dragOver ? "#111827" : "#cbd5e1"}`,
          background: dragOver ? "rgba(17,24,39,0.04)" : "rgba(255,255,255,0.75)",
          borderRadius: 16,
          padding: 18,
          cursor: "pointer",
          transition: "all 120ms ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="sr-p" style={{ margin: 0 }}>
              <strong>Arrastra y suelta</strong> aquí tus documentos, o haz clic para seleccionar.
            </p>
            <p className="sr-small" style={{ marginTop: 6, opacity: 0.85 }}>
              Formatos: JPG/PNG/WebP/PDF/DOCX · Tamaño máx: {maxSizeMB} MB
            </p>
          </div>

          <button
            type="button"
            className="sr-btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              pickFiles();
            }}
          >
            Añadir documento
          </button>
        </div>
      </div>

      {/* Lista de documentos */}
      {files.length > 0 && (
        <div className="sr-card" style={{ marginTop: 12 }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="sr-h3">Documentos subidos</div>
            <button className="sr-btn-secondary" type="button" onClick={clearAll}>
              Limpiar todo
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {files.map((f, idx) => (
              <div
                key={f.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 10,
                  background: "rgba(255,255,255,0.7)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div className="sr-small" style={{ fontWeight: 800 }}>
                    Documento {idx + 1}
                  </div>
                  <div className="sr-small" style={{ color: "#6b7280" }}>
                    {f.file.name} · {formatBytes(f.file.size)}
                  </div>
                </div>

                <button
                  className="sr-btn-secondary"
                  type="button"
                  onClick={() => removeFile(f.id)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          {files.length > 1 && (
            <div className="sr-small" style={{ marginTop: 10, color: "#6b7280" }}>
              ⚠️ Importante: en procedimientos exigentes (OEPM, etc.) es recomendable subir todos los documentos antes de analizar.
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="sr-cta-row" style={{ marginTop: 14, justifyContent: "flex-start" }}>
        <button className="sr-btn-primary" onClick={analyze} disabled={loading}>
          {loading ? "Analizando…" : labelBtn}
        </button>

        {msg && (
          <span className="sr-small" style={{ alignSelf: "center", color: msg.startsWith("Documento analizado") ? "#166534" : "#991b1b" }}>
            {msg.startsWith("Documento analizado") ? "✅" : "ℹ️"} {msg}
          </span>
        )}
      </div>
    </div>
  );
}
