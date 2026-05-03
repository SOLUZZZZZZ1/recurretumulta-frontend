import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API = "https://recurretumulta-backend.onrender.com";

function getCaseId(search) {
  const qs = new URLSearchParams(search);
  return qs.get("case") || "";
}

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error");
  return data;
}

export default function Autorizar() {
  const location = useLocation();
  const navigate = useNavigate();
  const caseId = useMemo(() => getCaseId(location.search), [location.search]);

  const [form, setForm] = useState({
    full_name: "",
    dni_nie: "",
    domicilio_notif: "",
    email: "",
  });

  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setMsg("");
    setLoading(true);

    try {
      // 1. Guardar datos
      await fetchJson(`${API}/cases/${caseId}/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      // 2. Subir PDF firmado
      if (file) {
        const fd = new FormData();
        fd.append("file", file);

        await fetchJson(`${API}/cases/${caseId}/upload-authorization-signed`, {
          method: "POST",
          body: fd
        });
      }

      setMsg("✅ Autorización completada correctamente");
      navigate(`/#/resumen?case=${caseId}`);

    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Autorización completa</h2>

      <input placeholder="Nombre completo"
        value={form.full_name}
        onChange={e => update("full_name", e.target.value)} />

      <input placeholder="DNI/NIE"
        value={form.dni_nie}
        onChange={e => update("dni_nie", e.target.value)} />

      <input placeholder="Domicilio"
        value={form.domicilio_notif}
        onChange={e => update("domicilio_notif", e.target.value)} />

      <input placeholder="Email"
        value={form.email}
        onChange={e => update("email", e.target.value)} />

      <input type="file" onChange={e => setFile(e.target.files[0])} />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Procesando..." : "Completar autorización"}
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
