// src/pages/PerfilInstitucion.jsx — perfil + logo de institución (URL) para usar en actas
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function PerfilInstitucion() {
  const navigate = useNavigate();

  const emailLocal = (localStorage.getItem("institucion_email") || "").trim();
  const nombreLocal = localStorage.getItem("institucion_nombre") || "";
  const expiraLocal = localStorage.getItem("institucion_expira") || "";
  const logoLocal = localStorage.getItem("institucion_logo_url") || "";

  const [email, setEmail] = useState(emailLocal);
  const [nombre, setNombre] = useState(nombreLocal);
  const [telefono, setTelefono] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [logoUrl, setLogoUrl] = useState(logoLocal);

  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState("");
  const [perfilError, setPerfilError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");

  useEffect(() => {
    if (!emailLocal) {
      navigate("/ayuntamientos/acceso");
      return;
    }
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailLocal]);

  async function cargarPerfil() {
    try {
      setLoadingPerfil(true);
      setPerfilError("");
      setPerfilMsg("");

      const resp = await fetch(
        `/api/instituciones/perfil?email=${encodeURIComponent(emailLocal)}`
      );
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        if (resp.status === 404) {
          // Perfil aún no configurado: dejamos el formulario en blanco pero sin mostrar "Not Found"
          setLoadingPerfil(false);
          return;
        }
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido recuperar el perfil de la institución."
        );
      }

      setEmail(
        (data.email || data.institucion_email || emailLocal || "").trim()
      );
      setNombre(
        data.nombre ||
          data.institucion ||
          data.institucion_nombre ||
          nombreLocal ||
          ""
      );
      setTelefono(data.telefono || data.telefono_contacto || "");
      setPersonaContacto(
        data.persona_contacto ||
          data.responsable ||
          data.contact_person ||
          ""
      );
      setObservaciones(data.observaciones || data.notas || "");
      setLogoUrl(data.logo_url || logoLocal || "");

      try {
        if (data.nombre || data.institucion || data.institucion_nombre) {
          localStorage.setItem(
            "institucion_nombre",
            data.nombre || data.institucion || data.institucion_nombre
          );
        }
        if (data.logo_url) {
          localStorage.setItem("institucion_logo_url", data.logo_url);
        }
      } catch (err) {
        console.warn("No se ha podido actualizar datos en localStorage", err);
      }
    } catch (err) {
      console.error(err);
      setPerfilError(err.message || "Error al cargar el perfil.");
    } finally {
      setLoadingPerfil(false);
    }
  }

  async function handleGuardarPerfil(e) {
    e.preventDefault();
    setPerfilError("");
    setPerfilMsg("");

    if (!email.trim() || !nombre.trim()) {
      setPerfilError("Indica al menos un nombre de institución y un correo.");
      return;
    }

    try {
      setSavingPerfil(true);
      const resp = await fetch(
        `/api/instituciones/perfil?email=${encodeURIComponent(emailLocal)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            nombre,
            telefono,
            persona_contacto: personaContacto,
            observaciones,
            logo_url: logoUrl,
          }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido guardar el perfil de la institución."
        );
      }

      setPerfilMsg("Perfil actualizado correctamente.");
      try {
        localStorage.setItem("institucion_email", String(email));
        localStorage.setItem("institucion_nombre", String(nombre));
        if (logoUrl) {
          localStorage.setItem("institucion_logo_url", String(logoUrl));
        } else {
          localStorage.removeItem("institucion_logo_url");
        }
      } catch (err) {
        console.warn("No se ha podido actualizar localStorage", err);
      }
    } catch (err) {
      console.error(err);
      setPerfilError(err.message || "Error al guardar el perfil.");
    } finally {
      setSavingPerfil(false);
    }
  }

  async function handleCambiarPassword(e) {
    e.preventDefault();
    setPassError("");
    setPassMsg("");

    if (!currentPassword || !newPassword || !newPassword2) {
      setPassError("Completa todos los campos de contraseña.");
      return;
    }

    if (newPassword.length < 8) {
      setPassError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== newPassword2) {
      setPassError("Las nuevas contraseñas no coinciden.");
      return;
    }

    try {
      setSavingPass(true);
      const resp = await fetch(
        `/api/instituciones/password?email=${encodeURIComponent(emailLocal)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password_actual: currentPassword,
            password_nueva: newPassword,
          }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se ha podido cambiar la contraseña."
        );
      }

      setPassMsg("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (err) {
      console.error(err);
      setPassError(err.message || "Error al cambiar la contraseña.");
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <>
      <Seo
        title="Perfil de la institución · Mediazion"
        description="Gestiona los datos básicos, el logo y la contraseña de acceso institucional."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card max-w-4xl mx-auto p-6 rounded-2xl">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="sr-h1">Perfil de la institución</h1>
              <p className="sr-small text-zinc-500 mt-1">
                Sesión institucional: <b>{emailLocal || "—"}</b>
              </p>
              {expiraLocal && (
                <p className="sr-small text-zinc-500">
                  Licencia activa hasta: <b>{expiraLocal}</b>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                className="sr-btn-secondary"
                onClick={() => navigate("/panel-institucion")}
              >
                Volver al panel
              </button>
            </div>
          </header>

          {perfilError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {perfilError}
            </div>
          )}
          {perfilMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {perfilMsg}
            </div>
          )}

          <section className="grid gap-6 md:grid-cols-2">
            {/* Columna izquierda: datos + logo */}
            <div className="border rounded-2xl p-4 bg-white">
              <h2 className="sr-h2 text-base mb-2">Datos de la institución</h2>
              <p className="sr-small text-zinc-600 mb-3">
                Puedes actualizar estos datos y el logo tantas veces como sea
                necesario. El logo se utilizará en las actas generadas.
              </p>

              {loadingPerfil ? (
                <p className="sr-small text-zinc-500">
                  Cargando datos de la institución…
                </p>
              ) : (
                <form onSubmit={handleGuardarPerfil} className="space-y-3">
                  <div>
                    <label className="sr-label" htmlFor="nombre">
                      Nombre de la institución
                    </label>
                    <input
                      id="nombre"
                      className="sr-input mt-1 w-full"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="sr-label" htmlFor="email">
                      Correo institucional
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="sr-input mt-1 w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="sr-label" htmlFor="telefono">
                      Teléfono de contacto
                    </label>
                    <input
                      id="telefono"
                      className="sr-input mt-1 w-full"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Teléfono general o del servicio"
                    />
                  </div>

                  <div>
                    <label className="sr-label" htmlFor="personaContacto">
                      Persona de contacto
                    </label>
                    <input
                      id="personaContacto"
                      className="sr-input mt-1 w-full"
                      value={personaContacto}
                      onChange={(e) => setPersonaContacto(e.target.value)}
                      placeholder="Nombre de la persona de referencia"
                    />
                  </div>

                  <div>
                    <label className="sr-label" htmlFor="logoUrl">
                      Logo de la institución (URL)
                    </label>
                    <input
                      id="logoUrl"
                      className="sr-input mt-1 w-full"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://ayuntamiento.es/logo.png"
                    />
                    <p className="sr-small text-zinc-500 mt-1">
                      Este logo se usará como cabecera en las actas generadas
                      desde tu panel institucional.
                    </p>
                  </div>

                  <div>
                    <label className="sr-label" htmlFor="observaciones">
                      Observaciones internas (opcional)
                    </label>
                    <textarea
                      id="observaciones"
                      className="sr-input mt-1 w-full min-h-[80px]"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas internas sobre el convenio, servicio, horarios, etc."
                    />
                  </div>

                  <button
                    type="submit"
                    className="sr-btn-primary mt-1"
                    disabled={savingPerfil}
                  >
                    {savingPerfil ? "Guardando…" : "Guardar cambios"}
                  </button>
                </form>
              )}
            </div>

            {/* Columna derecha: cambio de contraseña */}
            <div className="border rounded-2xl p-4 bg-white">
              <h2 className="sr-h2 text-base mb-2">Cambiar contraseña</h2>
              <p className="sr-small text-zinc-600 mb-3">
                Puedes cambiar la contraseña tantas veces como lo necesites.
              </p>

              {passError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {passError}
                </div>
              )}
              {passMsg && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {passMsg}
                </div>
              )}

              <form onSubmit={handleCambiarPassword} className="space-y-3">
                <div>
                  <label className="sr-label" htmlFor="currentPassword">
                    Contraseña actual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="sr-input mt-1 w-full"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="sr-label" htmlFor="newPassword">
                    Nueva contraseña
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="sr-input mt-1 w-full"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="sr-label" htmlFor="newPassword2">
                    Repetir nueva contraseña
                  </label>
                  <input
                    id="newPassword2"
                    type="password"
                    className="sr-input mt-1 w-full"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="sr-btn-secondary mt-1"
                  disabled={savingPass}
                >
                  {savingPass ? "Actualizando…" : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
