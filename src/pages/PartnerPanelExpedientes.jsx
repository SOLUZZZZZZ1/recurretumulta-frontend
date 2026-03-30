import React, { useEffect, useState } from "react";
import Seo from "../components/Seo.jsx";
import { Link, useNavigate } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || `Error HTTP ${r.status}`);
  return data;
}

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-ES");
  } catch {
    return String(d);
  }
}

function statusLabel(status) {
  const map = {
    uploaded: "Subido",
    pending_documents: "Pendiente documentación",
    ready_to_pay: "Listo para pagar",
    ready_to_submit: "Listo para presentar",
    submitted: "Presentado",
    closed: "Cerrado",
  };
  return map[status] || status || "—";
}

export default function PartnerPanelExpedientes() {
  const nav = useNavigate();

  const [partnerToken, setPartnerToken] = useState(() => localStorage.getItem("partner_token") || "");
  const [partnerName, setPartnerName] = useState(() => localStorage.getItem("partner_name") || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const t = (localStorage.getItem("partner_token") || "").trim();
    const n = localStorage.getItem("partner_name") || "";
    setPartnerToken(t);
    setPartnerName(n);

    if (!t) {
      nav("/gestorias");
      return;
    }

    loadCases(t, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCases(tokenOverride = null, qOverride = null, statusOverride = null) {
    setErr("");

    const t = (tokenOverride ?? partnerToken ?? "").trim();
    const qq = qOverride ?? q;
    const st = statusOverride ?? status;

    if (!t) {
      setErr("Sesión no encontrada. Vuelve a entrar en el portal de asesorías.");
      nav("/gestorias");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if ((qq || "").trim()) params.set("q", qq.trim());
      if ((st || "").trim()) params.set("status", st.trim());

      const qs = params.toString();
      const url = qs ? `${API}/partner/cases?${qs}` : `${API}/partner/cases`;

      const data = await fetchJson(url, {
        headers: {
          Authorization: `Bearer ${t}`,
        },
      });

      setItems(data.items || []);
      if (data.partner_name) {
        setPartnerName(data.partner_name);
        localStorage.setItem("partner_name", data.partner_name);
      }
    } catch (e) {
      setItems([]);
      setErr(e.message || "No se pudo cargar el listado de expedientes.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("partner_token");
    localStorage.removeItem("partner_name");
    localStorage.removeItem("partner_email");
    localStorage.removeItem("partner_must_change");
    nav("/gestorias");
  }

  return (
    <>
      <Seo
        title="Panel gestorías · RecurreTuMulta"
        description="Listado de expedientes del portal profesional para asesorías."
        canonical="https://www.recurretumulta.eu/partner/panel"
      />

      <main className="sr-container py-12" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h1 className="sr-h1">Panel gestorías</h1>
            <div className="sr-small" style={{ color: "#6b7280" }}>
              Asesoría: <b>{partnerName || "—"}</b>
            </div>
          </div>

          <div className="sr-cta-row" style={{ justifyContent: "flex-end" }}>
            <Link to="/gestorias" className="sr-btn-secondary">
              ← Volver
            </Link>
            <button className="sr-btn-secondary" onClick={logout}>
              Salir
            </button>
          </div>
        </div>

        <div className="sr-card">
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "1fr 220px 180px",
              alignItems: "end",
            }}
          >
            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>Buscar</label>
              <input
                className="sr-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Expediente, cliente o email"
              />
            </div>

            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>Estado</label>
              <select className="sr-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="uploaded">Subido</option>
                <option value="pending_documents">Pendiente documentación</option>
                <option value="ready_to_pay">Listo para pagar</option>
                <option value="ready_to_submit">Listo para presentar</option>
                <option value="submitted">Presentado</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>

            <div className="sr-cta-row" style={{ justifyContent: "flex-start" }}>
              <button className="sr-btn-primary" onClick={() => loadCases()} disabled={loading}>
                {loading ? "Cargando…" : "Actualizar"}
              </button>
            </div>
          </div>

          {err ? (
            <div className="sr-small" style={{ marginTop: 12, color: "#991b1b" }}>
              ❌ {err}
            </div>
          ) : null}
        </div>

        <div className="sr-card" style={{ marginTop: 14 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="sr-h3" style={{ margin: 0 }}>Mis expedientes</div>
            <div className="sr-small" style={{ color: "#6b7280" }}>
              {items.length} resultados
            </div>
          </div>

          {items.length === 0 ? (
            <div className="sr-small" style={{ marginTop: 12, color: "#6b7280" }}>
              No hay expedientes para mostrar.
            </div>
          ) : (
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "10px 8px" }}>Expediente</th>
                    <th style={{ padding: "10px 8px" }}>Cliente</th>
                    <th style={{ padding: "10px 8px" }}>Estado</th>
                    <th style={{ padding: "10px 8px" }}>Autorización</th>
                    <th style={{ padding: "10px 8px" }}>Docs</th>
                    <th style={{ padding: "10px 8px" }}>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.case_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 8px", verticalAlign: "top" }}>
                        <div className="sr-small" style={{ fontWeight: 800 }}>{item.case_id}</div>
                      </td>
                      <td style={{ padding: "10px 8px", verticalAlign: "top" }}>
                        <div className="sr-small" style={{ fontWeight: 700 }}>{item.client_name || "—"}</div>
                        <div className="sr-small" style={{ color: "#6b7280" }}>{item.client_email || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 8px", verticalAlign: "top" }}>
                        <div className="sr-small">{statusLabel(item.status)}</div>
                        <div className="sr-small" style={{ color: "#6b7280" }}>{item.payment_status || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 8px", verticalAlign: "top" }}>
                        <div className="sr-small">Modo: {item.authorization_mode || "—"}</div>
                        <div className="sr-small">Recibida: {item.authorization_received ? "Sí" : "No"}</div>
                        <div className="sr-small">PDF: {item.authorization_document_uploaded ? "Sí" : "No"}</div>
                      </td>
                      <td style={{ padding: "10px 8px", verticalAlign: "top" }}>
                        <div className="sr-small">{item.docs_total ?? "—"}</div>
                      </td>
                      <td style={{ padding: "10px 8px", verticalAlign: "top" }}>
                        <div className="sr-small">{fmt(item.updated_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
