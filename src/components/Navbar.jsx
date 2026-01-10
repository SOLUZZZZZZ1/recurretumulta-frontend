import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const tab = ({ isActive }) => "sr-tab" + (isActive ? " active" : "");

  return (
    <header className="sr-navbar">
      <div className="sr-row">
        {/* Marca */}
        <Link to="/" aria-label="RTM · RecurreTuMulta" className="sr-brand">
          <img
            src="/rtm-64.png"
            alt="RTM"
            style={{ height: 34, width: 34, display: "block" }}
          />
          <span className="sr-wordmark sr-hidden-mobile" style={{ letterSpacing: "0.02em" }}>
            RecurreTuMulta
          </span>
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

          {/* ✅ Solo este en verde */}
          <Link to="/" className="sr-btn-cta" style={{ marginLeft: 12 }}>
            Subir multa
          </Link>
        </nav>
      </div>

      <div className="sr-navbar-underline" />
    </header>
  );
}
