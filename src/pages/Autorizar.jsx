import React, { useEffect, useState } from "react";
import Seo from "../components/Seo.jsx";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function Autorizar() {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const caseId = params.get("case");

  const [data, setData] = useState(null);
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!caseId) return;
    fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/public-status`)
      .then(setData)
      .catch(() => setError("No s'ha pogut carregar l'expedient."));
  }, [caseId]);

  async function autorizar() {
    if (!checked || !checked2) return;
    setLoading(true);
    try {
      await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "v1_dgt_homologado"
        })
      });
      window.location.href = `/#/resumen?case=${caseId}`;
    } catch (e) {
      setError(e.message || "Error autoritzant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo title="Autorització de tramitació" description="Autoritza la tramitació administrativa del teu expedient." />
      <main className="sr-container py-12">
        <h1 className="sr-h1">Autorització per tramitar el teu expedient</h1>

        <p className="sr-p">
          Aquesta tramitació es realitza <b>a través de la teva assessoria</b>, amb suport tècnic de RecurreTuMulta.
        </p>

        {error && <div className="sr-small" style={{ color: "#991b1b" }}>❌ {error}</div>}

        {data && (
          <div className="sr-card">
            <p className="sr-p">
              RecurreTuMulta (LA TALAMANQUINA, S.L.) està <b>homologada per la DGT</b> per actuar en representació de tercers.
            </p>

            <div className="sr-card" style={{ background: "#f9fafb" }}>
              <b>Text d'autorització</b>
              <p className="sr-p" style={{ whiteSpace: "pre-line" }}>
                Jo, {data.contact_name || "el/la interessat/da"}, autoritzo a LA TALAMANQUINA, S.L. (RecurreTuMulta)
                a actuar en el meu nom per a la tramitació administrativa de l'expedient associat a aquest procés,
                incloent la preparació i presentació d'al·legacions i/o recursos davant la DGT o organisme competent,
                així com l'obtenció del justificant oficial de presentació.

                Aquesta autorització es concedeix a sol·licitud de la meva assessoria i no altera la meva relació amb aquesta.
              </p>
            </div>

            <label className="sr-small" style={{ display: "block", marginTop: 12 }}>
              <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /> He llegit i accepto el text d'autorització.
            </label>
            <label className="sr-small" style={{ display: "block", marginTop: 8 }}>
              <input type="checkbox" checked={checked2} onChange={e => setChecked2(e.target.checked)} /> Confirmo que les dades corresponen a la meva persona.
            </label>

            <button className="sr-btn-primary" style={{ marginTop: 14 }} disabled={!checked || !checked2 || loading} onClick={autorizar}>
              {loading ? "Autoritzant…" : "Autoritzar i continuar"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}