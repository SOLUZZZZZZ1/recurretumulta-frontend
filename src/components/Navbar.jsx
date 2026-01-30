import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          RecurreTuMulta
        </Link>
      </div>

      <div className="navbar-right">
        <Link to="/" className="navbar-link">Inicio</Link>
        <Link to="/como-funciona" className="navbar-link">Cómo funciona</Link>
        <Link to="/precios" className="navbar-link">Precios</Link>
        <Link to="/faq" className="navbar-link">FAQ</Link>
        <Link to="/contacto" className="navbar-link">Contacto</Link>
      </div>
    </nav>
  );
}
