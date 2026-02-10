// src/App.jsx — RecurreTuMulta (versión limpia MVP)
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ResumenExpediente from "./pages/ResumenExpediente.jsx";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Páginas
import Inicio from "./pages/Inicio.jsx";
import ComoFunciona from "./pages/ComoFunciona.jsx";
import Precios from "./pages/Precios.jsx";
import FAQ from "./pages/FAQ.jsx";
import Gestorias from "./pages/Gestorias.jsx";
import ReservasRestaurante from "./pages/ReservasRestaurante.jsx";
import AdminRestaurantes from "./pages/AdminRestaurantes.jsx";
import PartnerUpload from "./pages/PartnerUpload";


// Pago (post-pago: datos + autorización)
import PagoOk from "./pages/PagoOk.jsx";
import PagoCancel from "./pages/PagoCancel.jsx";

// Operador
import OpsDashboard from "./pages/OpsDashboard.jsx";
import OpsCaseDetail from "./pages/OpsCaseDetail.jsx";

// Legal
import AvisoLegal from "./pages/AvisoLegal.jsx";
import Privacidad from "./pages/Privacidad.jsx";
import Cookies from "./pages/Cookies.jsx";

export default function App() {
  const location = useLocation();
  const hideChrome = location.pathname === "/__reservas-restaurante";

  return (
    <div
      className="min-h-screen text-zinc-900"
      style={{
        backgroundImage: "url('/marmol.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundPosition: "center center",
      }}
    >
      {!hideChrome && <Navbar />}

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/gestorias" element={<Gestorias />} />
        <Route path="/resumen" element={<ResumenExpediente />} />
        <Route path="/partner/upload" element={<PartnerUpload />} />

        {/* Post-pago */}
        <Route path="/pago-ok" element={<PagoOk />} />
        <Route path="/pago-cancel" element={<PagoCancel />} />

        {/* Operador */}
        <Route path="/ops" element={<OpsDashboard />} />
        <Route path="/ops/case/:caseId" element={<OpsCaseDetail />} />

        {/* Libro de reservas (oculto) */}
        <Route path="/__reservas-restaurante" element={<ReservasRestaurante />} />
        <Route path="/__admin-restaurantes" element={<AdminRestaurantes />} />


        {/* Legal */}
        <Route path="/aviso-legal" element={<AvisoLegal />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/cookies" element={<Cookies />} />
      </Routes>

      {!hideChrome && <Footer />}
    </div>
  );
}
