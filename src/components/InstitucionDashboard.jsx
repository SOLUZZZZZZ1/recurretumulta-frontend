// src/components/InstitucionDashboard.jsx — Panel Institucional PRO con enlace a guía
import React from "react";
import { Link } from "react-router-dom";

export default function InstitucionDashboard({
  who,
  institucion,
  expiresAt,
  onLogout,
}) {
  const email = (who || "").trim();
  const nombre = institucion || "Institución";
  const expira = expiresAt || "—";

  return (
    <section className="sr-card" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="sr-h1">Panel Institucional</h1>
          <p className="sr-small text-zinc-600">
            Sesión: <b>{email || "—"}</b>
          </p>
          <p className="sr-small text-zinc-600">
            Institución: <b>{nombre}</b>
          </p>
          <p className="sr-small text-zinc-600">
            Licencia activa hasta: <b>{expira}</b>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="sr-btn-secondary" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Bloque contextual */}
      <div className="mt-4 rounded-2xl p-4 border bg-sky-50 text-sky-800">
        <p className="sr-p">
          Panel PRO institucional: IA aplicada a la mediación, gestión de casos,
          agenda, actas y documentación desde tu Ayuntamiento, Cámara o Colegio.
        </p>
      </div>

      {/* Grid de accesos PRO */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Fila 1 · IA y actas PRO */}
        <Quick to="/panel-mediador/ai" label="IA Profesional" emoji="🤖" />
        <Quick to="/panel-mediador/ai-legal" label="IA Legal" emoji="⚖️" />
        <Quick
          to="/panel-institucion/acta"
          label="Actas institucionales"
          emoji="📝"
        />

        {/* Fila 2 · Casos, agenda y documentos */}
        <Quick
          to="/panel-institucion/casos"
          label="Casos de la institución"
          emoji="🗂️"
        />
        <Quick
          to="/panel-institucion/agenda"
          label="Agenda institucional"
          emoji="🗓️"
        />
        <Quick
          to="/panel-institucion/documentos"
          label="Documentos"
          emoji="📂"
        />

        {/* Fila 3 · Perfil y recursos abiertos */}
        <Quick
          to="/panel-institucion/perfil"
          label="Perfil institución"
          emoji="🏛️"
        />
        <Quick to="/voces" label="Voces (público)" emoji="📰" />
        <Quick
          to="/mediadores/directorio"
          label="Directorio de mediadores"
          emoji="📘"
        />
      </div>

      {/* Pie informativo */}
      <div className="mt-8 text-center sr-small text-zinc-500">
        🛠️ Próximamente: cuadro de mando con indicadores específicos para tu
        institución e informes descargables.
      </div>

      {/* Enlace a guía del panel institucional */}
      <div className="mt-3 text-center sr-small text-zinc-500">
        MEDIAZION · Panel Institucional — {new Date().getFullYear()} <br />
        <Link
          to="/panel-institucion/instrucciones"
          className="underline text-sky-600 hover:text-sky-800"
        >
          📘 Guía del Panel Institucional (Casos, Agenda, Actas, Documentos, IA…)
        </Link>
      </div>
    </section>
  );
}

function Quick({ to, label, emoji }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border p-4 bg-white hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{emoji}</div>
        <div>
          <div className="font-semibold">{label}</div>
          <div className="sr-small text-zinc-600">Abrir</div>
        </div>
      </div>
    </Link>
  );
}
