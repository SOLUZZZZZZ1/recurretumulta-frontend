// src/pages/Ayuntamientos.jsx — Ayuntamientos · Mediazion (versión PRO)
import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function Ayuntamientos() {
  return (
    <>
      <Seo
        title="Ayuntamientos · Mediazion"
        description="Mediación comunitaria y convivencia vecinal para Ayuntamientos."
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
            {/* Icono casas / barrio */}
            <svg width="72" height="72" fill="#0ea5e9" viewBox="0 0 24 24">
              <path d="M3 12l9-9 9 9h-2v8h-5v-6H9v6H4zm7-8h5v-4h-5v4z" />
            </svg>
          </div>
          <div>
            <h1 className="sr-h1 mb-3">Ayuntamientos</h1>
            <p className="sr-p mb-1">
              Mediazion ayuda a los Ayuntamientos a gestionar mediación
              comunitaria y convivencia vecinal de forma estructurada, con
              herramientas digitales para casos, actas, agenda e IA aplicada.
            </p>
            <p className="sr-small text-zinc-600">
              Pensado para áreas de convivencia, servicios sociales, participación
              ciudadana y oficinas municipales de mediación.
            </p>
          </div>
        </section>

        {/* APORTES PRINCIPALES */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">¿Qué aporta Mediazion a un Ayuntamiento?</h2>
          <ul className="sr-p list-disc ml-6">
            <li>
              Registro y seguimiento de casos de convivencia y conflictos
              vecinales.
            </li>
            <li>Actas e informes con formato homogéneo, listos para expediente.</li>
            <li>
              Agenda de mediaciones, reuniones y sesiones de seguimiento.
            </li>
            <li>
              IA para redactar comunicaciones a vecinos, resúmenes de casos e
              informes para responsables políticos.
            </li>
            <li>
              Estadísticas de casos para memorias anuales y proyectos de convivencia.
            </li>
          </ul>
        </section>

        {/* USOS POSIBLES */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">Usos posibles en el Ayuntamiento</h2>
          <ul className="sr-p list-disc ml-6">
            <li>
              Servicios municipales de mediación comunitaria y vecinal.
            </li>
            <li>
              Gestión de conflictos en viviendas públicas o barrios concretos.
            </li>
            <li>
              Programas de participación ciudadana y mejora de convivencia en
              distritos.
            </li>
            <li>
              Coordinación entre servicios sociales, policía local y oficinas de
              mediación.
            </li>
          </ul>
        </section>

        {/* CONTACTO + ALTA */}
        <section className="sr-card">
          <h2 className="sr-h2 mb-2">Contacto institucional</h2>
          <p className="sr-p mb-2">
            Si trabajas en un Ayuntamiento y quieres explorar cómo Mediazion puede
            ayudaros a estructurar vuestro servicio de mediación comunitaria:
          </p>
          <p className="sr-p mb-1">
            <b>Email:</b> admin@mediazion.eu
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link to="/contacto" className="sr-btn-secondary inline-block">
              Solicitar reunión / demo
            </Link>
            <Link
              to="/instituciones/registro"
              className="sr-btn-secondary inline-block"
            >
              📝 Solicitar alta institucional
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
