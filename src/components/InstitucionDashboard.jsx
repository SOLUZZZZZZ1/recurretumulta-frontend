// src/components/InstitucionDashboard.jsx — Panel institucional Mediazion
import React from "react";
import { Link } from "react-router-dom";

/**
 * Panel para usuarios institucionales (Ayuntamientos, Cámaras, Colegios).
 *
 * Props esperadas:
 * - who: email de la persona que ha iniciado sesión
 * - institucion: nombre de la institución (Ayuntamiento de..., Colegio de..., etc.)
 * - expiresAt: fecha de expiración del acceso (string ISO o Date)
 * - onLogout: función para cerrar sesión
 */
export default function InstitucionDashboard({
  who,
  institucion,
  expiresAt,
  onLogout,
}) {
  const email = (who || "").trim();
  const nombreInstitucion = institucion || "Institución";
  const fechaExp =
    expiresAt instanceof Date
      ? expiresAt
      : expiresAt
      ? new Date(expiresAt)
      : null;

  const expiracionTexto = fechaExp
    ? fechaExp.toLocaleDateString("es-ES")
    : "—";

  return (
    <section className="sr-card" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="sr-h1">Panel Institucional</h1>
          <p className="sr-small text-zinc-600">
            Acceso institucional para: <b>{nombreInstitucion}</b>
          </p>
          <p className="sr-small text-zinc-600">
            Sesión activa: <b>{email || "—"}</b>
          </p>
          <p className="sr-small text-zinc-600 mt-1">
            Vigencia del acceso:{" "}
            <b>{expiracionTexto}</b>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="sr-btn-secondary"
            to="/panel-institucion/perfil"
          >
            Datos de la institución
          </Link>
          <button
            className="sr-btn-secondary"
            type="button"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Bloque informativo */}
      <div className="mt-4 rounded-2xl p-4 border bg-sky-50 text-sky-800">
        <p className="sr-p">
          Este panel está diseñado para la <b>gestión institucional de la mediación</b>:
          casos, agenda y coordinación con el equipo de Mediazion. No muestra
          opciones de suscripción PRO ni Stripe.
        </p>
      </div>

      {/* Accesos rápidos 2x2 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Quick
          to="/panel-institucion/casos"
          label="Casos institucionales"
          emoji="🗂️"
          description="Abrir y gestionar expedientes de mediación vinculados a la institución."
        />
        <Quick
          to="/panel-institucion/agenda"
          label="Agenda institucional"
          emoji="🗓️"
          description="Ver y organizar reuniones, sesiones y actos relacionados con mediaciones."
        />
        <Quick
          to="/mediadores/directorio"
          label="Directorio de mediadores"
          emoji="👥"
          description="Consultar el directorio público de mediadores de Mediazion."
        />
      </div>

      {/* Mensaje de evolución del panel */}
      <div className="mt-8 text-center sr-small text-zinc-500">
        🛠️ Próximamente en tu Panel Institucional: informes de actividad,
        estadísticas de casos y plantillas específicas para ayuntamientos,
        cámaras y colegios profesionales.
      </div>

      {/* Enlace a instrucciones */}
      <div className="mt-2 text-center sr-small text-zinc-500">
        MEDIAZION · Panel Institucional — {new Date().getFullYear()} <br />
        <Link
          to="/panel-institucion/instrucciones"
          className="underline text-sky-600 hover:text-sky-800"
        >
          Instrucciones de uso del panel institucional
        </Link>
      </div>
    </section>
  );
}

function Quick({ to, label, emoji, description }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border p-4 bg-white hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{emoji}</div>
        <div>
          <div className="font-semibold">{label}</div>
          <div className="sr-small text-zinc-600 mt-1">
            {description}
          </div>
        </div>
      </div>
    </Link>
  );
}
