// src/App.jsx — RecurreTuMulta (versión limpia MVP)
import React from "react";
import { Routes, Route } from "react-router-dom";
import ResumenExpediente from "./pages/ResumenExpediente.jsx";
import OpsDashboard from "./pages/OpsDashboard.jsx";


import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Páginas
import Inicio from "./pages/Inicio.jsx";
import ComoFunciona from "./pages/ComoFunciona.jsx";
import Precios from "./pages/Precios.jsx";
import FAQ from "./pages/FAQ.jsx";


// Legal
import AvisoLegal from "./pages/AvisoLegal.jsx";
import Privacidad from "./pages/Privacidad.jsx";
import Cookies from "./pages/Cookies.jsx";

export default function App() {
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
      <Navbar />

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/resumen" element={<ResumenExpediente />} />
        <Route path="/ops" element={<OpsDashboard />} />

        

        {/* Legal */}
        <Route path="/aviso-legal" element={<AvisoLegal />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/cookies" element={<Cookies />} />
      </Routes>

      <Footer />
    </div>
  );
}
