// src/pages/AiPanelLegal.jsx — IA Legal (chat jurídico + buscador jurídico)
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

function ChatBubble({ role, content }) {
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

export default function AiPanelLegal() {
  const navigate = useNavigate();

  // Detectamos si quien usa la IA es mediador o institución
  const hasInstitucion = !!localStorage.getItem("institucion_email");
  const hasMediador = !!localStorage.getItem("mediador_email");
  const perfilRoute = hasMediador
    ? "/panel-mediador/perfil"
    : hasInstitucion
    ? "/panel-institucion/perfil"
    : "/panel-mediador/perfil";

  // CHAT
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Soy la IA Jurídica de MEDIAZION. Puedo orientarte sobre mediación civil, mercantil, familiar y normativa relacionada. ¿Cuál es tu consulta?",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const chatRef = useRef(null);

  // BUSCADOR
  const [searchTerm, setSearchTerm] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight + 200;
    }
  }, [chatMessages, chatLoading]);

  function getToken() {
    const stored = localStorage.getItem("jwt_token");
    return stored && stored.trim() ? stored : "ok";
  }

  // ---- CHAT: enviar pregunta ----
  async function sendLegalQuestion(e) {
    if (e) e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setChatMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setChatError("");
    setChatLoading(true);

    try {
      const token = getToken();
      const r = await fetch("/api/ai/legal/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ prompt: q }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok) {
        throw new Error(data?.detail || data?.message || "No se pudo obtener respuesta");
      }

      const text = data.text || "(respuesta vacía)";
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: text },
      ]);
    } catch (err) {
      setChatError(err.message || "Error en IA Legal");
    } finally {
      setChatLoading(false);
    }
  }

  function clearChat() {
    setChatMessages([
      {
        role: "assistant",
        content:
          "Soy la IA Jurídica de MEDIAZION. Puedo orientarte sobre mediación civil, mercantil, familiar y normativa relacionada. ¿Cuál es tu consulta?",
      },
    ]);
    setChatError("");
  }

  // ---- BUSCADOR: noticias jurídicas ----
  async function doSearch(e) {
    if (e) e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setSearchError("");
    setSearchLoading(true);
    setSearchItems([]);

    try {
      const r = await fetch(
        `/api/ai/legal/search?q=${encodeURIComponent(term)}`
      );
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok) {
        throw new Error(data?.detail || "No se pudieron cargar noticias");
      }

      setSearchItems(data.items || []);
    } catch (err) {
      setSearchError(err.message || "Error al buscar noticias jurídicas");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <>
      <Seo
        title="IA Legal · MEDIAZION"
        description="IA Jurídica experta en mediación: consulta dudas legales y explora noticias relevantes."
        canonical="https://mediazion.eu/panel-mediador/ia-legal"
      />
      <main className="sr-container py-8" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="sr-h1 mb-2">IA Legal · Mediación</h1>
            <p className="sr-p mb-2">
              Consulta dudas jurídicas sobre mediación y explora noticias recientes
              relacionadas con normativa, reformas y casos relevantes.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="sr-btn-secondary"
              onClick={() => navigate(-1)}
            >
              Volver al panel
            </button>
            <button
              type="button"
              className="sr-btn-ghost"
              onClick={() => navigate(perfilRoute)}
            >
              Ir a perfil
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* CHAT JURÍDICO */}
          <section className="sr-card p-4 flex flex-col">
            <h2 className="sr-h2 mb-2">Chat jurídico</h2>
            <div
              ref={chatRef}
              className="flex-1 border border-zinc-200 rounded-lg p-3 overflow-auto"
              style={{ maxHeight: "50vh" }}
            >
              {chatMessages.map((m, idx) => (
                <ChatBubble key={idx} role={m.role} content={m.content} />
              ))}
              {chatLoading && (
                <p className="sr-small text-zinc-500">La IA está pensando…</p>
              )}
            </div>

            {chatError && (
              <p className="sr-small text-red-700 mt-2">{chatError}</p>
            )}

            <form
              onSubmit={sendLegalQuestion}
              className="mt-3 flex flex-col gap-2"
            >
              <textarea
                className="sr-input resize-none"
                rows={3}
                placeholder="Ej.: ¿Qué ley regula la mediación civil y mercantil en España?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="sr-btn-primary"
                  type="submit"
                  disabled={chatLoading || !question.trim()}
                >
                  {chatLoading ? "Consultando…" : "Preguntar a la IA Legal"}
                </button>
                <button
                  className="sr-btn-secondary"
                  type="button"
                  onClick={clearChat}
                  disabled={chatLoading}
                >
                  Limpiar conversación
                </button>
              </div>
            </form>
          </section>

          {/* BUSCADOR JURÍDICO */}
          <section className="sr-card p-4 flex flex-col">
            <h2 className="sr-h2 mb-2">Actualidad jurídica</h2>
            <p className="sr-small text-zinc-600 mb-2">
              Busca noticias en BOE, Confilegal, LegalToday y CGPJ relacionadas con
              mediación u otros términos jurídicos.
            </p>

            <form onSubmit={doSearch} className="flex gap-2 mb-3">
              <input
                className="sr-input flex-1"
                placeholder="Ej.: mediación familiar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="sr-btn-secondary"
                type="submit"
                disabled={searchLoading || !searchTerm.trim()}
              >
                {searchLoading ? "Buscando…" : "Buscar"}
              </button>
            </form>

            {searchError && (
              <p className="sr-small text-red-700 mb-2">{searchError}</p>
            )}

            <div
              className="flex-1 overflow-auto space-y-3"
              style={{ maxHeight: "50vh" }}
            >
              {searchLoading && (
                <p className="sr-small text-zinc-500">Cargando noticias…</p>
              )}
              {!searchLoading && searchItems.length === 0 && (
                <p className="sr-small text-zinc-500">
                  Introduce un término para buscar noticias relacionadas.
                </p>
              )}
              {searchItems.map((it, idx) => (
                <article key={idx} className="sr-card">
                  <h3 className="sr-h3 mb-1">{it.title}</h3>
                  <p className="sr-small text-zinc-600 mb-1">
                    {it.source} · {it.date}
                  </p>
                  <p className="sr-p mb-2">{it.summary}</p>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sr-btn-secondary"
                  >
                    Ver fuente
                  </a>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
