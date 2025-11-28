// src/pages/Documentos.jsx — compatible con Panel Mediador y Panel Institución
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function Documentos() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname || "";
  const isInstitucion = pathname.startsWith("/panel-institucion");
  const isMediador = pathname.startsWith("/panel-mediador");

  const titulo = isInstitucion
    ? "Documentos · Panel Institución"
    : "Documentos · Panel Mediador";

  const subtitulo = isInstitucion
    ? "Accede a actas, plantillas y documentación que tu institución utiliza en los procesos de mediación."
    : "Accede a actas, plantillas y documentación que utilizas en tus casos de mediación.";

  const backRoute = isInstitucion ? "/panel-institucion" : "/panel-mediador";

  return (
    <>
      <Seo
        title={titulo + " · Mediazion"}
        description="Zona de documentos y plantillas vinculadas con la mediación."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card max-w-5xl mx-auto p-6 rounded-2xl">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="sr-h1">
                {isInstitucion ? "Documentos de la institución" : "Documentos del mediador"}
              </h1>
              <p className="sr-p text-zinc-600 mt-1">{subtitulo}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                className="sr-btn-secondary"
                onClick={() => navigate(backRoute)}
              >
                Volver al panel
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="border rounded-2xl p-4 bg-white">
              <h2 className="font-semibold mb-1">Plantillas básicas</h2>
              <p className="sr-small text-zinc-600 mb-2">
                Modelos de actas, hojas de derivación, consentimientos informados y otros documentos
                reutilizables.
              </p>
              <ul className="sr-small list-disc list-inside text-zinc-700 space-y-1">
                <li>Acta de sesión de mediación</li>
                <li>Consentimiento informado</li>
                <li>Ficha de derivación desde la institución</li>
              </ul>
            </article>

            <article className="border rounded-2xl p-4 bg-white">
              <h2 className="font-semibold mb-1">Documentos legales</h2>
              <p className="sr-small text-zinc-600 mb-2">
                Textos de referencia para cláusulas, avisos informativos y protección de datos.
              </p>
              <ul className="sr-small list-disc list-inside text-zinc-700 space-y-1">
                <li>Cláusulas informativas RGPD</li>
                <li>Compromiso de confidencialidad</li>
                <li>Textos para comunicaciones oficiales</li>
              </ul>
            </article>

            <article className="border rounded-2xl p-4 bg-white">
              <h2 className="font-semibold mb-1">Recursos internos</h2>
              <p className="sr-small text-zinc-600 mb-2">
                Guías internas y protocolos que podéis compartir dentro de vuestro servicio.
              </p>
              <p className="sr-small text-zinc-700">
                Muy pronto podrás subir aquí tus propios PDF y enlaces internos para tenerlos siempre a
                mano dentro del panel.
              </p>
            </article>

            <article className="border rounded-2xl p-4 bg-white">
              <h2 className="font-semibold mb-1">Próximamente</h2>
              <p className="sr-small text-zinc-600">
                Estamos preparando un gestor de documentos completo con subida de archivos, categorización
                y acceso restringido según rol (institución / mediador).
              </p>
            </article>
          </section>
        </section>
      </main>
    </>
  );
}
