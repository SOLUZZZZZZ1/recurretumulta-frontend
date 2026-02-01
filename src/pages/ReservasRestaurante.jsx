import React, { useEffect, useMemo, useRef, useState } from "react";
import { getApiBase } from "../lib/api.js";

const STORAGE_KEY = "rtm_reservas_rest_pin_v1";

function formatDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(String(v || "").trim(), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function fmtTimeHHMM(t) {
  // t puede venir como "14:00:00" o "14:00"
  const s = String(t || "");
  return s.slice(0, 5);
}

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pendiente") return "Pendiente";
  if (s === "confirmada") return "Confirmada";
  if (s === "llego") return "Llegó";
  if (s === "no_show") return "No show";
  if (s === "cancelada") return "Cancelada";
  return status || "—";
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "llego") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "no_show") return "bg-rose-100 text-rose-800 border-rose-200";
  if (s === "confirmada") return "bg-sky-100 text-sky-800 border-sky-200";
  if (s === "cancelada") return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-amber-100 text-amber-800 border-amber-200"; // pendiente
}

function ExtrasIcons({ dog, celiac, notes }) {
  const hasNotes = Boolean((notes || "").trim());
  const visibles = useMemo(() => {
  const base = Array.isArray(filtered) ? filtered : [];
  return showCancelled ? base : base.filter((r) => String(r.status || "").toLowerCase() !== "cancelada");
}, [filtered, showCancelled]);

return (
    <div className="flex items-center gap-1 text-sm">
      {dog ? <span title="Perro">🐶</span> : <span className="text-zinc-300">·</span>}
      {celiac ? <span title="Celíaco">🌾</span> : <span className="text-zinc-300">·</span>}
      {hasNotes ? <span title={notes}>+</span> : <span className="text-zinc-300">·</span>}
    </div>
  );
}

function PinGate({ onOk }) {
  const [pin, setPin] = useState(sessionStorage.getItem(STORAGE_KEY) || "");
  const [err, setErr] = useState("");

  const handle = (e) => {
    e.preventDefault();
    const v = String(pin || "").trim();
    if (v.length < 3) {
      setErr("PIN inválido.");
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, v);
    onOk(v);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white/85 backdrop-blur rounded-2xl shadow p-6 border border-zinc-200">
      <h1 className="text-xl font-semibold mb-2">Libro de reservas (restaurante)</h1>
      <p className="text-sm text-zinc-700 mb-4">
        Acceso interno. Introduce el PIN para ver y gestionar reservas.
      </p>
      <form onSubmit={handle} className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white"
          placeholder="PIN"
          value={pin}
          onChange={(e) => {
            setErr("");
            setPin(e.target.value);
          }}
        />
        {err ? <div className="text-sm text-rose-700">{err}</div> : null}
        <button className="w-full rounded-xl bg-zinc-900 text-white py-3 font-medium hover:bg-black">
          Entrar
        </button>
      </form>

      <div className="mt-4 text-xs text-zinc-500">
        Tip: el PIN se guarda en esta sesión (sessionStorage).
      </div>
    </div>
  );
}

function AddModal({ open, onClose, onCreate, defaults }) {
  const [form, setForm] = useState(() => ({
    reservation_date: defaults.reservation_date,
    shift: defaults.shift,
    reservation_time: defaults.reservation_time || "14:00",
    table_name: "",
    party_size: 2,
    customer_name: "",
    phone: "",
    extras_dog: false,
    extras_celiac: false,
    extras_notes: "",
    created_by: defaults.created_by || "SALA",
  }));

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      reservation_date: defaults.reservation_date,
      shift: defaults.shift,
      created_by: defaults.created_by || "SALA",
    }));
  }, [open, defaults.reservation_date, defaults.shift, defaults.created_by]);

  if (!open) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      party_size: clampInt(form.party_size, 1, 50, 2),
      customer_name: String(form.customer_name || "").trim(),
      phone: String(form.phone || "").trim(),
      table_name: String(form.table_name || "").trim(),
      extras_notes: String(form.extras_notes || "").trim(),
      created_by: String(form.created_by || "").trim() || "SALA",
    };
    if (!payload.customer_name) return;
    onCreate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-zinc-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Añadir reserva</div>
            <div className="text-xs text-zinc-500">Rápido para servicio.</div>
          </div>
          <button onClick={onClose} className="rounded-xl px-3 py-2 border border-zinc-200 hover:bg-zinc-50">
            Cerrar
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="mb-1 text-zinc-700">Día</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              type="date"
              value={form.reservation_date}
              onChange={(e) => set("reservation_date", e.target.value)}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700">Turno</div>
            <select
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              value={form.shift}
              onChange={(e) => set("shift", e.target.value)}
            >
              <option value="desayuno">Desayuno</option>
              <option value="comida">Comida</option>
              <option value="cena">Cena</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700">Hora</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              type="time"
              value={form.reservation_time}
              onChange={(e) => set("reservation_time", e.target.value)}
              required
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700">Mesa</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              placeholder="6 / T3 / Barra 2"
              value={form.table_name}
              onChange={(e) => set("table_name", e.target.value)}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700">Personas (pax)</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              type="number"
              min="1"
              max="50"
              value={form.party_size}
              onChange={(e) => set("party_size", e.target.value)}
              required
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700">Teléfono</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              placeholder="6XX XXX XXX"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </label>

          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-zinc-700">Nombre</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              placeholder="Nombre de la reserva"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              required
            />
          </label>

          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-zinc-700">Extras / notas</div>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              placeholder="trona, cumpleaños, terraza, etc."
              value={form.extras_notes}
              onChange={(e) => set("extras_notes", e.target.value)}
            />
          </label>

          <div className="flex items-center gap-4 text-sm md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.extras_dog}
                onChange={(e) => set("extras_dog", e.target.checked)}
              />
              Perro 🐶
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.extras_celiac}
                onChange={(e) => set("extras_celiac", e.target.checked)}
              />
              Celíaco 🌾
            </label>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-zinc-600 text-xs">Apuntado por</span>
              <input
                className="rounded-xl border border-zinc-300 px-2 py-1 text-sm w-28"
                value={form.created_by}
                onChange={(e) => set("created_by", e.target.value)}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <button className="rounded-xl bg-zinc-900 text-white px-4 py-2 font-medium hover:bg-black">
              Guardar
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2 hover:bg-zinc-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReservasRestaurante() {
  const [pin, setPin] = useState(sessionStorage.getItem(STORAGE_KEY) || "");
  const [date, setDate] = useState(() => formatDateISO(new Date()));
  const [shift, setShift] = useState("comida");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const timerRef = useRef(null);

  const apiBase = getApiBase();

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        String(r.customer_name || "").toLowerCase().includes(q) ||
        String(r.phone || "").toLowerCase().includes(q) ||
        String(r.table_name || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const counts = useMemo(() => {
    const c = { pendiente: 0, confirmada: 0, llego: 0, no_show: 0, cancelada: 0 };
    for (const r of rows) {
      const s = String(r.status || "").toLowerCase();
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [rows]);

  const headers = useMemo(() => {
    return {
      "x-reservas-pin": pin,
    };
  }, [pin]);

  async function fetchList({ silent } = { silent: false }) {
    if (!pin) return;
    setErr("");
    if (!silent) setLoading(true);
    try {
      const url = `${apiBase}/ops/restaurant-reservations?date=${encodeURIComponent(date)}&shift=${encodeURIComponent(shift)}`;
      const res = await fetch(url, { headers });
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        setPin("");
        setRows([]);
        setErr("PIN incorrecto.");
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Error ${res.status}`);
      }
      const data = await res.json();
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function action(id, kind) {
    setErr("");
    try {
      const url = `${apiBase}/ops/restaurant-reservations/${id}/${kind}`;
      const res = await fetch(url, { method: "POST", headers });
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        setPin("");
        setRows([]);
        setErr("PIN incorrecto.");
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Error ${res.status}`);
      }
      await fetchList({ silent: true });
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  async function create(payload) {
    setErr("");
    try {
      const url = `${apiBase}/ops/restaurant-reservations`;
      const res = await fetch(url, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        setPin("");
        setRows([]);
        setErr("PIN incorrecto.");
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Error ${res.status}`);
      }
      setShowAdd(false);
      await fetchList({ silent: true });
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => {
    if (!pin) return;
    fetchList();
    // refresco automático
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchList({ silent: true }), 15000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, date, shift]);

  if (!pin) {
    return <PinGate onOk={(v) => setPin(v)} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white/85 backdrop-blur rounded-2xl shadow border border-zinc-200 p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
          <div>
            <div className="text-xl font-semibold">Libro de reservas</div>
            <div className="text-xs text-zinc-600">Modo servicio · ver todo de un vistazo</div>
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <input
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <div className="flex rounded-xl border border-zinc-200 overflow-hidden bg-white">
              {["desayuno", "comida", "cena"].map((s) => (
                <button
                  key={s}
                  onClick={() => setShift(s)}
                  className={`px-3 py-2 text-sm ${
                    shift === s ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
                  }`}
                >
                  {s === "desayuno" ? "Desayuno" : s === "comida" ? "Comida" : "Cena"}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchList()}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
              disabled={loading}
              title="Actualizar"
            >
              {loading ? "..." : "Actualizar"}
            </button>

            <button
              onClick={() => setShowAdd(true)}
              className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-black"
            >
              + Añadir
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full border ${statusPillClass("pendiente")}`}>Pendientes: {counts.pendiente}</span>
            <span className={`px-2 py-1 rounded-full border ${statusPillClass("confirmada")}`}>Confirmadas: {counts.confirmada}</span>
            <span className={`px-2 py-1 rounded-full border ${statusPillClass("llego")}`}>Llegaron: {counts.llego}</span>
            <span className={`px-2 py-1 rounded-full border ${statusPillClass("no_show")}`}>No show: {counts.no_show}</span>
            <span className={`px-2 py-1 rounded-full border ${statusPillClass("cancelada")}`}>Canceladas: {counts.cancelada}</span>
          </div>

          <div className="md:ml-auto">
            <input
              className="w-full md:w-64 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Buscar (nombre / teléfono / mesa)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {err ? <div className="mt-3 text-sm text-rose-700">{err}</div> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
  <span className="text-xs text-zinc-500 mr-1">Resumen:</span>
  <span className="text-xs px-2 py-1 rounded-full border bg-white">Pendientes: <b>{counts.pendiente}</b></span>
  <span className="text-xs px-2 py-1 rounded-full border bg-white">Llegaron: <b>{counts.llego}</b></span>
  <span className="text-xs px-2 py-1 rounded-full border bg-white">No show: <b>{counts.no_show}</b></span>
  <span className="text-xs px-2 py-1 rounded-full border bg-white">Canceladas: <b>{counts.cancelada}</b></span>
  <button
    onClick={() => setShowCancelled((v) => !v)}
    className="text-xs px-2 py-1 rounded-full border bg-white hover:bg-zinc-50"
    title="Mostrar/ocultar canceladas"
  >
    {showCancelled ? "Ocultar canceladas" : "Mostrar canceladas"}
  </button>
</div>

<style>{`
  @media print {
    .print\:hidden { display: none !important; }
    body { background: white !important; }
    table { font-size: 11px; }
    th, td { padding: 6px !important; }
  }
`}</style>

<div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-separate" style={{ borderSpacing: "0 8px" }}>
            <thead className="text-xs text-zinc-600">
              <tr>
                <th className="text-left px-2">Hora</th>
                <th className="text-left px-2">Mesa</th>
                <th className="text-left px-2">Pax</th>
                <th className="text-left px-2">Nombre</th>
                <th className="text-left px-2">Teléfono</th>
                <th className="text-left px-2">Extras</th>
                <th className="text-left px-2">Estado</th>
                <th className="text-left px-2">✅</th>
                <th className="text-left px-2">❌</th>
                <th className="text-left px-2">🚫</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => (
                <tr key={r.id} className="bg-white rounded-xl shadow-sm border border-zinc-200">
                  <td className="px-2 py-3 font-medium">{fmtTimeHHMM(r.reservation_time)}</td>
                  <td className="px-2 py-3">{r.table_name || "—"}</td>
                  <td className="px-2 py-3">{r.party_size}</td>
                  <td className="px-2 py-3">{r.customer_name}</td>
                  <td className="px-2 py-3">{r.phone || "—"}</td>
                  <td className="px-2 py-3">
                    <ExtrasIcons dog={r.extras_dog} celiac={r.extras_celiac} notes={r.extras_notes} />
                  </td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs ${statusPillClass(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => action(r.id, "arrived")}
                      className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50"
                      title="Marcar: llegó"
                    >
                      ✅
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => action(r.id, "no-show")}
                      className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50"
                      title="Marcar: no show"
                    >
                      ❌
                    </button>
                  </td>
<td className="px-2 py-3">
  <button
    onClick={() => {
      if (!window.confirm("¿Cancelar esta reserva?")) return;
      action(r.id, "cancel");
    }}
    className="rounded-lg border border-zinc-200 px-2 py-1 hover:bg-zinc-50"
    title="Marcar: cancelada"
  >
    🚫
  </button>
</td>
                </tr>
              ))}

              {visibles.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center text-zinc-500 py-6">
                    No hay reservas para este día/turno.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-zinc-500 flex items-center justify-between">
          <span>Refresco automático cada 15s.</span>
          <button
            className="underline"
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              setPin("");
            }}
          >
            Salir
          </button>
        </div>
      </div>

      <AddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={create}
        defaults={{ reservation_date: date, shift, created_by: "SALA" }}
      />
    </div>
  );
}
