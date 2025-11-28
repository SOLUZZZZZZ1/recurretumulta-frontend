// src/pages/PanelAyuntamiento.jsx — Panel del Ayuntamiento usando InstitucionDashboard
import React from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import InstitucionDashboard from "../components/InstitucionDashboard.jsx";

export default function PanelAyuntamiento() {
  const nav = useNavigate();

  // Datos de la sesión institucional (rellenados en el login real)
  const email =
    localStorage.getItem("institucion_email") || "ayuntamiento@ejemplo.es";
  const nombreInstitucion =
    localStorage.getItem("institucion_nombre") || "Ayuntamiento";
  const expRaw = localStorage.getItem("institucion_expira") || null;

  function handleLogout() {
    // Limpiamos todas las claves institucionales
    localStorage.removeItem("institucion_email");
    localStorage.removeItem("institucion_nombre");
    localStorage.removeItem("institucion_expira");
    localStorage.removeItem("institucion_token");

    // Volvemos a la pantalla de acceso institucional
    nav("/ayuntamientos/acceso");
  }

  return (
    <>
      <Seo
        title="Panel del Ayuntamiento · Mediazion"
        description="Panel institucional para gestionar mediación comunitaria y convivencia vecinal desde el Ayuntamiento."
      />
      <main
        className="sr-container py-8"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <InstitucionDashboard
          who={email}
          institucion={nombreInstitucion}
          expiresAt={expRaw}
          onLogout={handleLogout}
        />
      </main>
    </>
  );
}
