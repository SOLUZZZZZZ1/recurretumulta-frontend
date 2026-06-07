// src/pages/Inicio.jsx
import React from "react";
import SOSButton from "../components/SOSButton.jsx";
import "./inicio.css";

export default function Inicio() {
  return (
    <div className="sr-inicio">
      {/* HÉROE original, sin botón temporal Push FCM */}
      <div className="sr-hero">
        <div className="sr-hero__bg" />
        <div className="sr-hero__overlay" />

        <div className="sr-card sr-hero__content">
          <img
            src="/logo.png"
            alt="SpainRoom"
            className="sr-hero-logo sr-hero__logo"
          />

          <h1
            className="sr-hero__title"
            style={{
              margin: 0,
              fontSize: "clamp(24px, 4.2vw, 40px)",
              lineHeight: 1.1,
            }}
          >
            Bienvenido a SpainRoom
          </h1>

          <p
            className="sr-hero__subtitle"
            style={{
              margin: "12px auto 0",
              lineHeight: 1.6,
              fontSize: "clamp(14px, 2vw, 18px)",
              maxWidth: 880,
            }}
          >
            Encuentra habitaciones listas para entrar a vivir en las mejores zonas.
            <br />
            SpainRoom conecta personas, viviendas y oportunidades.
            <br />
            Confiable, moderno y cercano.
          </p>
        </div>
      </div>

      <SOSButton />
    </div>
  );
}
