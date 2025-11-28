// src/pages/CasosInstitucion.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function CasosInstitucion() {
  const navigate = useNavigate();
  const email = localStorage.getItem("institucion_email") || "";

  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Campos del formulario nuevo caso
  const [ciudadanoNombre, setCiudadanoNombre] = useState("");
  const [ciudadanoEmail, setCiudadanoEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("normal");

  useEffect(() => {
    if (!email) {
      navigate("/ayuntamientos/acceso");
      return;
    }
    cargarCasos();
  }, [email, navigate]);

  async function cargarCasos() {
    try {
      setLoading(true);
      setErrorMsg("");
      const resp = await fetch(
        `/api/instituciones/casos?email=${encodeURIComponent(email)}`
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se han podido recuperar los casos."
        );
      }
      setCasos(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al cargar los casos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearCaso(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!asunto.trim() || !descripcion.trim()) {
      setErrorMsg("Indica al menos un asunto y una descripción básica.");
      return;
    }

    try {
      const resp = await fetch(
        `/api/instituciones/casos/nuevo?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ciudadano_nombre: ciudadanoNombre || null,
            ciudadano_email: ciudadanoEmail || null,
            telefono: telefono || null,
            asunto: asunto,
            descripcion: descripcion,
            prioridad: prioridad,
          }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido crear el caso desde la institución."
        );
      }

      setInfoMsg("Caso creado correctamente.");
      // Añadimos el nuevo caso al listado si viene en la respuesta
      if (data && (data.id || data.id_caso)) {
        setCasos((prev) => [data, ...prev]);
      } else {
        // Si el backend no devuelve el caso, recargamos la lista
        cargarCasos();
      }

      // Limpiamos formulario
      setCiudadanoNombre("");
      setCiudadanoEmail("");
      setTelefono("");
      setAsunto("");
      setDescripcion("");
      setPrioridad("normal");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al crear el caso.");
    }
  }

  const casosFiltrados = casos.filter((c) =>
    !filtroEstado ? true : (c.estado || "").toLowerCase() === filtroEstado
  );

  return (
    <>
      <Seo
        title="Casos · Panel Instituciones · Mediazion"
        description="Gestión de casos de mediación desde tu institución."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card max-w-5xl mx-auto p-6 rounded-2xl">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="sr-h1">Casos de la institución</h1>
              <p className="sr-p text-zinc-600">
                Revisión y alta rápida de casos vinculados a tu institución.
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

          {/* Formulario de nuevo caso */}
          <section className="mb-8 border rounded-2xl p-4 bg-sky-50/60">
            <h2 className="sr-h2 text-base mb-2">Nuevo caso desde la institución</h2>
            <p className="sr-small text-zinc-600 mb-3">
              Registra un caso básico para coordinar la mediación. Podrás
              ampliar la información desde el detalle del caso.
            </p>
            <form onSubmit={handleCrearCaso} className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="sr-label" htmlFor="ciudadanoNombre">
                  Nombre de la persona usuaria (opcional)
                </label>
                <input
                  id="ciudadanoNombre"
                  className="sr-input mt-1 w-full"
                  value={ciudadanoNombre}
                  onChange={(e) => setCiudadanoNombre(e.target.value)}
                  placeholder="Nombre y apellidos"
                />
              </div>

              <div>
                <label className="sr-label" htmlFor="ciudadanoEmail">
                  Correo de contacto (opcional)
                </label>
                <input
                  id="ciudadanoEmail"
                  type="email"
                  className="sr-input mt-1 w-full"
                  value={ciudadanoEmail}
                  onChange={(e) => setCiudadanoEmail(e.target.value)}
                  placeholder="correo@ejemplo.es"
                />
              </div>

              <div>
                <label className="sr-label" htmlFor="telefono">
                  Teléfono (opcional)
                </label>
                <input
                  id="telefono"
                  className="sr-input mt-1 w-full"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Móvil o fijo"
                />
              </div>

              <div>
                <label className="sr-label" htmlFor="prioridad">
                  Prioridad
                </label>
                <select
                  id="prioridad"
                  className="sr-input mt-1 w-full"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                >
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="sr-label" htmlFor="asunto">
                  Asunto del caso
                </label>
                <input
                  id="asunto"
                  className="sr-input mt-1 w-full"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Conflicto vecinal, mercantil, escolar..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="sr-label" htmlFor="descripcion">
                  Descripción inicial
                </label>
                <textarea
                  id="descripcion"
                  className="sr-input mt-1 w-full min-h-[80px]"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve resumen del caso para poder priorizarlo."
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button type="submit" className="sr-btn-primary">
                  Crear caso
                </button>
              </div>
            </form>
          </section>

          {/* Filtro y listado */}
          <section className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="sr-h2 text-base">Listado de casos</h2>
              <div className="flex items-center gap-2">
                <label className="sr-small text-zinc-600" htmlFor="filtroEstado">
                  Estado:
                </label>
                <select
                  id="filtroEstado"
                  className="sr-input"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="abierto">Abiertos</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="cerrado">Cerrados</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="sr-p text-zinc-500 mt-4">Cargando casos…</p>
            ) : casosFiltrados.length === 0 ? (
              <p className="sr-p text-zinc-500 mt-4">
                No hay casos registrados con el filtro actual.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {casosFiltrados.map((caso) => (
                  <Link
                    key={caso.id || caso.id_caso}
                    to={`/panel-institucion/casos/${caso.id || caso.id_caso}`}
                    className="rounded-2xl border bg-white p-4 hover:shadow-md flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold">
                        {caso.asunto || "Caso sin asunto"}
                      </h3>
                      <span className="sr-badge">
                        {(caso.estado || "pendiente").toUpperCase()}
                      </span>
                    </div>
                    {caso.ciudadano_nombre && (
                      <p className="sr-small text-zinc-600">
                        Persona: {caso.ciudadano_nombre}
                      </p>
                    )}
                    {caso.prioridad && (
                      <p className="sr-small text-zinc-500">
                        Prioridad: {caso.prioridad}
                      </p>
                    )}
                    <p className="sr-small text-zinc-500 mt-1">
                      Creado:{" "}
                      {caso.fecha_creacion
                        ? new Date(caso.fecha_creacion).toLocaleString("es-ES")
                        : "—"}
                    </p>
                    <p className="sr-small text-sky-700 underline mt-1">
                      Ver detalle
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
