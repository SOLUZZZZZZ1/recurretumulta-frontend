// src/components/UploadMulta.jsx — RecurreTuMulta
import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "/api";

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function UploadMulta({
  endpointAnalyze = "/analyze",
  endpointHealth = "/health",
  maxSizeMB = 12,
}) {
  const inputRef = useRef(null);
  const [health, setHealth] = useState({ ok: null, msg: "" });

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [status, setStatus] = useState({
    uploading: false,
    ok: null,
    msg: "",
    data: null,
  });

  const maxBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}${endpointHealth}`);
        if (!r.ok) throw new Error(`Health ${r.status}`);
        await r.json().catch(() => ({}));
        setHealth({ ok: true, msg: "OK" });
      } catch {
        setHealth({ ok: false, msg: "Backend no disponible (todavía)" });
      }
    })();
  }, [endpointHealth]);

  function pickFile() {
    inputRef.current?.click();
  }

  function validateAndSet(f) {
    if (!f) return;
    if (f.size > maxBytes) {
      setStatus({
        uploading: false,
        ok: false,
        msg: `El archivo es demasiado grande. Máximo ${maxSizeMB} MB.`,
        data: null,
      });
      return;
    }
    setFile(f);
    setStatus({ uploading: false, ok: null, msg: "", data: null });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    validateAndSet(f);
  }

  async function analyze() {
    if (!file) {
      setStatus({
        uploading: false,
        ok: false,
        msg: "Primero sube una multa (foto o PDF).",
        data: null,
      });
      return;
    }

    setStatus({ uploading: true, ok: null, msg: "Analizando…", data: null });

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch(`${API_BASE}${endpointAnalyze}`, {
        method: "POST",
        body: fd,
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err =
          data?.detail ||
          data?.message ||
          data?.error ||
          `Error al analizar (HTTP ${r.status})`;
        throw new Error(err);
      }

      setStatus({
        uploading: false,
        ok: true,
        msg: "Análisis listo.",
        data,
      });
    } catch (e) {
      setStatus({
        uploading: false,
        ok: false,
        msg: e?.message || "No se pudo analizar el archivo.",
        data: null,
      });
    }
  }

  return (
    <div className="sr-card" style={{ textAlign: "left" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="sr-h2" style={{ marginBottom: 6 }}>
            Subir multa
          </h2>
          <p className="sr-p" style={{ marginBottom: 0 }}>
            Sube una foto, escaneo o PDF. Tamaño máx: {maxSizeMB} MB.
          </p>
        </div>

        <div className="flex items-center gap-10">
          <span className="sr-small" style={{ opacity: 0.85 }}>
            Backend:{" "}
            {health.ok === null ? (
              "comprobando…"
            ) : health.ok ? (
              <span style={{ color: "#16a34a" }}>✅ OK</span>
            ) : (
              <span style={{ color: "#b91c1c" }}>⚠️ {health.msg}</span>
            )}
          </span>
        </div>
      </div>

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
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pickFile();
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
          accept="image/*,.pdf"
          style={{ display: "none" }}
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="sr-p" style={{ margin: 0 }}>
              <strong>Arrastra y suelta</strong> aquí tu multa, o haz clic para seleccionar.
            </p>
            <p className="sr-small" style={{ marginTop: 6, opacity: 0.85 }}>
              Formatos: JPG/PNG/WebP/PDF
            </p>
          </div>

          <button
            type="button"
            className="sr-btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              pickFile();
            }}
          >
            Elegir archivo
          </button>
        </div>

        {file && (
          <div style={{ marginTop: 12 }} className="sr-card">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="sr-h3">Archivo seleccionado</div>
                <div className="sr-small" style={{ opacity: 0.9 }}>
                  {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>

              <button
                type="button"
                className="sr-btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setStatus({ uploading: false, ok: null, msg: "", data: null });
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Quitar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sr-cta-row" style={{ marginTop: 14, justifyContent: "flex-start" }}>
        <button
          type="button"
          className="sr-btn-primary"
          onClick={analyze}
          disabled={status.uploading}
        >
          {status.uploading ? "Analizando…" : "Analizar multa"}
        </button>

        <span className="sr-small" style={{ alignSelf: "center" }}>
          {status.ok === true && <span style={{ color: "#166534" }}>✅ {status.msg}</span>}
          {status.ok === false && <span style={{ color: "#991b1b" }}>❌ {status.msg}</span>}
          {status.ok === null && status.msg && <span style={{ opacity: 0.85 }}>{status.msg}</span>}
        </span>
      </div>

      {status.data && (
        <div style={{ marginTop: 14 }}>
          <h3 className="sr-h3" style={{ marginBottom: 8 }}>
            Resultado del análisis
          </h3>
          <pre
            className="sr-p"
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 13,
              background: "#0b1220",
              color: "#e5e7eb",
              padding: 14,
              borderRadius: 14,
              overflowX: "auto",
            }}
          >
            {pretty(status.data)}
          </pre>
        </div>
      )}
    </div>
  );
}
