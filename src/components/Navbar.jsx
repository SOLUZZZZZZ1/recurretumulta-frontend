// src/components/Navbar.jsx — Navegación principal con fila inferior: Instituciones (izq) y Colaboradores (dcha)
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const tab = ({ isActive }) => "sr-tab" + (isActive ? " active" : "");

  // Detectamos si hay sesión institucional en localStorage
  let hasInstitucionSession = false;
  try {
    if (typeof window !== "undefined") {
      hasInstitucionSession = !!localStorage.getItem("institucion_email");
    }
  } catch {
    hasInstitucionSession = false;
  }

  return (
    <header className="sr-navbar">
      {/* Fila superior: marca + pestañas principales */}
      <div className="sr-row">
        {/* Marca solo con texto MEDIAZION */}
        <Link to="/" aria-label="MEDIAZION" className="sr-brand">
          <span className="sr-brand-title">MEDIAZION</span>
        </Link>

        <nav className="sr-tabs" aria-label="Navegación principal">
          {/* Bloque principal sitio web */}
          <NavLink to="/" end className={tab}>
            Inicio
          </NavLink>
          <NavLink to="/quienes-somos" className={tab}>
            Quiénes somos
          </NavLink>
          <NavLink to="/servicios" className={tab}>
            Servicios
          </NavLink>
          <NavLink to="/mediadores" className={tab}>
            Mediadores
          </NavLink>
          <NavLink to="/mediadores/directorio" className={tab}>
            Directorio
          </NavLink>
          <NavLink to="/tarifas" className={tab}>
            Tarifas
          </NavLink>
          <NavLink to="/contacto" className={tab}>
            Contacto
          </NavLink>
          <NavLink to="/actualidad" className={tab}>
            Actualidad
          </NavLink>
          <NavLink to="/voces" className={tab}>
            Voces
          </NavLink>
          <NavLink to="/ayuda" className={tab}>
            Ayuda
          </NavLink>

          {/* Panel mediadores / instituciones */}
          {hasInstitucionSession ? (
            <NavLink to="/panel-institucion" className={tab}>
              Panel
            </NavLink>
          ) : (
            <NavLink to="/panel-mediador" className={tab}>
              Panel
            </NavLink>
          )}

          <NavLink to="/admin" className={tab}>
            Admin
          </NavLink>
        </nav>
      </div>

      {/* Fila inferior: Instituciones (izquierda) y Colaboradores (derecha) */}
      <div className="sr-row" style={{ marginTop: "4px" }}>
        <div className="flex w-full items-center justify-between">
          {/* Izquierda: Instituciones */}
          <NavLink
            to="/instituciones"
            className="sr-tab"
            style={{ fontWeight: 700 }}
          >
            Instituciones
          </NavLink>

          {/* Derecha: Colaboradores */}
          <NavLink
            to="/colaboradores"
            className="sr-tab"
            style={{ fontWeight: 700 }}
          >
            Colaboradores
          </NavLink>
        </div>
      </div>

      <div className="sr-navbar-underline" />
    </header>
  );
}
