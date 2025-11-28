// src/pages/AiPanel.jsx — IA Profesional PRO (chat + documentos + Visión avanzada)
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "¡Hola! Soy tu asistente de mediación. Escribe tu encargo o pulsa un preset para empezar.",
  },
];

const PRESETS = [
  {
    tag: "Acta estándar",
    text:
      "Redacta un acta formal de mediación con fecha, asistentes, antecedentes, desarrollo, acuerdos y próximos pasos.",
  },
  {
    tag: "Resumen ejecutivo",
    text:
      "Resume la sesión de mediación en 10-12 líneas, con objetivos, puntos clave, avances y tareas pendientes.",
  },
  {
    tag: "Correo de seguimiento",
    text:
      "Redacta un correo profesional de seguimiento tras una sesión de mediación, con saludo, resumen de acuerdos y próximos pasos.",
  },
  {
    tag: "Cláusula de confidencialidad",
    text:
      "Escribe una cláusula de confidencialidad para anexar a un acta de mediación, en tono jurídico claro y conciso.",
  },
];

// Modos de análisis cuando hay documento / texto
const ANALYSIS_MODES = [
  {
    id: "normal",
    label: "Modo libre",
    description:
      "Tú decides qué pedir. Perfecto para consultas abiertas o redacción creativa.",
    autoPrompt: "",
  },
  {
    id: "summary",
    label: "Leer y resumir",
    description:
      "Lee el documento (si lo hay) y genera un resumen estructurado para el expediente de mediación.",
    autoPrompt:
      "Lee detenidamente el documento adjunto (si lo hay) y prepara un resumen estructurado en 8-12 puntos, pensando en mediación: contexto, partes implicadas, tema del conflicto, información relevante, riesgos y posibles líneas de trabajo.",
  },
  {
    id: "key_data",
    label: "Datos clave",
    description:
      "Extrae nombres, fechas, importes y datos clave útiles para el expediente.",
    autoPrompt:
      "A partir del documento adjunto (si lo hay) y/o del texto que te facilito, extrae de forma clara y ordenada los datos clave para el expediente de mediación: nombres o identificadores de las partes, fechas relevantes, importes económicos, referencias de contratos o expedientes, lugar, y cualquier otro dato operativo.",
  },
  {
    id: "legal_soft",
    label: "Revisión legal suave",
    description:
      "Revisión orientada a detectar puntos delicados o cláusulas sensibles (sin sustituir al asesor legal).",
    autoPrompt:
      "Analiza el contenido desde un punto de vista jurídico general, sin sustituir al asesoramiento legal. Señala cláusulas sensibles, obligaciones relevantes, plazos, posibles riesgos o puntos que convendría explicar bien a las partes, siempre desde la perspectiva de la mediación.",
  },
  {
    id: "acta",
    label: "Texto para acta",
    description:
      "Genera un borrador de texto listo para pegar en un acta de mediación.",
    autoPrompt:
      "A partir de la información disponible (documento adjunto y/o texto proporcionado), genera un borrador de texto para incluir en un acta de mediación: antecedentes, breve descripción del conflicto, puntos trabajados y acuerdos o tareas acordadas. Usa un tono claro, profesional y equilibrado.",
  },
  {
    id: "email",
    label: "Correo a las partes",
    description:
      "Prepara un correo profesional para enviar a las partes (resumen, próxima cita, etc.).",
    autoPrompt:
      "Prepara un correo profesional para enviar a las partes implicadas en la mediación. Incluye saludo inicial, referencia al caso o sesión, resumen muy breve de lo tratado (sin datos sensibles innecesarios) y próximos pasos (cita propuesta, documentación pendiente, etc.). Usa un tono cercano y profesional.",
  },
];

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={
          "max-w-[92%] md:max-w-[72%] px-4 py-3 rounded-2xl shadow-sm " +
          (isUser
            ? "bg-sky-600 text-white rounded-br-sm"
            : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm")
        }
      >
        <pre className="whitespace-pre-wrap m-0 font-sans text-[15px] leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}

export default function AiPanel() {
  const nav = useNavigate();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [useDoc, setUseDoc] = useState(false);

  const [mode, setMode] = useState("normal");

  const listRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight + 200;
    }
  }, [messages, loading]);

  function getToken() {
    const stored = localStorage.getItem("jwt_token");
    return stored && stored.trim() ? stored : "ok";
  }

  function buildPromptWithMode(baseText) {
    const trimmed = (baseText || "").trim();
    const modeDef = ANALYSIS_MODES.find((m) => m.id === mode) || ANALYSIS_MODES[0];

    // Modo libre: no tocamos nada
    if (mode === "normal" || !modeDef.autoPrompt) {
      return trimmed || baseText || "";
    }

    const contextIntro =
      useDoc && docUrl
        ? "Tienes disponible un documento adjunto. Úsalo como fuente principal y combina la información con las instrucciones del mediador."
        : "No hay documento adjunto. Trabaja solo con el texto que te facilito a continuación.";

    if (trimmed) {
      return (
        modeDef.autoPrompt +
        "\n\n" +
        contextIntro +
        "\n\nInstrucciones adicionales del mediador:\n" +
        trimmed
      );
    }

    // Sin texto del usuario: usamos solo la plantilla del modo
    return modeDef.autoPrompt + "\n\n" + contextIntro;
  }

  async function sendMessage(text) {
    if (!text && mode === "normal") return;

    const finalPrompt = buildPromptWithMode(text);

    setMessages((prev) => [...prev, { role: "user", content: finalPrompt }]);
    setErrorMsg("");
    setLoading(true);

    const token = getToken();

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      };

      let endpoint = "/api/ai/assist";
      let body = { prompt: finalPrompt };

      if (useDoc && docUrl) {
        endpoint = "/api/ai/assist_with";
        body = { prompt: finalPrompt, doc_url: docUrl };
      }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se pudo generar la respuesta de la IA."
        );
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text || "(respuesta vacía)" },
      ]);
    } catch (e) {
      setErrorMsg(e.message || "Error inesperado llamando a la IA");
    } finally {
      setLoading(false);
    }
  }

  function handleSendClick() {
    const text = input.trim();
    if (!text && mode === "normal") return;
    setInput("");
    sendMessage(text);
  }

  function handlePresetClick(text) {
    // En presets usamos modo libre siempre
    setMode("normal");
    sendMessage(text);
  }

  async function handleFilePick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setErrorMsg("");
    setDocName(f.name || "");
    setUseDoc(false); // el usuario decide luego si usarlo
    setMode("normal"); // por defecto volvemos a modo libre, él decide

    try {
      const fd = new FormData();
      fd.append("file", f);

      const r = await fetch("/api/upload/file", {
        method: "POST",
        body: fd,
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok || !data?.url) {
        throw new Error(
          data?.detail || data?.message || "No se pudo subir el archivo"
        );
      }

      setDocUrl(data.url);
    } catch (e) {
      setErrorMsg(e.message || "Error subiendo el archivo");
      setDocUrl("");
      setDocName("");
      setUseDoc(false);
    } finally {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  function clearConversation() {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setErrorMsg("");
  }

  function clearDocument() {
    setDocUrl("");
    setDocName("");
    setUseDoc(false);
    setMode("normal");
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSend = !loading && (input.trim().length > 0 || mode !== "normal");

  const currentMode =
    ANALYSIS_MODES.find((m) => m.id === mode) || ANALYSIS_MODES[0];

  return (
    <>
      <Seo
        title="IA Profesional · MEDIAZION"
        description="Asistente IA para mediadores: redacta actas, resúmenes y comunicaciones con o sin documentos, incluido análisis de PDF e imágenes."
        canonical="https://mediazion.eu/panel-mediador/ai"
      />
      <main
        className="sr-container py-8"
        style={{
          minHeight: "calc(100vh - 160px)",
          background:
            "linear-gradient(180deg, rgba(237,246,255,0.85), rgba(248,250,252,0.92))",
          borderRadius: 16,
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        {/* Cabecera */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h1 className="sr-h1 m-0">Asistente IA Profesional</h1>
            <p className="sr-small text-zinc-600">
              Escribe tu consulta o adjunta un documento (PDF, imagen, DOCX…). La IA puede
              leerlo, resumirlo y ayudarte a preparar actas, resúmenes y comunicaciones.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="sr-btn-secondary"
              onClick={() => nav("/panel-mediador/perfil?tab=seguridad")}
            >
              Cambiar contraseña
            </button>
            <button
              type="button"
              className="sr-btn-secondary"
              onClick={clearConversation}
              disabled={loading}
            >
              Limpiar conversación
            </button>
            <button
              type="button"
              className="sr-btn-secondary"
              onClick={() => nav(-1)}
            >
              Volver al panel
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="sr-card mb-4 p-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.tag}
                className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition"
                onClick={() => handlePresetClick(p.text)}
              >
                {p.tag}
              </button>
            ))}
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Izquierda: Chat */}
          <section>
            <div
              ref={listRef}
              className="sr-card p-4 overflow-auto"
              style={{ maxHeight: "60vh" }}
            >
              {messages.map((m, idx) => (
                <MessageBubble key={idx} role={m.role} content={m.content} />
              ))}
              {loading && (
                <p className="sr-small text-zinc-500 mt-2">
                  La IA está pensando…
                </p>
              )}
            </div>
          </section>

          {/* Derecha: documento + modos + textarea */}
          <section>
            <div className="sr-card p-4 flex flex-col gap-3">
              {/* Documento */}
              <div>
                <label className="sr-label mb-1">Documento (opcional)</label>
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-input"
                  accept=".pdf,.doc,.docx,.txt,.md,image/*"
                  onChange={handleFilePick}
                />

                {docUrl ? (
                  <div className="mt-2 space-y-1">
                    <p className="sr-small text-zinc-700">
                      Archivo cargado: <b>{docName || "Documento adjunto"}</b>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <label className="sr-small inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useDoc}
                          onChange={(e) => setUseDoc(e.target.checked)}
                        />
                        Usar este documento en la respuesta
                      </label>
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sr-btn-secondary"
                      >
                        Ver documento
                      </a>
                      <button
                        type="button"
                        className="sr-btn-secondary"
                        onClick={clearDocument}
                      >
                        Quitar documento
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="sr-small text-zinc-500 mt-1">
                    Adjunta un PDF, DOCX, TXT, Markdown o una imagen (foto de documento,
                    captura de pantalla…). Se usará solo si marcas la casilla
                    “Usar este documento”.
                  </p>
                )}
              </div>

              {/* Modos de análisis (debajo del documento) */}
              <div>
                <p className="sr-small text-zinc-600 mb-1">
                  Modos de análisis rápido:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ANALYSIS_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={
                        "px-3 py-1.5 rounded-full border text-xs " +
                        (mode === m.id
                          ? "bg-sky-600 text-white border-sky-700"
                          : "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100")
                      }
                      onClick={() => setMode(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {currentMode && (
                  <p className="sr-small text-zinc-500 mt-1">
                    {currentMode.description}
                  </p>
                )}
              </div>

              {/* Texto */}
              <div className="flex flex-col flex-1">
                <label className="sr-label mb-1">
                  Tu mensaje (opcional según el modo)
                </label>
                <textarea
                  className="sr-input flex-1 resize-none"
                  placeholder="Escribe aquí tu consulta o instrucciones para la IA. Si eliges un modo como 'Leer y resumir', puedes dejar este campo vacío."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              {errorMsg && (
                <p className="sr-small text-red-700">{errorMsg}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  className="sr-btn-primary"
                  onClick={handleSendClick}
                  disabled={!canSend}
                >
                  {loading
                    ? "Generando…"
                    : useDoc && docUrl && mode !== "normal"
                    ? "Generar (modo con documento)"
                    : useDoc && docUrl
                    ? "Generar con documento"
                    : mode !== "normal"
                    ? "Generar (modo rápido)"
                    : "Generar con IA"}
                </button>
                <button
                  type="button"
                  className="sr-btn-secondary"
                  onClick={() => setInput("")}
                  disabled={loading || !input}
                >
                  Limpiar texto
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
