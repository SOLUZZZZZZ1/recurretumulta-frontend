 HEAD
import { Link, useLocation } from "react-router-dom";
import logo from "/rtm-logo-transparente-recortado.png";

export default function Navbar() {
  const { pathname } = useLocation();

  const linkStyle = (to) => ({
    color: "white",
    textDecoration: "none",
    fontWeight: pathname === to ? 800 : 600,
    opacity: pathname === to ? 1 : 0.95,
    padding: "8px 10px",
    borderRadius: 10,
    background: pathname === to ? "rgba(255,255,255,0.12)" : "transparent",
    whiteSpace: "nowrap",
    fontSize: 15,
  });

  return (
    <header
      style={{
        width: "100%",
        background: "#0b4aa2",
        padding: "10px 18px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flex: "0 0 auto",
          }}
        >
          <img
            src={logo}
            alt="RecurreTuMulta"
            style={{
              height: 52,
              width: "auto",
              display: "block",
              objectFit: "contain",
            }}
          />
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Link to="/" style={linkStyle("/")}>Inicio</Link>
          <Link to="/como-funciona" style={linkStyle("/como-funciona")}>Cómo funciona</Link>
          <Link to="/precios" style={linkStyle("/precios")}>Precios</Link>

          <Link to="/eliminar-coche" style={linkStyle("/eliminar-coche")}>
            🚗 Eliminar coche
          </Link>

          <Link to="/gestorias" style={linkStyle("/gestorias")}>Asesorías</Link>
          <Link to="/faq" style={linkStyle("/faq")}>FAQ</Link>
          <Link to="/contacto" style={linkStyle("/contacto")}>Contacto</Link>
=======
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "/rtm-logo-transparente-recortado.png";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/como-funciona", label: "Cómo funciona" },
  { to: "/precios", label: "Precios" },
  { to: "/eliminar-coche", label: "🚗 Eliminar coche" },
  { to: "/asnef", label: "📋 Salir de ASNEF" },
  { to: "/gestorias", label: "Asesorías" },
  { to: "/faq", label: "FAQ" },
  { to: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="rtm-navbar">
      <div className="rtm-navbar-inner">
        <Link to="/" className="rtm-navbar-brand" aria-label="Ir al inicio">
          <img src={logo} alt="RecurreTuMulta" className="rtm-navbar-logo" />
        </Link>

        <button
          type="button"
          className="rtm-menu-button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="rtm-main-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="rtm-menu-icon" aria-hidden="true">
            {open ? "✕" : "☰"}
          </span>
          <span>Menú</span>
        </button>

        <nav
          id="rtm-main-menu"
          className={`rtm-navbar-links ${open ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          {LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`rtm-navbar-link ${active ? "is-active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
 e269cea (Guardar estado actual del frontend antes de sincronizar)
        </nav>
      </div>
    </header>
  );
}
