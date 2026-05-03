import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api";
const MAX_FILES = 5;

// Render/proxy puede cortar antes de los 12 MB del backend.
// Por eso el frontend optimiza imágenes a un tamaño seguro.
const SAFE_UPLOAD_MAX_MB = 4.2;
const SAFE_UPLOAD_MAX_BYTES = SAFE_UPLOAD_MAX_MB * 1024 * 1024;
const IMAGE_TARGET_MAX_BYTES = 3.6 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 2200;

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = data?.detail || data?.message;
    if (r.status === 413) {
      throw new Error(
        "El archivo es demasiado grande para subirlo. Si es una foto, vuelve a seleccionarla para que el sistema la optimice automáticamente. Si es PDF pesado, conviértelo a foto o envía una captura clara."
      );
    }
    throw new Error(typeof detail === "string" ? detail : "Error API");
  }
  return data;
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function fileExt(name = "") {
  const m = String(name).match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}

function isImageFile(file) {
  return file?.type?.startsWith("image/");
}

function isPdfFile(file) {
  return file?.type === "application/pdf" || fileExt(file?.name) === "pdf";
}

async function fileToImage(file) {
  const url = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = url;
    });

    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
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

async function compressImageFile(file) {
  if (!isImageFile(file)) return { file, optimized: false, originalSize: file.size };

  // Si ya es pequeña, la dejamos igual.
  if (file.size <= SAFE_UPLOAD_MAX_BYTES) {
    return { file, optimized: false, originalSize: file.size };
  }

  const img = await fileToImage(file);

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("No se pudo leer el tamaño de la imagen.");
  }

  let width = originalWidth;
  let height = originalHeight;

  const longest = Math.max(width, height);
  if (longest > IMAGE_MAX_DIMENSION) {
    const ratio = IMAGE_MAX_DIMENSION / longest;
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

  let bestBlob = null;

  // Intentos de calidad decreciente hasta quedar por debajo del objetivo.
  for (const quality of [0.82, 0.74, 0.66, 0.58, 0.5, 0.42]) {
    const blob = await canvasToBlob(canvas, quality);
    bestBlob = blob;
    if (blob.size <= IMAGE_TARGET_MAX_BYTES) break;
  }

  // Si aún pesa demasiado, reducimos dimensión una segunda vez.
  if (bestBlob && bestBlob.size > IMAGE_TARGET_MAX_BYTES) {
    const reducedScale = Math.sqrt(IMAGE_TARGET_MAX_BYTES / bestBlob.size) * 0.92;
    const reducedWidth = Math.max(900, Math.round(width * reducedScale));
    const reducedHeight = Math.max(900, Math.round(height * reducedScale));

    const canvas2 = document.createElement("canvas");
    canvas2.width = reducedWidth;
    canvas2.height = reducedHeight;

    const ctx2 = canvas2.getContext("2d", { alpha: false });
    if (!ctx2) throw new Error("No se pudo preparar la compresión secundaria.");

    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, reducedWidth, reducedHeight);
    ctx2.drawImage(img, 0, 0, reducedWidth, reducedHeight);

    for (const quality of [0.7, 0.62, 0.54, 0.46, 0.38]) {
      const blob = await canvasToBlob(canvas2, quality);
      bestBlob = blob;
      if (blob.size <= IMAGE_TARGET_MAX_BYTES) break;
    }
  }

  if (!bestBlob) {
    throw new Error("No se pudo optimizar la imagen.");
  }

  if (bestBlob.size > SAFE_UPLOAD_MAX_BYTES) {
    throw new Error(
      "La imagen sigue siendo demasiado grande incluso tras optimizarla. Haz una foto más cercana o una captura más simple."
    );
  }

  const baseName = String(file.name || "documento").replace(/\.[^.]+$/, "");
  const optimizedFile = new File([bestBlob], `${baseName}-optimizado.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: optimizedFile,
    optimized: true,
    originalSize: file.size,
  };
}

async function optimizeIncomingFile(file) {
  if (isImageFile(file)) {
    return compressImageFile(file);
  }

  // PDF/DOCX no se pueden comprimir de forma fiable en navegador sin romper contenido.
  // Los dejamos pasar solo si están bajo el límite seguro.
  if (isPdfFile(file) && file.size > SAFE_UPLOAD_MAX_BYTES) {
    throw new Error(
      `El PDF pesa ${formatBytes(file.size)}. Para evitar error de subida, sube una foto/captura del documento o un PDF más ligero. Las fotos se optimizan automáticamente.`
    );
  }

  if (file.size > SAFE_UPLOAD_MAX_BYTES) {
    throw new Error(
      `El archivo pesa ${formatBytes(file.size)} y supera el límite seguro de subida. Si es una imagen, súbela como JPG/PNG para optimizarla automáticamente.`
    );
  }

  return { file, optimized: false, originalSize: file.size };
}

export default function UploadExpediente({ maxSizeMB = 12 }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]); // [{id,file,originalSize,optimized}]
  const [dragOver, setDragOver] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const maxBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  function pickFiles() {
    inputRef.current?.click();
  }

  async function addFiles(fileList) {
    setMsg("");
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const space = MAX_FILES - files.length;
    const sliced = incoming.slice(0, Math.max(0, space));

    if (incoming.length > sliced.length) {
      setMsg(`Máximo ${MAX_FILES} documentos por expediente. Se han añadido solo los primeros.`);
    }

    setOptimizing(true);

    try {
      const valid = [];
      const notes = [];

      for (const original of sliced) {
        try {
          // Primero validamos el límite absoluto del backend para documentos no imagen.
          // En imágenes grandes, la optimización baja antes de subir.
          if (!isImageFile(original) && original.size > maxBytes) {
            notes.push(`${original.name}: supera ${maxSizeMB} MB.`);
            continue;
          }

          const optimized = await optimizeIncomingFile(original);

          valid.push({
            id: crypto.randomUUID(),
            file: optimized.file,
            originalSize: optimized.originalSize,
            optimized: optimized.optimized,
          });

          if (optimized.optimized) {
            notes.push(
              `Imagen optimizada: ${formatBytes(optimized.originalSize)} → ${formatBytes(optimized.file.size)}`
            );
          }
        } catch (err) {
          notes.push(err?.message || `No se pudo preparar ${original.name}.`);
        }
      }

      if (valid.length) {
        setFiles((prev) => [...prev, ...valid]);
      }

      if (notes.length) {
        const prefix = valid.length ? "✅ Documento preparado. " : "";
        setMsg(prefix + notes.join(" "));
      }
    } finally {
      setOptimizing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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
      setMsg("Primero añade al menos un documento.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 1 archivo → /analyze
      if (files.length === 1) {
        const fd = new FormData();
        fd.append("file", files[0].file);

        const data = await fetchJson(`${API}/analyze`, {
          method: "POST",
          body: fd,
        });

        localStorage.setItem("rtm_last_analysis", JSON.stringify(data));

        const caseId =
          data?.case_id ||
          data?.caseId ||
          data?.id ||
          data?.extracted?.case_id ||
          data?.extracted?.id;

        if (!caseId) throw new Error("No se pudo obtener el número de expediente.");

        setMsg("✅ Documento analizado. Abriendo resumen…");
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
        return;
      }

      // ✅ 2–5 archivos → /analyze/expediente
      const fdMulti = new FormData();
      files.forEach((f) => fdMulti.append("files", f.file));

      const dataMulti = await fetchJson(`${API}/analyze/expediente`, {
        method: "POST",
        body: fdMulti,
      });

      const caseId = dataMulti?.case_id;
      if (!caseId) throw new Error("El backend no devolvió case_id para el expediente.");

      localStorage.setItem(
        "rtm_last_analysis",
        JSON.stringify({
          case_id: caseId,
          extracted: {
            extracted: {
              organismo: null,
              expediente_ref: null,
              observaciones:
                "Hemos recibido tu documentación y estamos revisando el expediente para comprobar si el recurso puede presentarse en este momento.",
              tipo_recurso_sugerido: "Expediente multi-documento",
              normativa_aplicable: "Ley 39/2015",
            },
          },
          documents: dataMulti?.documents || [],
        })
      );

      setMsg("✅ Expediente creado. Abriendo resumen…");
      navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
    } catch (e) {
      setMsg(e?.message || "Error al analizar el expediente.");
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
              Fotos grandes: se optimizan automáticamente antes de subir · PDF/DOCX: máximo seguro {SAFE_UPLOAD_MAX_MB} MB
            </p>
          </div>

          <button
            type="button"
            className="sr-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              pickFiles();
            }}
            disabled={optimizing || loading}
          >
            {optimizing ? "Optimizando…" : "Añadir documento"}
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="sr-card" style={{ marginTop: 12 }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="sr-h3">Documentos añadidos</div>
            <button className="sr-btn-secondary" type="button" onClick={clearAll} disabled={loading || optimizing}>
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
                    {f.optimized ? (
                      <span style={{ color: "#166534", fontWeight: 800 }}>
                        {" "}· optimizado desde {formatBytes(f.originalSize)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button className="sr-btn-secondary" type="button" onClick={() => removeFile(f.id)} disabled={loading || optimizing}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sr-cta-row" style={{ marginTop: 14, justifyContent: "flex-start" }}>
        <button className="sr-btn-primary" onClick={analyze} disabled={loading || optimizing}>
          {optimizing ? "Optimizando documento…" : loading ? "Procesando…" : labelBtn}
        </button>

        {msg && (
          <span
            className="sr-small"
            style={{
              alignSelf: "center",
              color: msg.startsWith("✅") ? "#166534" : "#991b1b",
            }}
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
