// src/components/Navbar.jsx — Navbar limpio (sin CTA duplicado)
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="sr-navbar">
      <div className="sr-row">
        <Link to="/" className="sr-brand">
          <span className="sr-wordmark">RecurreTuMulta</span>
        </Link>

        <nav className="sr-tabs">
          <Link to="/" className="sr-tab">Inicio</Link>
          <Link to="/como-funciona" className="sr-tab">Cómo funciona</Link>
          <Link to="/precios" className="sr-tab">Precios</Link>
          <Link to="/faq" className="sr-tab">FAQ</Link>
          <Link to="/contacto" className="sr-tab">Contacto</Link>
        </nav>
      </div>
      <div className="sr-navbar-underline" />
    </header>
  );
}
