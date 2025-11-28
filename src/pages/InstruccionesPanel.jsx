// src/pages/InstruccionesPanel.jsx — Guía PRO del Panel del Mediador (con Visión PRO)
import React from "react";
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function InstruccionesPanel() {
  return (
    <>
      <Seo
        title="Guía PRO del Mediador · Mediazion"
        description="Guía práctica para sacar todo el partido al Panel PRO del Mediador: IA, Visión (PDF/imagen), actas vinculadas, agenda, casos y Voces."
        canonical="https://mediazion.eu/panel-mediador/instrucciones"
      />
      <main
        className="sr-container py-8"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <div className="mb-6">
          <h1 className="sr-h1 mb-2">📘 Guía PRO del Mediador</h1>
          <p className="sr-p text-zinc-700">
            Esta guía te ayuda a sacar el máximo partido al Panel PRO del
            Mediador en Mediazion. Aquí hablamos de IA Profesional, Visión
            (PDF/imagen), actas vinculadas a casos, agenda, casos y Voces. Es
            información interna del panel, no la ayuda general de la web.
          </p>
        </div>

        {/* 1. Acceso y estados PRO/BÁSICO */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">1. Acceso y estados PRO / Básico</h2>
          <p className="sr-p mb-2">
            Accedes al panel desde <b>“Acceso mediadores”</b> con tu email y la
            contraseña que te hemos enviado (o la que hayas cambiado).
          </p>
          <ul className="sr-list">
            <li>
              <b>PRO (trial):</b> durante los primeros días verás el panel en modo
              PRO en prueba. Tienes acceso a todas las herramientas, incluidas IA,
              actas y agenda.
            </li>
            <li>
              <b>PRO activo:</b> si tienes suscripción, seguirás viendo todo el
              panel PRO sin restricciones.
            </li>
            <li>
              <b>Panel Básico:</b> cuando termina la prueba y no hay suscripción,
              las herramientas avanzadas (IA, actas, agenda, recursos…) se
              desactivan y verás el botón para suscribirte.
            </li>
          </ul>
        </section>

        {/* 2. IA Profesional (texto + Visión) */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">
            2. IA Profesional (texto + Visión PDF / imagen)
          </h2>
          <p className="sr-p mb-2">
            La <b>IA Profesional</b> es tu asistente para redactar, resumir,
            revisar y preparar documentos. Además, puede leer <b>PDFs e imágenes
            de documentos</b> (fotos, escaneos, capturas de pantalla) y trabajar
            con su contenido.
          </p>

          <h3 className="sr-h3 mt-2 mb-1">2.1. Modo texto (igual que siempre)</h3>
          <ol className="sr-list">
            <li>En el panel, haz clic en <b>🤖 IA Profesional</b>.</li>
            <li>
              Escribe tu consulta: por ejemplo “Redáctame un email para informar
              a las partes de la fecha de la sesión” o “Reescribe este texto en
              un tono más formal”.
            </li>
            <li>
              Si ya tienes un texto, puedes pegarlo directamente y pedir:
              <i> “Revísalo”, “Simplifícalo”, “Resume los puntos clave”, etc.</i>
            </li>
          </ol>

          <h3 className="sr-h3 mt-3 mb-1">
            2.2. Visión PRO: PDF / DOCX / TXT / imágenes
          </h3>
          <p className="sr-small text-zinc-700 mb-2">
            Puedes adjuntar un <b>PDF, DOCX, TXT, Markdown o una imagen</b> de un
            documento (foto, escaneo, captura de pantalla). La IA puede leerlo y
            ayudarte a trabajar con él.
          </p>
          <ol className="sr-list">
            <li>
              En la parte derecha, usa el campo <b>“Documento (opcional)”</b> para
              subir el archivo.
            </li>
            <li>
              Marca la casilla <b>“Usar este documento en la respuesta”</b> si
              quieres que la IA lo tenga en cuenta.
            </li>
            <li>
              Opcionalmente, usa uno de los <b>modos de análisis rápido</b>:
              <ul className="sr-list mt-1">
                <li>
                  <b>Leer y resumir:</b> resumen estructurado del documento.
                </li>
                <li>
                  <b>Datos clave:</b> nombres, fechas, importes, referencias…
                </li>
                <li>
                  <b>Revisión legal suave:</b> detecta puntos sensibles, plazos,
                  obligaciones, etc. (sin sustituir al asesor legal).
                </li>
                <li>
                  <b>Texto para acta:</b> genera un borrador listo para pegar en
                  un acta.
                </li>
                <li>
                  <b>Correo a las partes:</b> prepara un correo profesional de
                  resumen o próximos pasos.
                </li>
              </ul>
            </li>
            <li>
              Puedes escribir un mensaje adicional o, en algunos modos, dejar el
              campo vacío: la IA trabajará directamente sobre el documento.
            </li>
          </ol>

          <p className="sr-small text-zinc-600 mt-2">
            ➜ Ejemplos de uso: contratos, actas antiguas, escritos de
            abogados, informes, comunicaciones oficiales, capturas de pantalla
            de WhatsApp, etc.
          </p>
        </section>

        {/* 3. IA Legal */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">3. IA Legal (⚖️)</h2>
          <p className="sr-p mb-2">
            La <b>IA Legal</b> está pensada para consultas técnicas relacionadas
            con normativa, cláusulas y enfoque jurídico. No sustituye al
            asesoramiento legal, pero te ayuda a:
          </p>
          <ul className="sr-list">
            <li>Plantear mejor las alternativas de acuerdo.</li>
            <li>Detectar puntos delicados en contratos o propuestas.</li>
            <li>Preparar explicaciones claras para las partes.</li>
          </ul>
          <p className="sr-small text-zinc-600 mt-2">
            ➜ Usa IA Legal cuando necesites una visión más estructurada desde el
            punto de vista normativo, y IA Profesional para redacción y estilo.
          </p>
        </section>

        {/* 4. Actas MULTIMODELO */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">
            4. Actas 📝 (multimodelo y vinculadas a casos)
          </h2>
          <p className="sr-p mb-2">
            En <b>Actas</b> puedes generar borradores de actas de sesión, actas
            finales o documentos internos, con distintos modelos predefinidos.
          </p>
          <ol className="sr-list">
            <li>
              Desde el panel, haz clic en <b>📝 Actas</b>, o bien desde un caso
              pulsa <b>“Crear acta vinculada”</b>.
            </li>
            <li>
              El sistema detectará el <b>ID del caso</b> (por ejemplo 4) y lo
              rellenará como <b>Nº de expediente</b>.
            </li>
            <li>
              Elige el modelo de acta (básica, cierre con acuerdo, sin acuerdo,
              derivación, escolar…) y ajusta el texto a tu realidad.
            </li>
            <li>
              Puedes usar la IA Profesional para ayudarte con el contenido del
              acta a partir de documentos o notas.
            </li>
          </ol>
        </section>

        {/* 5. Casos */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">
            5. Casos 🗂️ (expedientes con actas vinculadas)
          </h2>
          <p className="sr-p mb-2">
            En <b>Casos</b> tendrás la vista de tus expedientes: cada conflicto,
            con su información, documentación y evolución.
          </p>
          <ul className="sr-list">
            <li>Crear un nuevo caso con los datos esenciales.</li>
            <li>Actualizar el estado: abierto, en curso o cerrado.</li>
            <li>
              Generar <b>actas vinculadas</b> al caso con el botón “Crear acta
              vinculada”.
            </li>
            <li>
              Ver el <b>listado de actas DOCX</b> generadas para ese caso y
              abrirlas cuando lo necesites.
            </li>
          </ul>
        </section>

        {/* 6. Agenda */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">6. Agenda 🗓️</h2>
          <p className="sr-p mb-2">
            La <b>Agenda</b> te sirve para marcar sesiones, recordatorios y
            tareas relacionadas con tus casos.
          </p>
          <ol className="sr-list">
            <li>Haz clic en <b>🗓️ Agenda</b>.</li>
            <li>Crea citas con fecha, hora y descripción.</li>
            <li>
              Cuando esté activo el enlace con <b>Casos</b>, podrás escoger a qué
              caso pertenece cada cita y verlo todo unificado.
            </li>
          </ol>
        </section>

        {/* 7. Recursos */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">7. Recursos 💳</h2>
          <p className="sr-p mb-2">
            La sección <b>Recursos</b> agrupa herramientas y enlaces útiles para
            tu práctica profesional.
          </p>
          <ul className="sr-list">
            <li>
              Acceso a materiales, utilidades y enlaces que iremos activando.
            </li>
            <li>
              Modelos, plantillas y documentación de apoyo para tu trabajo
              diario.
            </li>
            <li>
              En el futuro, accesos directos a opciones de cobro y otras
              integraciones.
            </li>
          </ul>
        </section>

        {/* 8. Perfil y seguridad */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">8. Perfil y seguridad 👤</h2>
          <p className="sr-p mb-2">
            En <b>Perfil</b> puedes completar tu ficha profesional (foto, bio,
            web, especialidad…) y cambiar tu contraseña.
          </p>
          <ul className="sr-list">
            <li>
              <b>Foto y CV:</b> sube tu avatar y tu CV en PDF para mostrar una
              imagen profesional.
            </li>
            <li>
              <b>Contraseña:</b> usa el bloque “Cambio de contraseña” para
              actualizarla cuando quieras.
            </li>
          </ul>
        </section>

        {/* 9. Voces */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">9. Voces 🖊️ / 📰</h2>
          <p className="sr-p mb-2">
            La sección <b>Voces</b> te permite escribir contenidos (artículos,
            reflexiones, casos de éxito…) y aparecer en el blog público:
          </p>
          <ul className="sr-list">
            <li>
              <b>Voces (publicar) 🖊️:</b> crear un nuevo artículo desde tu
              panel. Puedes usar IA para ayudarte a redactar y pulir el texto.
            </li>
            <li>
              <b>Voces (público) 📰:</b> ver cómo se muestran tus artículos y
              los de otros mediadores.
            </li>
            <li>
              <b>Moderación IA:</b> antes de publicar, puedes pedir a la IA que
              revise el texto (tono, claridad, posibles datos sensibles).
            </li>
          </ul>
        </section>

        {/* Próximamente: videollamadas */}
        <section className="sr-card mb-6">
          <h2 className="sr-h2 mb-2">Próximamente: videollamadas integradas</h2>
          <p className="sr-p mb-2">
            Está previsto integrar <b>videollamadas</b> directamente en el Panel
            del Mediador, de forma que puedas:
          </p>
          <ul className="sr-list">
            <li>Agendar videollamadas desde la Agenda.</li>
            <li>Vincular cada videollamada a un Caso concreto.</li>
            <li>
              Tener en un solo lugar: datos del caso, actas, IA y enlace a
              videollamada.
            </li>
          </ul>
        </section>

        {/* Enlace de retorno al panel */}
        <section className="sr-card mb-10">
          <p className="sr-p mb-2">
            Cuando quieras volver al panel principal del Mediador, puedes usar el
            menú o este enlace:
          </p>
          <Link to="/panel-mediador" className="sr-btn-secondary">
            ← Volver al Panel del Mediador
          </Link>
        </section>
      </main>
    </>
  );
}
