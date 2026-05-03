import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";

const MAX_FILES = 5;

// Límite conservador para evitar 413 en Vercel/Render/proxy.
const MAX_UPLOAD_BYTES = 2.5 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 1.7 * 1024 * 1024;
const IMAGE_MAX_SIDE = 1600;

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function getExt(name = "") {
  const m = String(name).match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}

function isImage(file) {
  const ext = getExt(file?.name);
  return file?.type?.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext);
}

function isPdf(file) {
  return file?.type === "application/pdf" || getExt(file?.name) === "pdf";
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
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            "No se pudo leer la imagen. Si el móvil la guardó como HEIC, haz una captura de pantalla y sube la captura."
          )
        );
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImage(file) {
  const img = await loadImage(file);

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("No se pudo leer el tamaño de la imagen.");
  }

  let width = originalWidth;
  let height = originalHeight;

  const longest = Math.max(width, height);
  if (longest > IMAGE_MAX_SIDE) {
    const ratio = IMAGE_MAX_SIDE / longest;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  async function render(w, h, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("No se pudo preparar la compresión.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    return canvasToBlob(canvas, quality);
  }

  let bestBlob = null;

  for (const quality of [0.78, 0.7, 0.62, 0.54, 0.46, 0.38, 0.32]) {
    const blob = await render(width, height, quality);
    bestBlob = !bestBlob || blob.size < bestBlob.size ? blob : bestBlob;
    if (blob.size <= TARGET_IMAGE_BYTES) {
      bestBlob = blob;
      break;
    }
  }

  if (bestBlob && bestBlob.size > TARGET_IMAGE_BYTES) {
    const scale = Math.max(0.45, Math.sqrt(TARGET_IMAGE_BYTES / bestBlob.size) * 0.82);
    width = Math.max(850, Math.round(width * scale));
    height = Math.max(850, Math.round(height * scale));

    for (const quality of [0.62, 0.54, 0.46, 0.38, 0.3]) {
      const blob = await render(width, height, quality);
      bestBlob = !bestBlob || blob.size < bestBlob.size ? blob : bestBlob;
      if (blob.size <= TARGET_IMAGE_BYTES) {
        bestBlob = blob;
        break;
      }
    }
  }

  if (!bestBlob) {
    throw new Error("No se pudo optimizar la imagen.");
  }

  if (bestBlob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `La imagen optimizada pesa ${formatBytes(bestBlob.size)}. Haz una captura más simple y vuelve a subirla.`
    );
  }

  const cleanName = String(file.name || "documento").replace(/\.[^.]+$/, "");
  return new File([bestBlob], `${cleanName}-optimizado.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function prepareFile(file) {
  if (!file) throw new Error("Archivo no válido.");

  if (isImage(file)) {
    const compressed = await compressImage(file);
    return {
      file: compressed,
      originalName: file.name,
      originalSize: file.size,
      optimized: true,
    };
  }

  if (isPdf(file)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `El PDF pesa ${formatBytes(file.size)}. Para evitar error 413, sube una foto o captura del documento. Las fotos se optimizan automáticamente.`
      );
    }

    return {
      file,
      originalName: file.name,
      originalSize: file.size,
      optimized: false,
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `El archivo pesa ${formatBytes(file.size)}. Sube una foto/captura para que el sistema la optimice automáticamente.`
    );
  }

  return {
    file,
    originalName: file.name,
    originalSize: file.size,
    optimized: false,
  };
}

async function readJsonOrThrow(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        "El servidor ha rechazado el archivo por tamaño. Si no aparece como optimizado antes de analizar, la web está usando una versión antigua."
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
      const nextItems = [];
      const notes = [];

      if (incoming.length > selected.length) {
        notes.push(`Máximo ${MAX_FILES} documentos. Se han añadido solo los primeros.`);
      }

      for (const file of selected) {
        try {
          const prepared = await prepareFile(file);

          nextItems.push({
            id: crypto.randomUUID(),
            ...prepared,
          });

          if (prepared.optimized) {
            notes.push(
              `✅ Imagen optimizada: ${formatBytes(prepared.originalSize)} → ${formatBytes(prepared.file.size)}`
            );
          }
        } catch (err) {
          notes.push(err?.message || `No se pudo preparar ${file.name}.`);
        }
      }

      if (nextItems.length) {
        setItems((prev) => [...prev, ...nextItems]);
      }

      if (notes.length) {
        setMessage(notes.join(" "));
      }
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

    const tooLarge = items.find((x) => x.file.size > MAX_UPLOAD_BYTES);
    if (tooLarge) {
      setMessage(
        `${tooLarge.file.name} pesa ${formatBytes(tooLarge.file.size)} y no se subirá para evitar error 413.`
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

        const data = await readJsonOrThrow(response);

        const caseId =
          data?.case_id ||
          data?.caseId ||
          data?.id ||
          data?.extracted?.case_id ||
          data?.extracted?.id;

        if (!caseId) {
          throw new Error("El análisis terminó, pero no devolvió número de caso.");
        }

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

      const data = await readJsonOrThrow(response);
      const caseId = data?.case_id;

      if (!caseId) {
        throw new Error("El expediente terminó, pero no devolvió número de caso.");
      }

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
              Fotos: compresión automática · PDF seguro máximo: 2,5 MB · Recomendado: foto/captura clara
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
