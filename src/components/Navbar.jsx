import { Link, useLocation } from "react-router-dom";
import logo from "/rtm-navbar.png"; // si tu logo está en public con ese nombre

export default function Navbar() {
  const { pathname } = useLocation();

  const linkStyle = (to) => ({
    color: "white",
    textDecoration: "none",
    fontWeight: pathname === to ? 700 : 500,
    opacity: pathname === to ? 1 : 0.95,
    padding: "8px 10px",
    borderRadius: 10,
    background: pathname === to ? "rgba(255,255,255,0.12)" : "transparent",
    whiteSpace: "nowrap",
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
        {/* Left: logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src={logo}
            alt="RecurreTuMulta"
            style={{ height: 34, width: "auto", display: "block" }}
          />
        </Link>

        {/* Right: tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link to="/" style={linkStyle("/")}>Inicio</Link>
          <Link to="/como-funciona" style={linkStyle("/como-funciona")}>Cómo funciona</Link>
          <Link to="/precios" style={linkStyle("/precios")}>Precios</Link>
          <Link to="/partners">Asesorías</Link>
          <Link to="/faq" style={linkStyle("/faq")}>FAQ</Link>
          <Link to="/contacto" style={linkStyle("/contacto")}>Contacto</Link>
        </nav>
      </div>
    </header>
  );
}
