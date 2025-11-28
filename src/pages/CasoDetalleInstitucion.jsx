// src/pages/CasoDetalleInstitucion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function CasoDetalleInstitucion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const email = localStorage.getItem("institucion_email") || "";

  const [caso, setCaso] = useState(null);
  const [notas, setNotas] = useState([]);
  const [actas, setActas] = useState([]);
  const [agenda, setAgenda] = useState([]);

  const [nuevaNota, setNuevaNota] = useState("");
  const [estadoNuevo, setEstadoNuevo] = useState("");
  const [contenidoActa, setContenidoActa] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      navigate("/ayuntamientos/acceso");
      return;
    }
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, id]);

  async function cargarTodo() {
    try {
      setLoading(true);
      setErrorMsg("");
      await Promise.all([
        cargarCaso(),
        cargarNotas(),
        cargarActas(),
        cargarAgendaVinculada(),
      ]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al cargar el caso.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarCaso() {
    const resp = await fetch(`/api/instituciones/casos/${id}`);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(
        data?.detail || data?.message || "No se ha podido recuperar el caso."
      );
    }
    setCaso(data);
    if (data && data.estado) {
      setEstadoNuevo(data.estado);
    }
  }

  async function cargarNotas() {
    const resp = await fetch(`/api/instituciones/casos/${id}/notas`);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(
        data?.detail || data?.message || "No se han podido recuperar las notas."
      );
    }
    setNotas(Array.isArray(data) ? data : data.items || []);
  }

  async function cargarActas() {
    const resp = await fetch(`/api/instituciones/casos/${id}/actas`);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(
        data?.detail ||
          data?.message ||
          "No se han podido recuperar las actas del caso."
      );
    }
    setActas(Array.isArray(data) ? data : data.items || []);
  }

  async function cargarAgendaVinculada() {
    try {
      const resp = await fetch(
        `/api/instituciones/agenda?email=${encodeURIComponent(
          email
        )}&caso_id=${encodeURIComponent(id)}`
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        // No consideramos esto un error bloqueante: muchas instalciones no tendrán agenda por caso
        console.warn("Agenda vinculada no disponible o vacía para el caso", id);
        return;
      }
      setAgenda(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.warn("Error al cargar agenda vinculada al caso", err);
    }
  }

  async function handleAgregarNota(e) {
    e.preventDefault();
    if (!nuevaNota.trim()) return;
    setErrorMsg("");
    setInfoMsg("");
    try {
      const resp = await fetch(`/api/instituciones/casos/${id}/nota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: nuevaNota }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido añadir la nota al caso."
        );
      }
      setNuevaNota("");
      setInfoMsg("Nota añadida correctamente.");
      cargarNotas();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al añadir la nota.");
    }
  }

  async function handleActualizarEstado(e) {
    e.preventDefault();
    if (!estadoNuevo) return;
    setErrorMsg("");
    setInfoMsg("");
    try {
      const resp = await fetch(`/api/instituciones/casos/${id}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: estadoNuevo }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido actualizar el estado del caso."
        );
      }
      setInfoMsg("Estado actualizado correctamente.");
      cargarCaso();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al actualizar el estado.");
    }
  }

  async function handleCrearActa(e) {
    e.preventDefault();
    if (!contenidoActa.trim()) return;
    setErrorMsg("");
    setInfoMsg("");
    try {
      const resp = await fetch(`/api/instituciones/casos/${id}/actas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: contenidoActa }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido crear el acta para este caso."
        );
      }
      setContenidoActa("");
      setInfoMsg("Acta creada correctamente.");
      cargarActas();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al crear el acta.");
    }
  }

  return (
    <>
      <Seo
        title="Detalle del caso · Panel Instituciones · Mediazion"
        description="Detalle completo de un caso de mediación gestionado desde una institución."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card max-w-5xl mx-auto p-6 rounded-2xl">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="sr-h1">Detalle del caso</h1>
              <p className="sr-small text-zinc-500 mt-1">
                ID de caso: <b>{id}</b> · Sesión: <b>{email || "—"}</b>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                className="sr-btn-secondary"
                onClick={() => navigate("/panel-institucion/casos")}
              >
                Volver a casos
              </button>
              <button
                type="button"
                className="sr-btn-ghost"
                onClick={() => navigate("/panel-institucion/agenda")}
              >
                Ver agenda
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

          {loading ? (
            <p className="sr-p text-zinc-500">Cargando información del caso…</p>
          ) : !caso ? (
            <p className="sr-p text-zinc-500">
              No se ha encontrado información para este caso.
            </p>
          ) : (
            <>
              {/* Datos principales del caso */}
              <section className="mb-6 border rounded-2xl p-4 bg-sky-50/70">
                <h2 className="sr-h2 text-base mb-2">Información del caso</h2>
                <p className="sr-p font-semibold">
                  {caso.asunto || "Caso sin asunto"}
                </p>
                {caso.descripcion && (
                  <p className="sr-small text-zinc-700 mt-2 whitespace-pre-line">
                    {caso.descripcion}
                  </p>
                )}
                <div className="grid md:grid-cols-3 gap-2 mt-3 sr-small text-zinc-600">
                  <p>
                    Estado:{" "}
                    <b>{(caso.estado || "pendiente").toUpperCase()}</b>
                  </p>
                  <p>
                    Prioridad:{" "}
                    <b>{(caso.prioridad || "normal").toUpperCase()}</b>
                  </p>
                  <p>
                    Creado:{" "}
                    {caso.fecha_creacion
                      ? new Date(caso.fecha_creacion).toLocaleString("es-ES")
                      : "—"}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-2 mt-3 sr-small text-zinc-600">
                  {caso.ciudadano_nombre && (
                    <p>Persona usuaria: {caso.ciudadano_nombre}</p>
                  )}
                  {caso.ciudadano_email && (
                    <p>Correo: {caso.ciudadano_email}</p>
                  )}
                  {caso.telefono && <p>Teléfono: {caso.telefono}</p>}
                </div>
              </section>

              {/* Estado y notas */}
              <section className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-2xl p-4 bg-white">
                  <h2 className="sr-h2 text-base mb-2">Estado del caso</h2>
                  <form
                    onSubmit={handleActualizarEstado}
                    className="flex flex-col gap-2"
                  >
                    <select
                      className="sr-input"
                      value={estadoNuevo}
                      onChange={(e) => setEstadoNuevo(e.target.value)}
                    >
                      <option value="abierto">Abierto</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                    <button type="submit" className="sr-btn-primary mt-1">
                      Actualizar estado
                    </button>
                  </form>
                </div>

                <div className="border rounded-2xl p-4 bg-white">
                  <h2 className="sr-h2 text-base mb-2">Añadir nota interna</h2>
                  <form
                    onSubmit={handleAgregarNota}
                    className="flex flex-col gap-2"
                  >
                    <textarea
                      className="sr-input min-h-[80px]"
                      value={nuevaNota}
                      onChange={(e) => setNuevaNota(e.target.value)}
                      placeholder="Texto de la nota (solo visible para el equipo institucional / mediación)."
                    />
                    <button type="submit" className="sr-btn-secondary">
                      Guardar nota
                    </button>
                  </form>
                </div>
              </section>

              {/* Listado de notas */}
              <section className="mb-6">
                <h2 className="sr-h2 text-base mb-2">Notas del caso</h2>
                {notas.length === 0 ? (
                  <p className="sr-small text-zinc-500">
                    Todavía no hay notas registradas para este caso.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notas.map((nota) => (
                      <div
                        key={nota.id || nota.id_nota}
                        className="rounded-2xl border bg-white p-3 sr-small text-zinc-700"
                      >
                        <p className="whitespace-pre-line">{nota.contenido}</p>
                        <p className="mt-1 text-zinc-500">
                          {nota.fecha_creacion
                            ? new Date(
                                nota.fecha_creacion
                              ).toLocaleString("es-ES")
                            : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Actas */}
              <section className="mb-6">
                <h2 className="sr-h2 text-base mb-2">Actas del caso</h2>
                <form
                  onSubmit={handleCrearActa}
                  className="flex flex-col gap-2 mb-3"
                >
                  <textarea
                    className="sr-input min-h-[100px]"
                    value={contenidoActa}
                    onChange={(e) => setContenidoActa(e.target.value)}
                    placeholder="Contenido del acta de mediación (resumen de la sesión, acuerdos, etc.)."
                  />
                  <button type="submit" className="sr-btn-primary">
                    Crear nueva acta
                  </button>
                </form>
                {actas.length === 0 ? (
                  <p className="sr-small text-zinc-500">
                    Todavía no hay actas creadas para este caso.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {actas.map((acta) => (
                      <div
                        key={acta.id || acta.id_acta}
                        className="rounded-2xl border bg-white p-3 sr-small text-zinc-700"
                      >
                        <p className="font-semibold mb-1">
                          Acta #{acta.id || acta.id_acta}
                        </p>
                        <p className="whitespace-pre-line">
                          {acta.contenido || acta.texto || "(Sin contenido)"}
                        </p>
                        <p className="mt-1 text-zinc-500">
                          {acta.fecha_creacion
                            ? new Date(
                                acta.fecha_creacion
                              ).toLocaleString("es-ES")
                            : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Agenda asociada */}
              <section className="mb-2">
                <h2 className="sr-h2 text-base mb-2">Agenda vinculada</h2>
                {agenda.length === 0 ? (
                  <p className="sr-small text-zinc-500">
                    Este caso todavía no tiene eventos específicos en la agenda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {agenda.map((ev) => (
                      <div
                        key={ev.id || ev.id_evento}
                        className="rounded-2xl border bg-white p-3 sr-small text-zinc-700"
                      >
                        <p className="font-semibold">
                          {ev.titulo || "Evento de agenda"}
                        </p>
                        <p className="text-zinc-600">
                          {ev.fecha} {ev.hora}
                        </p>
                        {ev.descripcion && (
                          <p className="whitespace-pre-line mt-1">
                            {ev.descripcion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </>
  );
}
