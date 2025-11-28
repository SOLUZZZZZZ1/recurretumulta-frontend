// src/pages/InstruccionesInstitucion.jsx — Guía del Panel Institucional (con Visión PRO)
import React from "react";
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function InstruccionesInstitucion() {
  return (
    <>
      <Seo
        title="Guía del Panel Institucional · Mediazion"
        description="Guía completa del Panel Institucional: IA Profesional con Visión, Casos, Actas, Agenda, Documentos y Perfil de la Institución."
        canonical="https://mediazion.eu/panel-institucion/instrucciones"
      />

      <main
        className="sr-container py-8"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="sr-h1 mb-2">📘 Guía del Panel Institucional</h1>
          <p className="sr-p text-zinc-700">
            Esta guía está diseñada para Ayuntamientos, Cámaras de Comercio,
            Colegios Oficiales y cualquier entidad que utilice Mediazion como
            herramienta para la gestión de mediación. Aquí aprenderás a usar
            IA Profesional con Visión, gestionar casos institucionales,
            generar actas, administrar documentos y manejar la agenda.
          </p>
        </div>

        {/* 1. Acceso institucional */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">1. Acceso institucional</h2>
          <p className="sr-p mb-2">
            El acceso al Panel Institucional se realiza desde{" "}
            <b>“Acceso Instituciones”</b>, usando el correo y contraseña
            facilitados por Mediazion.
          </p>
          <ul className="sr-list">
            <li>Acceso exclusivo a usuarios autorizados de la institución.</li>
            <li>
              Control centralizado de casos, agenda, actas y documentos del
              servicio de mediación.
            </li>
            <li>
              Seguridad reforzada: la contraseña puede cambiarse desde el Panel.
            </li>
          </ul>
        </section>

        {/* 2. IA Profesional con Visión */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">
            2. IA Profesional (texto + Visión PDF / imagen)
          </h2>

          <p className="sr-p mb-2">
            La IA Profesional del Panel Institucional permite redactar, resumir
            y analizar textos. Ahora incorpora <b>Visión PRO</b>: es capaz de
            leer PDFs completos, documentos escaneados y fotos (contratos,
            informes, comunicaciones oficiales, etc.).
          </p>

          <h3 className="sr-h3 mb-1">2.1 Modo texto (sin documento)</h3>
          <ul className="sr-list">
            <li>
              Accede desde el panel → <b>🤖 IA Profesional</b>.
            </li>
            <li>
              Escribe tu consulta: “Redacta un informe interno”, “Resume este
              texto”, etc.
            </li>
            <li>
              Puedes usar los botones de modos rápidos para generar textos
              específicos: resumen, datos clave, correo, texto jurídico suave…
            </li>
          </ul>

          <h3 className="sr-h3 mb-1">2.2 Modo Visión PRO (con documento)</h3>
          <ul className="sr-list">
            <li>Sube un PDF, DOCX, TXT o imagen (foto/escaneo).</li>
            <li>
              Marca <b>“Usar este documento en la respuesta”</b>.
            </li>
            <li>
              Elige un modo rápido:
              <ul className="sr-list mt-1">
                <li>📄 Leer y resumir</li>
                <li>🧩 Datos clave</li>
                <li>⚖️ Revisión legal suave</li>
                <li>📝 Texto para acta</li>
                <li>✉️ Correo a la ciudadanía / partes</li>
              </ul>
            </li>
            <li>
              Pulsa <b>Generar</b> y la IA leerá el documento de principio a
              fin, incluso PDFs multipágina.
            </li>
          </ul>
        </section>

        {/* 3. IA Legal */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">3. IA Legal (⚖️)</h2>
          <p className="sr-p mb-2">
            La IA Legal está orientada a textos normativos y jurídicos. Puede:
          </p>
          <ul className="sr-list">
            <li>Explicar cláusulas administrativas o contractuales.</li>
            <li>Identificar riesgos o plazos importantes.</li>
            <li>Ayudar a redactar textos informativos para la ciudadanía.</li>
            <li>
              Revisar borradores de resoluciones (sin sustituir a un asesor
              jurídico oficial).
            </li>
          </ul>
        </section>

        {/* 4. Casos institucionales */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">4. Casos institucionales 🗂️</h2>
          <p className="sr-p mb-2">
            La sección <b>Casos</b> muestra los expedientes gestionados desde la
            institución (derivaciones de servicios municipales, colegios
            oficiales, cámaras, etc.).
          </p>
          <ul className="sr-list">
            <li>Ver el listado de casos activos y su estado.</li>
            <li>Acceder al detalle de cada caso.</li>
            <li>
              Crear actas vinculadas a ese caso desde “Crear acta vinculada”.
            </li>
            <li>Consultar el listado de actas generadas.</li>
          </ul>
        </section>

        {/* 5. Actas institucionales */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">5. Actas institucionales 📝</h2>
          <p className="sr-p mb-2">
            Desde <b>“Actas institucionales”</b> puedes generar actas de
            mediación con distintos modelos (básica, acuerdo, sin acuerdo,
            derivación…).
          </p>
          <p className="sr-p mb-2">
            También puedes generarlas desde un caso para que queden vinculadas.
          </p>
          <ul className="sr-list">
            <li>El acta se genera en DOCX.</li>
            <li>
              Puedes incluir el <b>logo de la institución</b> en la cabecera.
            </li>
            <li>
              La IA Profesional puede ayudarte a redactar textos previos o
              resúmenes para incluir en el acta.
            </li>
          </ul>
        </section>

        {/* 6. Agenda institucional */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">6. Agenda institucional 🗓️</h2>
          <p className="sr-p mb-2">
            Gestiona sesiones, reuniones y fechas clave de tu servicio de
            mediación.
          </p>
          <ul className="sr-list">
            <li>Crear citas con fecha y hora.</li>
            <li>Organizar seguimientos por caso.</li>
            <li>Ver todas las sesiones programadas.</li>
          </ul>
        </section>

        {/* 7. Documentos institucionales */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">7. Documentos institucionales 📂</h2>
          <p className="sr-p mb-2">
            La sección <b>Documentos</b> agrupa plantillas, modelos y textos
            oficiales de mediación.
          </p>
          <ul className="sr-list">
            <li>Modelos de acta</li>
            <li>Textos informativos</li>
            <li>Consentimientos</li>
            <li>Documentación de referencia</li>
          </ul>
        </section>

        {/* 8. Perfil institución */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">8. Perfil institución 👤🏛️</h2>
          <p className="sr-p mb-2">
            Aquí puedes actualizar los datos de la institución:
          </p>
          <ul className="sr-list">
            <li>Nombre oficial y contacto.</li>
            <li>Responsable del servicio.</li>
            <li>
              URL del <b>logo institucional</b> (aparece en las actas).
            </li>
            <li>Cambio de contraseña.</li>
          </ul>
        </section>

        {/* Próximamente */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">
            Próximamente: cuadro de mando e informes
          </h2>
          <p className="sr-p mb-2">
            El Panel Institucional pronto incluirá:
          </p>
          <ul className="sr-list">
            <li>Indicadores clave (KPIs) del servicio.</li>
            <li>Informes automáticos trimestrales/mensuales.</li>
            <li>Estadísticas de casos, acuerdos y resultados.</li>
          </ul>
        </section>

        {/* Volver */}
        <section className="sr-card mb-10">
          <p className="sr-p mb-2">
            Para volver al Panel Institucional:
          </p>
          <Link to="/panel-institucion" className="sr-btn-secondary">
            ← Volver al Panel Institucional
          </Link>
        </section>
      </main>
    </>
  );
}
