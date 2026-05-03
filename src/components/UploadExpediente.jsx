import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";

const MAX_FILES = 5;

// Versión ultra segura anti-413.
// Aunque el usuario suba JPG de 6, 10 o 20 MB, el sistema intenta dejarlo < 700 KB.
// Además bloquea antes de enviar si pasa de 900 KB.
const HARD_SEND_LIMIT_BYTES = 900 * 1024;
const TARGET_IMAGE_BYTES = 700 * 1024;
const IMAGE_MAX_SIDE = 1100;

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
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

async function compressImageUltra(file) {
  const img = await loadImage(file);

  let originalWidth = img.naturalWidth || img.width;
  let originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("No se pudo leer el tamaño de la imagen.");
  }

  let side = IMAGE_MAX_SIDE;
  let bestBlob = null;
  let bestWidth = 0;
  let bestHeight = 0;

  for (const maxSide of [1100, 950, 800, 650]) {
    let width = originalWidth;
    let height = originalHeight;

    const longest = Math.max(width, height);
    if (longest > maxSide) {
      const ratio = maxSide / longest;
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("No se pudo preparar la compresión.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const q of [0.68, 0.56, 0.46, 0.36, 0.28, 0.22, 0.16]) {
      const blob = await canvasToBlob(canvas, q);
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
        bestWidth = width;
        bestHeight = height;
      }
      if (blob.size <= TARGET_IMAGE_BYTES) {
        const base = String(file.name || "documento").replace(/\.[^.]+$/, "");
        return {
          file: new File([blob], `${base}-optimizado-anti413.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
          width,
          height,
          quality: q,
        };
      }
    }

    side = maxSide;
  }

  if (!bestBlob) {
    throw new Error("No se pudo optimizar la imagen.");
  }

  if (bestBlob.size > HARD_SEND_LIMIT_BYTES) {
    throw new Error(
      `La imagen optimizada sigue pesando ${formatBytes(bestBlob.size)}. Haz una captura más cercana/simple del documento.`
    );
  }

  const base = String(file.name || "documento").replace(/\.[^.]+$/, "");
  return {
    file: new File([bestBlob], `${base}-optimizado-anti413.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    }),
    width: bestWidth,
    height: bestHeight,
    quality: "mínima",
  };
}

async function prepareFile(file) {
  if (!file) throw new Error("Archivo no válido.");

  if (isImage(file)) {
    const optimized = await compressImageUltra(file);
    return {
      id: crypto.randomUUID(),
      file: optimized.file,
      originalName: file.name,
      originalSize: file.size,
      optimized: true,
      meta: {
        width: optimized.width,
        height: optimized.height,
        quality: optimized.quality,
      },
    };
  }

  if (isPdf(file)) {
    throw new Error(
      "Ahora mismo los PDF pesados pueden provocar 413. Sube una foto JPG/captura clara del documento; el sistema la optimiza automáticamente."
    );
  }

  throw new Error("Formato no recomendado. Sube una imagen JPG/PNG o una captura clara.");
}

async function readApi(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        "413: el servidor recibió demasiado peso. Esta versión bloquea >900 KB; si ves esto, estás usando otra pantalla o el navegador no desplegó la última versión."
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

          notes.push(
            `✅ Imagen optimizada ULTRA ANTI-413: ${formatBytes(item.originalSize)} → ${formatBytes(item.file.size)} (${item.meta.width}x${item.meta.height})`
          );
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

    const totalBytes = items.reduce((sum, x) => sum + (x.file?.size || 0), 0);
    const tooBig = items.find((x) => (x.file?.size || 0) > HARD_SEND_LIMIT_BYTES);

    if (tooBig) {
      setMessage(
        `Bloqueado antes de subir: ${tooBig.file.name} pesa ${formatBytes(tooBig.file.size)}. No se enviará para evitar 413.`
      );
      return;
    }

    // Bloqueo adicional para varios documentos.
    if (totalBytes > HARD_SEND_LIMIT_BYTES * 1.8) {
      setMessage(
        `Bloqueado antes de subir: el conjunto pesa ${formatBytes(totalBytes)}. Sube un solo documento principal para evitar 413.`
      );
      return;
    }

    setBusy(true);

    try {
      if (items.length === 1) {
        const fd = new FormData();
        fd.append("file", items[0].file);

        // Marca de diagnóstico visible en consola.
        console.log("[RTM ANTI-413] Enviando archivo:", {
          name: items[0].file.name,
          size: items[0].file.size,
          sizeHuman: formatBytes(items[0].file.size),
          type: items[0].file.type,
        });

        setMessage(`Enviando archivo optimizado de ${formatBytes(items[0].file.size)}…`);

        const response = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          body: fd,
        });

        const data = await readApi(response);
        const caseId =
          data?.case_id ||
          data?.caseId ||
          data?.id ||
          data?.extracted?.case_id ||
          data?.extracted?.id;

        if (!caseId) throw new Error("El análisis terminó, pero no devolvió número de caso.");

        localStorage.setItem("rtm_last_analysis", JSON.stringify(data));
        setMessage("✅ Documento analizado. Abriendo resumen…");
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
        return;
      }

      const fd = new FormData();
      items.forEach((item) => fd.append("files", item.file));

      console.log("[RTM ANTI-413] Enviando expediente:", {
        count: items.length,
        totalBytes,
        totalHuman: formatBytes(totalBytes),
      });

      setMessage(`Enviando expediente optimizado de ${formatBytes(totalBytes)}…`);

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
        ✅ ULTRA ANTI-413 ACTIVO — envío bloqueado por encima de 900 KB
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="sr-h2" style={{ marginBottom: 6 }}>
            Subir documentos del expediente
          </h2>
          <p className="sr-p" style={{ marginBottom: 0 }}>
            Sube la multa en JPG/PNG. El sistema la reduce automáticamente antes de enviarla.
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
          accept="image/*,.jpg,.jpeg,.png,.webp"
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="sr-p" style={{ margin: 0 }}>
              <strong>Arrastra y suelta</strong> aquí tus documentos o haz clic para seleccionar.
            </p>
            <p className="sr-small" style={{ marginTop: 6, opacity: 0.85 }}>
              Solo imágenes · compresión automática · objetivo 700 KB
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
              color: message.startsWith("✅") || message.startsWith("Enviando") ? "#166534" : "#991b1b",
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
