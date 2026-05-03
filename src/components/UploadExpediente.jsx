import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";

const MAX_FILES = 5;
const MAX_UPLOAD_BYTES = 2.0 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 1.35 * 1024 * 1024;
const IMAGE_MAX_SIDE = 1400;

function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ext(name = "") {
  const m = String(name).match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}

function isImage(file) {
  const e = ext(file?.name);
  return file?.type?.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(e);
}

function isPdf(file) {
  return file?.type === "application/pdf" || ext(file?.name) === "pdf";
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("No se pudo comprimir la imagen."));
        else resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(
          new Error(
            "No se pudo leer la imagen. Si es HEIC, haz una captura de pantalla y sube esa captura."
          )
        );
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImage(file) {
  const img = await loadImage(file);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (!width || !height) throw new Error("No se pudo leer el tamaño de la imagen.");

  const longest = Math.max(width, height);
  if (longest > IMAGE_MAX_SIDE) {
    const ratio = IMAGE_MAX_SIDE / longest;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  async function render(w, h, q) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("No se pudo preparar la compresión.");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    return canvasToBlob(canvas, q);
  }

  let best = null;

  for (const q of [0.72, 0.62, 0.52, 0.42, 0.34, 0.26]) {
    const blob = await render(width, height, q);
    if (!best || blob.size < best.size) best = blob;
    if (blob.size <= TARGET_IMAGE_BYTES) {
      best = blob;
      break;
    }
  }

  if (best && best.size > TARGET_IMAGE_BYTES) {
    const ratio = Math.max(0.38, Math.sqrt(TARGET_IMAGE_BYTES / best.size) * 0.78);
    width = Math.max(720, Math.round(width * ratio));
    height = Math.max(720, Math.round(height * ratio));

    for (const q of [0.52, 0.42, 0.34, 0.26, 0.2]) {
      const blob = await render(width, height, q);
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= TARGET_IMAGE_BYTES) {
        best = blob;
        break;
      }
    }
  }

  if (!best) throw new Error("No se pudo optimizar la imagen.");

  if (best.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `La imagen optimizada sigue pesando ${formatBytes(best.size)}. Haz una captura más simple del documento.`
    );
  }

  const base = String(file.name || "documento").replace(/\.[^.]+$/, "");
  return new File([best], `${base}-optimizado-anti413.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function prepareFile(file) {
  if (!file) throw new Error("Archivo no válido.");

  if (isImage(file)) {
    const optimized = await compressImage(file);
    return {
      id: crypto.randomUUID(),
      file: optimized,
      originalName: file.name,
      originalSize: file.size,
      optimized: true,
    };
  }

  if (isPdf(file)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `Este PDF pesa ${formatBytes(file.size)}. Para evitar 413, sube una foto/captura clara del documento.`
      );
    }

    return {
      id: crypto.randomUUID(),
      file,
      originalName: file.name,
      originalSize: file.size,
      optimized: false,
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `El archivo pesa ${formatBytes(file.size)}. Sube una foto/captura para que el sistema la optimice.`
    );
  }

  return {
    id: crypto.randomUUID(),
    file,
    originalName: file.name,
    originalSize: file.size,
    optimized: false,
  };
}

async function readApi(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        "413: el servidor recibió un archivo demasiado grande. Si ves este mensaje, la subida no estaba por debajo de 2 MB o la página no usa el componente ANTI-413."
      );
    }

    const detail = data?.detail || data?.message;
    throw new Error(typeof detail === "string" ? detail : "No se pudo analizar el documento.");
  }

  return data;
}

export default function UploadExpediente() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => inputRef.current?.click();

  async function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    setMessage("");
    setBusy(true);

    try {
      const available = MAX_FILES - items.length;
      const selected = incoming.slice(0, Math.max(0, available));
      const prepared = [];
      const notes = [];

      for (const file of selected) {
        try {
          const item = await prepareFile(file);
          prepared.push(item);

          if (item.optimized) {
            notes.push(`✅ Imagen optimizada ANTI-413: ${formatBytes(item.originalSize)} → ${formatBytes(item.file.size)}`);
          } else {
            notes.push(`✅ Documento preparado: ${formatBytes(item.file.size)}`);
          }
        } catch (err) {
          notes.push(err?.message || `No se pudo preparar ${file.name}.`);
        }
      }

      if (prepared.length) setItems((prev) => [...prev, ...prepared]);
      if (notes.length) setMessage(notes.join(" "));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function clearAll() {
    setItems([]);
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    setMessage("");

    if (!items.length) {
      setMessage("Primero añade al menos un documento.");
      return;
    }

    const tooBig = items.find((x) => x.file.size > MAX_UPLOAD_BYTES);
    if (tooBig) {
      setMessage(
        `Bloqueado antes de subir: ${tooBig.file.name} pesa ${formatBytes(tooBig.file.size)}. No se enviará para evitar 413.`
      );
      return;
    }

    setBusy(true);

    try {
      if (items.length === 1) {
        const fd = new FormData();
        fd.append("file", items[0].file);

        const response = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          body: fd,
        });

        const data = await readApi(response);
        const caseId = data?.case_id || data?.caseId || data?.id || data?.extracted?.case_id || data?.extracted?.id;

        if (!caseId) throw new Error("El análisis terminó, pero no devolvió número de caso.");

        localStorage.setItem("rtm_last_analysis", JSON.stringify(data));
        setMessage("✅ Documento analizado. Abriendo resumen…");
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
        return;
      }

      const fd = new FormData();
      items.forEach((item) => fd.append("files", item.file));

      const response = await fetch(`${API_BASE}/analyze/expediente`, {
        method: "POST",
        body: fd,
      });

      const data = await readApi(response);
      const caseId = data?.case_id;

      if (!caseId) throw new Error("El expediente terminó, pero no devolvió número de caso.");

      localStorage.setItem("rtm_last_analysis", JSON.stringify(data));
      setMessage("✅ Expediente analizado. Abriendo resumen…");
      navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
    } catch (err) {
      setMessage(err?.message || "No se pudo analizar el documento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sr-card" style={{ textAlign: "left" }}>
      <div
        style={{
          background: "#ecfdf5",
          color: "#166534",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "8px 10px",
          marginBottom: 12,
          fontWeight: 900,
          fontSize: 13,
        }}
      >
        ✅ ANTI-413 ACTIVO — las fotos se comprimen antes de subir
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="sr-h2" style={{ marginBottom: 6 }}>
            Subir documentos del expediente
          </h2>
          <p className="sr-p" style={{ marginBottom: 0 }}>
            Sube la multa o documentos relacionados. Las fotos grandes se optimizan automáticamente.
          </p>
        </div>

        <div className="sr-small" style={{ color: "#6b7280" }}>
          {items.length}/{MAX_FILES} documentos
        </div>
      </div>

      <div
        onClick={openPicker}
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openPicker();
        }}
        style={{
          marginTop: 14,
          border: `2px dashed ${dragOver ? "#111827" : "#cbd5e1"}`,
          background: dragOver ? "rgba(17,24,39,0.05)" : "rgba(255,255,255,0.78)",
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
              <strong>Arrastra y suelta</strong> aquí tus documentos o haz clic para seleccionar.
            </p>
            <p className="sr-small" style={{ marginTop: 6, opacity: 0.85 }}>
              Fotos: compresión automática · PDF seguro máximo: 2 MB · Recomendado: foto/captura clara
            </p>
          </div>

          <button
            type="button"
            className="sr-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
            disabled={busy}
          >
            {busy ? "Preparando…" : "Añadir documento"}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="sr-card" style={{ marginTop: 12 }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="sr-h3">Documentos preparados</div>
            <button className="sr-btn-secondary" type="button" onClick={clearAll} disabled={busy}>
              Limpiar todo
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 10,
                  background: "rgba(255,255,255,0.75)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div className="sr-small" style={{ fontWeight: 800 }}>
                    Documento {index + 1}
                  </div>
                  <div className="sr-small" style={{ color: "#6b7280" }}>
                    {item.file.name} · {formatBytes(item.file.size)}
                    {item.optimized && (
                      <span style={{ color: "#166534", fontWeight: 800 }}>
                        {" "}
                        · optimizado desde {formatBytes(item.originalSize)}
                      </span>
                    )}
                  </div>
                </div>

                <button className="sr-btn-secondary" type="button" onClick={() => removeItem(item.id)} disabled={busy}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sr-cta-row" style={{ marginTop: 14, justifyContent: "flex-start" }}>
        <button className="sr-btn-primary" onClick={analyze} disabled={busy || !items.length}>
          {busy ? "Procesando…" : items.length > 1 ? "Analizar expediente" : "Analizar documento"}
        </button>

        {message && (
          <span
            className="sr-small"
            style={{
              alignSelf: "center",
              color: message.startsWith("✅") ? "#166534" : "#991b1b",
              lineHeight: 1.45,
            }}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
