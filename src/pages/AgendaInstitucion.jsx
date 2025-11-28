// src/pages/AgendaInstitucion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function AgendaInstitucion() {
  const navigate = useNavigate();
  const email = localStorage.getItem("institucion_email") || "";

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Nuevo evento
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [casoId, setCasoId] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/ayuntamientos/acceso");
      return;
    }
    cargarAgenda();
  }, [email, navigate]);

  async function cargarAgenda() {
    try {
      setLoading(true);
      setErrorMsg("");
      const resp = await fetch(
        `/api/instituciones/agenda?email=${encodeURIComponent(email)}`
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido recuperar la agenda."
        );
      }
      setEventos(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearEvento(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!fecha || !hora || !titulo.trim()) {
      setErrorMsg("Indica al menos fecha, hora y título del evento.");
      return;
    }

    try {
      const resp = await fetch(
        `/api/instituciones/agenda?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha,
            hora,
            titulo,
            descripcion,
            caso_id: casoId || null,
          }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido crear el evento en la agenda."
        );
      }

      setInfoMsg("Evento creado correctamente en la agenda.");
      if (data && (data.id || data.id_evento)) {
        setEventos((prev) => [data, ...prev]);
      } else {
        cargarAgenda();
      }

      setFecha("");
      setHora("");
      setTitulo("");
      setDescripcion("");
      setCasoId("");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al crear el evento.");
    }
  }

  return (
    <>
      <Seo
        title="Agenda · Panel Instituciones · Mediazion"
        description="Agenda de mediación institucional: citas, sesiones y recordatorios."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card max-w-4xl mx-auto p-6 rounded-2xl">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="sr-h1">Agenda institucional</h1>
              <p className="sr-p text-zinc-600">
                Gestiona citas, sesiones y recordatorios vinculados a tus casos.
              </p>
              <p className="sr-small text-zinc-500 mt-1">
                Sesión institucional: <b>{email || "—"}</b>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                className="sr-btn-secondary"
                onClick={() => navigate("/panel-institucion")}
              >
                Volver al panel
              </button>
              <button
                type="button"
                className="sr-btn-ghost"
                onClick={() => navigate("/panel-institucion/casos")}
              >
                Ver casos
              </button>
            </div>
          </header>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {infoMsg}
            </div>
          )}

          {/* Formulario nuevo evento */}
          <section className="mb-8 border rounded-2xl p-4 bg-amber-50/70">
            <h2 className="sr-h2 text-base mb-2">Nuevo evento en agenda</h2>
            <p className="sr-small text-zinc-600 mb-3">
              Registra una cita o recordatorio vinculado a un caso (opcional).
            </p>
            <form
              onSubmit={handleCrearEvento}
              className="grid gap-3 md:grid-cols-2"
            >
              <div>
                <label className="sr-label" htmlFor="fecha">
                  Fecha
                </label>
                <input
                  id="fecha"
                  type="date"
                  className="sr-input mt-1 w-full"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="sr-label" htmlFor="hora">
                  Hora
                </label>
                <input
                  id="hora"
                  type="time"
                  className="sr-input mt-1 w-full"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="sr-label" htmlFor="titulo">
                  Título del evento
                </label>
                <input
                  id="titulo"
                  className="sr-input mt-1 w-full"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Reunión de mediación, primera sesión, llamada..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="sr-label" htmlFor="descripcion">
                  Detalles (opcional)
                </label>
                <textarea
                  id="descripcion"
                  className="sr-input mt-1 w-full min-h-[70px]"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Información adicional útil para el equipo o la persona usuaria."
                />
              </div>

              <div className="md:col-span-2">
                <label className="sr-label" htmlFor="casoId">
                  ID de caso relacionado (opcional)
                </label>
                <input
                  id="casoId"
                  className="sr-input mt-1 w-full"
                  value={casoId}
                  onChange={(e) => setCasoId(e.target.value)}
                  placeholder="Ejemplo: 123 (si quieres vincular la cita a un caso concreto)"
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button type="submit" className="sr-btn-primary">
                  Añadir a la agenda
                </button>
              </div>
            </form>
          </section>

          {/* Listado agenda */}
          <section>
            <h2 className="sr-h2 text-base mb-3">Próximos eventos</h2>
            {loading ? (
              <p className="sr-p text-zinc-500">Cargando agenda…</p>
            ) : eventos.length === 0 ? (
              <p className="sr-p text-zinc-500">
                No hay eventos registrados por ahora.
              </p>
            ) : (
              <div className="space-y-3">
                {eventos.map((ev) => (
                  <div
                    key={ev.id || ev.id_evento}
                    className="rounded-2xl border bg-white p-4 flex flex-col gap-1"
                  >
                    <div className="flex justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold">{ev.titulo || "Evento"}</p>
                        <p className="sr-small text-zinc-600">
                          {ev.fecha} {ev.hora}
                        </p>
                      </div>
                      {ev.caso_id && (
                        <button
                          type="button"
                          className="sr-btn-ghost sr-small"
                          onClick={() =>
                            navigate(
                              `/panel-institucion/casos/${ev.caso_id}`
                            )
                          }
                        >
                          Ver caso relacionado
                        </button>
                      )}
                    </div>
                    {ev.descripcion && (
                      <p className="sr-small whitespace-pre-line mt-1">
                        {ev.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
