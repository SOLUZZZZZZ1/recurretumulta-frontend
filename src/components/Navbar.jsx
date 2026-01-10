import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const tab = ({ isActive }) => "sr-tab" + (isActive ? " active" : "");

  return (
    <header
      className="sr-navbar"
      style={{
        backgroundColor: "#1f3a5f", // azul confianza
        color: "#ffffff",
      }}
    >
      <div className="sr-row">
        {/* Marca: solo icono RTM */}
        <Link to="/" aria-label="RTM · RecurreTuMulta" className="sr-brand">
          <img
            src="/rtm-64.png"
            alt="RTM"
            style={{
              height: 34,
              width: 34,
              display: "block",
            }}
          />
        </Link>

        {/* Navegación */}
        <nav className="sr-tabs" aria-label="Navegación principal">
          <NavLink to="/" end className={tab}>
            Inicio
          </NavLink>
          <NavLink to="/como-funciona" className={tab}>
            Cómo funciona
          </NavLink>
          <NavLink to="/precios" className={tab}>
            Precios
          </NavLink>
          <NavLink to="/faq" className={tab}>
            FAQ
          </NavLink>
          <NavLink to="/contacto" className={tab}>
            Contacto
          </NavLink>

          {/* CTA */}
          <Link
            to="/"
            className="sr-btn-primary"
            style={{
              marginLeft: 12,
              backgroundColor: "#2bb673", // verde RTM
              borderColor: "#2bb673",
            }}
          >
            Subir multa
          </Link>
        </nav>
      </div>

      {/* Línea inferior opcional (puede eliminarse si no te gusta) */}
      <div
        className="sr-navbar-underline"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      />
    </header>
  );
}
