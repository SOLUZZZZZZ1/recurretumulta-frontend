// src/pages/admin/Colaboradores.jsx — Versión simple de prueba
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../../components/Seo.jsx";

const LS_ADMIN_KEY = "mediazion_admin_auth";

export default function AdminColaboradores() {
  const nav = useNavigate();

  // Protección admin básica: si no hay sesión, redirige a /admin
  useEffect(() => {
    const token = localStorage.getItem(LS_ADMIN_KEY);
    if (token !== "ok") {
      nav("/admin", { replace: true });
    }
  }, [nav]);

  return (
    <>
      <Seo
        title="Admin · Colaboradores"
        description="Gestión de colaboradores de Mediazion (versión de prueba)."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card">
          <h1 className="sr-h1 mb-2">Colaboradores · Admin (versión simple)</h1>
          <p className="sr-p">
            Si ves este texto, la ruta <code>/admin/colaboradores</code> está
            funcionando correctamente y el componente se está renderizando.
          </p>
          <p className="sr-small text-zinc-600 mt-4">
            Más adelante aquí añadiremos el listado de colaboradores y el
            formulario para crearlos/editar/borrar, pero de momento comprobamos
            que la navegación Admin funciona bien.
          </p>
        </section>
      </main>
    </>
  );
}
