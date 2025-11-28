
// src/pages/AyuntamientoLogin.jsx — corregido para panel-institucion
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

const DEV_ALLOW_FALLBACK = true;

export default function AyuntamientoLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMsg("Introduce tu correo institucional y la contraseña.");
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch("/api/instituciones/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        const emailFinal =
          data.email || data.institucion_email || trimmedEmail;

        const nombreInstitucion =
          data.institucion ||
          data.institucion_nombre ||
          data.nombre ||
          data.name ||
          "Institución";

        const expira =
          data.fecha_expiracion ||
          data.expira ||
          data.expires_at ||
          null;

        const tipo = data.tipo || "—";
        const token =
          data.token ||
          data.access_token ||
          data.session_token ||
          "token";

        try {
          localStorage.setItem("institucion_email", String(emailFinal));
          localStorage.setItem("institucion_nombre", String(nombreInstitucion));
          localStorage.setItem("institucion_tipo", String(tipo));
          if (expira) {
            localStorage.setItem("institucion_expira", String(expira));
          } else {
            localStorage.removeItem("institucion_expira");
          }
          localStorage.setItem("institucion_token", String(token));
        } catch (err) {
          console.error("Error guardando datos institucionales", err);
        }

        navigate("/panel-institucion");
        return;
      }

      const detail =
        data?.detail ||
        data?.message ||
        "No se ha podido iniciar sesión.";

      if (DEV_ALLOW_FALLBACK) {
        try {
          localStorage.setItem("institucion_email", String(trimmedEmail));
          localStorage.setItem("institucion_nombre", "Institución de prueba");
          localStorage.removeItem("institucion_expira");
          localStorage.setItem("institucion_token", "dev-token");
        } catch (err) {
          console.error("Error guardando fallback institucional", err);
        }
        navigate("/panel-institucion");
        return;
      }

      throw new Error(detail);
    } catch (err) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo
        title="Acceso Instituciones · Mediazion"
        description="Acceso seguro para Ayuntamientos, Cámaras y Colegios."
      />
      <main
        className="sr-container py-12"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="max-w-md mx-auto sr-card p-8 rounded-2xl">
          <h1 className="sr-h1 mb-4 text-center">Acceso Instituciones</h1>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="sr-label" htmlFor="email">
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                className="sr-input mt-1 w-full"
                placeholder="correo@institucion.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="sr-label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="sr-input mt-1 w-full"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="sr-btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? "Accediendo…" : "Entrar en el panel"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
