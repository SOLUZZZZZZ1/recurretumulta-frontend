// src/pages/ActaNueva.jsx — MULTIMODELO + logo editable por institución
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";

// Modelos de acta disponibles
const MODELOS = {
  basica: {
    label: "Acta básica de sesión",
    summary:
      "En la fecha indicada, las partes se reúnen con la persona mediadora para abordar el conflicto expuesto. " +
      "Se describen brevemente los antecedentes, el origen de la controversia y los principales puntos de desacuerdo.\n\n" +
      "La sesión se desarrolla en un clima de respeto, confidencialidad y escucha activa, facilitando que las partes " +
      "expongan sus necesidades e intereses.",
    agreements:
      "Tras el intercambio de información y la exploración de alternativas, las partes alcanzan los siguientes acuerdos:\n\n" +
      "1. ...\n2. ...\n3. ...\n\n" +
      "Las partes se comprometen a cumplir los acuerdos adoptados de buena fe."
  },
  cierre_con_acuerdo: {
    label: "Cierre del proceso CON acuerdo",
    summary:
      "Se deja constancia de que el proceso de mediación se ha desarrollado en las fechas y sesiones previstas, " +
      "con la participación de las partes implicadas. Durante las sesiones se han identificado los puntos de conflicto " +
      "y se han explorado distintas opciones para su resolución.\n\n" +
      "Las partes manifiestan haber sido informadas del funcionamiento de la mediación, de su carácter voluntario y " +
      "de la confidencialidad del proceso.",
    agreements:
      "Como resultado del proceso, las partes alcanzan un ACUERDO que se concreta en los puntos siguientes:\n\n" +
      "1. ...\n2. ...\n3. ...\n\n" +
      "Las partes declaran que el acuerdo ha sido adoptado libremente, sin coacciones y en condiciones de equilibrio."
  },
  cierre_sin_acuerdo: {
    label: "Cierre del proceso SIN acuerdo",
    summary:
      "Se deja constancia de que, tras las sesiones celebradas y las gestiones realizadas, no ha sido posible " +
      "alcanzar un acuerdo entre las partes dentro del proceso de mediación.\n\n" +
      "Las partes han tenido oportunidad de exponer sus posiciones y necesidades, así como de valorar distintas " +
      "alternativas de solución, sin que se haya logrado un resultado consensuado.",
    agreements:
      "En consecuencia, el proceso de mediación se da por finalizado SIN ACUERDO.\n\n" +
      "Se informa a las partes de que pueden recurrir a otras vías de gestión del conflicto (negociación directa, " +
      "servicios especializados, asesoramiento jurídico o, en su caso, vías judiciales)."
  },
  derivacion: {
    label: "Acta de derivación al servicio",
    summary:
      "La institución derivante informa de la existencia de un conflicto susceptible de ser abordado mediante " +
      "mediación. Se recogen los datos básicos del caso y de las personas implicadas, así como el contexto " +
      "en el que surge la derivación.\n\n" +
      "Se hace constar que se ha informado a las personas afectadas sobre la posibilidad de utilizar la mediación " +
      "como herramienta de gestión del conflicto.",
    agreements:
      "Compromisos iniciales:\n\n" +
      "1. El servicio de mediación realizará una primera valoración del caso.\n" +
      "2. Se contactará con las partes para ofrecer información detallada sobre el proceso.\n" +
      "3. Se acordará, en su caso, la fecha de la primera sesión de mediación."
  },
  escolar: {
    label: "Acta de mediación escolar",
    summary:
      "En el contexto educativo se detecta un conflicto que afecta a la convivencia en el centro. " +
      "Las partes implicadas (alumnado, familias y/o profesorado) participan en una sesión de mediación escolar " +
      "con el objetivo de mejorar la comunicación y restaurar la convivencia.\n\n" +
      "Durante la sesión se identifican los hechos relevantes, las percepciones de cada parte y las necesidades " +
      "de la comunidad educativa.",
    agreements:
      "Como resultado de la mediación escolar, se acuerdan las siguientes medidas:\n\n" +
      "1. ...\n2. ...\n3. ...\n\n" +
      "Se acordarán, además, mecanismos de seguimiento para valorar el cumplimiento y la evolución de la convivencia."
  }
};

export default function ActaNueva() {
  const navigate = useNavigate();
  const location = useLocation();

  const isInstitucion = location.pathname.startsWith("/panel-institucion");
  const backRoute = isInstitucion ? "/panel-institucion" : "/panel-mediador";

  const logoPerfil =
    (typeof window !== "undefined" &&
      (localStorage.getItem("institucion_logo_url") || "")) ||
    "";
  const defaultLogo = logoPerfil || "https://mediazion.eu/logo.png";

  const [modelo, setModelo] = useState("basica");
  const [form, setForm] = useState({
    case_no: "",
    date_iso: "",
    mediator_alias: "",
    parties: "",
    summary: MODELOS["basica"].summary,
    agreements: MODELOS["basica"].agreements,
    confidentiality: true,
    location: "España",
    logo_url: defaultLogo,
    logo_mode: "normal",
    logo_width_cm: 9.0
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [url, setUrl] = useState("");

  function aplicarModelo(id) {
    setModelo(id);
    setForm((s) => ({
      ...s,
      summary: MODELOS[id].summary,
      agreements: MODELOS[id].agreements
    }));
  }

  const onChange = (k) => (e) => {
    const v =
      e.target.type === "checkbox"
        ? e.target.checked
        : e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;
    setForm((s) => ({ ...s, [k]: v }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setUrl("");

    try {
      const resp = await fetch("/api/actas/render_docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.detail || "No se pudo generar el acta.");
      }
      setUrl(data.url);
      setMsg("Acta generada correctamente.");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Error generando el acta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo
        title="Nueva acta · Modelos de mediación"
        description="Genera actas de mediación con distintos modelos y con el logo de tu institución en la cabecera."
      />
      <main
        className="sr-container py-10"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <section className="sr-card max-w-5xl mx-auto p-6 rounded-2xl">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h1 className="sr-h1">Generar acta de mediación</h1>
              <p className="sr-p text-zinc-600 mt-1">
                Selecciona el modelo de acta, revisa los textos y genera un DOCX con el logo de tu institución en la cabecera.
              </p>
            </div>
            <button
              type="button"
              className="sr-btn-secondary"
              onClick={() => navigate(backRoute)}
            >
              Volver al panel
            </button>
          </header>

          <section className="mb-5">
            <label className="sr-label" htmlFor="modelo">
              Modelo de acta
            </label>
            <select
              id="modelo"
              className="sr-input mt-1"
              value={modelo}
              onChange={(e) => aplicarModelo(e.target.value)}
            >
              {Object.entries(MODELOS).map(([id, m]) => (
                <option key={id} value={id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="sr-small text-zinc-500 mt-1">
              Puedes usar el texto propuesto como base y editarlo libremente antes de generar el documento.
            </p>
          </section>

          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="sr-label" htmlFor="case_no">
                  Nº de expediente
                </label>
                <input
                  id="case_no"
                  className="sr-input mt-1 w-full"
                  value={form.case_no}
                  onChange={onChange("case_no")}
                  required
                />
              </div>
              <div>
                <label className="sr-label" htmlFor="date_iso">
                  Fecha
                </label>
                <input
                  id="date_iso"
                  type="date"
                  className="sr-input mt-1 w-full"
                  value={form.date_iso}
                  onChange={onChange("date_iso")}
                  required
                />
              </div>
            </div>

            <div>
              <label className="sr-label" htmlFor="mediator_alias">
                Alias / Nombre del mediador/a
              </label>
              <input
                id="mediator_alias"
                className="sr-input mt-1 w-full"
                value={form.mediator_alias}
                onChange={onChange("mediator_alias")}
                required
              />
            </div>

            <div>
              <label className="sr-label" htmlFor="parties">
                Partes intervinientes
              </label>
              <textarea
                id="parties"
                className="sr-input mt-1 w-full min-h-[70px]"
                value={form.parties}
                onChange={onChange("parties")}
                required
              />
            </div>

            <div>
              <label className="sr-label" htmlFor="summary">
                Antecedentes / Hechos
              </label>
              <textarea
                id="summary"
                className="sr-input mt-1 w-full min-h-[100px]"
                value={form.summary}
                onChange={onChange("summary")}
                required
              />
            </div>

            <div>
              <label className="sr-label" htmlFor="agreements">
                Acuerdos y compromisos
              </label>
              <textarea
                id="agreements"
                className="sr-input mt-1 w-full min-h-[100px]"
                value={form.agreements}
                onChange={onChange("agreements")}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="sr-label" htmlFor="logo_url">
                  Logo en cabecera (URL)
                </label>
                <input
                  id="logo_url"
                  className="sr-input mt-1 w-full"
                  value={form.logo_url}
                  onChange={onChange("logo_url")}
                  placeholder="https://ayuntamiento.es/logo.png"
                />
                <p className="sr-small text-zinc-500 mt-1">
                  Si se deja vacío, se utilizará el logo por defecto de Mediazion.
                </p>
              </div>
              <div>
                <label className="sr-label" htmlFor="logo_width_cm">
                  Tamaño logo (cm)
                </label>
                <input
                  id="logo_width_cm"
                  type="number"
                  min="5"
                  max="12"
                  step="0.5"
                  className="sr-input mt-1 w-full"
                  value={form.logo_width_cm}
                  onChange={onChange("logo_width_cm")}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="confidentiality"
                type="checkbox"
                checked={form.confidentiality}
                onChange={onChange("confidentiality")}
              />
              <label
                htmlFor="confidentiality"
                className="sr-small text-zinc-700"
              >
                Incluir cláusula de confidencialidad en el acta
              </label>
            </div>

            <button
              type="submit"
              className="sr-btn-primary mt-2"
              disabled={busy}
            >
              {busy ? "Generando…" : "Generar acta (DOCX)"}
            </button>

            {msg && (
              <p className="sr-small mt-2 text-zinc-700">
                {msg}
              </p>
            )}
            {url && (
              <p className="sr-small mt-2">
                Descargar:{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sr-btn-secondary"
                >
                  Abrir DOCX
                </a>
              </p>
            )}
          </form>
        </section>
      </main>
    </>
  );
}
