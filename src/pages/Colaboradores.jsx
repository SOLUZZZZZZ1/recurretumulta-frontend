// src/pages/Colaboradores.jsx — Página pública de Colaboradores (solo lectura)
import React, { useEffect, useState } from "react";
import Seo from "../components/Seo.jsx";

export default function Colaboradores() {
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Versión sencilla: si hay API de admin/colaboradores, usamos eso.
    // Si algo falla, mostramos un mensaje suave y/o podrías dejar el contenido estático.
    async function load() {
      try {
        const resp = await fetch("/api/admin/colaboradores");
        if (!resp.ok) {
          // Si no hay backend aún o da error, no rompemos la página pública.
          setErrorMsg("No se ha podido cargar la lista de colaboradores.");
          return;
        }
        const data = await resp.json();
        const activos = Array.isArray(data)
          ? data.filter((c) => c.activo)
          : [];
        setItems(activos);
      } catch (e) {
        console.error(e);
        setErrorMsg("No se ha podido cargar la lista de colaboradores.");
      }
    }
    load();
  }, []);

  return (
    <>
      <Seo
        title="Colaboradores · Mediazion"
        description="Conoce a los colaboradores que apoyan el proyecto Mediazion."
        canonical="https://mediazion.eu/colaboradores"
      />
      <main
        className="sr-container py-8"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card mb-6">
          <h1 className="sr-h1 mb-2">Colaboradores de Mediazion</h1>
          <p className="sr-p text-zinc-700">
            En esta página se muestran los colaboradores que apoyan el proyecto
            Mediazion: entidades, empresas y profesionales que aportan valor al
            ecosistema de la mediación.
          </p>
        </section>

        <section className="sr-card mb-10">
          <h2 className="sr-h2 mb-2">Listado de colaboradores</h2>

          {errorMsg && (
            <p className="sr-small text-red-700 mb-3">{errorMsg}</p>
          )}

          {items.length === 0 && !errorMsg && (
            <p className="sr-small text-zinc-500">
              Todavía no hay colaboradores publicados. Muy pronto añadiremos
              aquí las primeras entidades colaboradoras.
            </p>
          )}

          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              {items.map((c) => (
                <a
                  key={c.id}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sr-card p-4 flex flex-col items-start gap-2 hover:shadow-md"
                >
                  {c.logo_url && (
                    <img
                      src={c.logo_url}
                      alt={c.nombre}
                      className="h-10 w-auto object-contain mb-2"
                    />
                  )}
                  <div className="font-semibold">{c.nombre}</div>
                  <div className="sr-small text-zinc-600 break-all">
                    {c.url}
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
