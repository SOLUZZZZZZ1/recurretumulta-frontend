// src/pages/Colegios.jsx — Colegios Profesionales · Mediazion (versión PRO)
import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function Colegios() {
  return (
    <>
      <Seo
        title="Colegios Profesionales · Mediazion"
        description="Soluciones de mediación para Colegios Profesionales y sus colegiados."
      />
      <main
        className="sr-container py-12"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        {/* VOLVER A INSTITUCIONES */}
        <div className="mb-4">
          <Link
            to="/instituciones"
            className="sr-small text-sky-700 underline"
          >
            ← Volver a Instituciones
          </Link>
        </div>

        {/* CABECERA */}
        <section className="sr-card mb-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {/* Icono libro / título */}
            <svg width="72" height="72" fill="#0ea5e9" viewBox="0 0 24 24">
              <path d="M4 4h12l4 4v12H4V4zm12 1.5V9h3.5L16 5.5z" />
            </svg>
          </div>
          <div>
            <h1 className="sr-h1 mb-3">Colegios Profesionales</h1>
            <p className="sr-p mb-1">
              Mediazion se adapta a las necesidades de Colegios de Abogados,
              Psicólogos, Trabajadores Sociales y otros colectivos que desean
              ofrecer a sus colegiados un servicio de mediación moderno,
              estructurado y tecnológico.
            </p>
            <p className="sr-small text-zinc-600">
              Pensado para áreas de mediación, formación continua y servicios a
              colegiados.
            </p>
          </div>
        </section>

        {/* APORTES PRINCIPALES */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">
            ¿Qué ofrece Mediazion a un Colegio Profesional?
          </h2>
          <ul className="sr-p list-disc ml-6">
            <li>
              Panel de gestión de casos de mediación accesible solo para
              mediadores colegiados.
            </li>
            <li>
              Actas e informes con formato profesional, listos para expediente
              interno o para enviar a las partes.
            </li>
            <li>
              IA profesional para mejorar redacción, claridad y estructura de
              documentos.
            </li>
            <li>
              Directorio público de mediadores del Colegio, con fichas
              profesionales y visibilidad controlada.
            </li>
            <li>
              Estadísticas e informes para la Junta, memorias anuales y
              proyectos de mediación.
            </li>
          </ul>
        </section>

        {/* USOS POSIBLES */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">Usos posibles en el Colegio</h2>
          <ul className="sr-p list-disc ml-6">
            <li>Servicio de mediación intrajudicial o extrajudicial del Colegio.</li>
            <li>Programas de mediación familiar, civil o mercantil gestionados por el Colegio.</li>
            <li>Itinerarios formativos en mediación con soporte tecnológico.</li>
            <li>Supervisión y seguimiento de casos liderados por mediadores colegiados.</li>
          </ul>
        </section>

        {/* CONTACTO */}
        <section className="sr-card">
          <h2 className="sr-h2 mb-2">Contacto institucional</h2>
          <p className="sr-p mb-2">
            Si formas parte de la Junta o del equipo técnico de un Colegio
            Profesional y quieres conocer cómo Mediazion puede ayudaros a
            estructurar y potenciar vuestro servicio de mediación:
          </p>
          <p className="sr-p">
            <b>Email:</b> admin@mediazion.eu
          </p>
          <Link to="/contacto" className="sr-btn-secondary inline-block mt-2">
            Solicitar información
          </Link>
        </section>
      </main>
    </>
  );
}
