import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const tab = ({ isActive }) => "sr-tab" + (isActive ? " active" : "");

  return (
    <header className="sr-navbar">
      <div className="sr-row">
        {/* Marca */}
        <Link to="/" aria-label="RecurreTuMulta" className="sr-brand">
          <span className="sr-brand-title">RECURRE TU MULTA</span>
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
            style={{ marginLeft: 8 }}
          >
            Subir multa
          </Link>
        </nav>
      </div>

      <div className="sr-navbar-underline" />
    </header>
  );
}
