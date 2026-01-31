
import { useEffect, useState } from "react";

export default function ReservasRestaurante() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [turno, setTurno] = useState("comida");
  const [showCanceladas, setShowCanceladas] = useState(false);

  const [pin, setPin] = useState(() => sessionStorage.getItem("reservas_pin") || "");
  const [pinInput, setPinInput] = useState("");

  const autorizado = Boolean(pin);

  function normalizeRows(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.rows)) return data.rows;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  async function cargarReservas() {
    if (!pin) return;

    const r = await fetch(`/api/ops/restaurant-reservations?date=${fecha}&shift=${turno}`, {
      headers: { "x-reservas-pin": pin },
    });

    if (!r.ok) {
      setReservas([]);
      return;
    }

    const data = await r.json();
    setReservas(normalizeRows(data));
  }

  useEffect(() => {
    cargarReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, turno, pin]);

  function confirmarPin() {
    if (!pinInput) return;
    sessionStorage.setItem("reservas_pin", pinInput);
    setPin(pinInput);
    setPinInput("");
  }

  function bloquear() {
    sessionStorage.removeItem("reservas_pin");
    setPin("");
    setReservas([]);
  }

  async function marcarLlegada(id) {
    await fetch(`/api/ops/restaurant-reservations/${id}/arrived`, {
      method: "POST",
      headers: { "x-reservas-pin": pin },
    });
    cargarReservas();
  }

  async function marcarNoShow(id) {
    await fetch(`/api/ops/restaurant-reservations/${id}/no-show`, {
      method: "POST",
      headers: { "x-reservas-pin": pin },
    });
    cargarReservas();
  }

  async function cancelarReserva(id) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await fetch(`/api/ops/restaurant-reservations/${id}/cancel`, {
      method: "POST",
      headers: { "x-reservas-pin": pin },
    });
    cargarReservas();
  }

  if (!autorizado) {
    return (
      <div style={{ padding: 40, maxWidth: 420, margin: "0 auto" }}>
        <h2>Acceso reservas</h2>
        <p style={{ marginTop: 8, opacity: 0.85 }}>
          Introduce el PIN para acceder. Se guarda solo durante esta sesión.
        </p>
        <input
          type="password"
          placeholder="PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmarPin();
          }}
          style={{ width: "100%", padding: 10, fontSize: 16, marginTop: 8 }}
        />
        <button onClick={confirmarPin} style={{ marginTop: 10, width: "100%", padding: 10 }}>
          Entrar
        </button>
      </div>
    );
  }

  const visibles = showCanceladas ? reservas : reservas.filter((r) => r.status !== "cancelada");

  const totalPax = visibles.reduce((acc, r) => acc + (Number(r.party_size) || 0), 0);

  const contadores = {
    pendientes: reservas.filter((r) => r.status === "pendiente").length,
    llegaron: reservas.filter((r) => r.status === "llego").length,
    no_show: reservas.filter((r) => r.status === "no_show").length,
    canceladas: reservas.filter((r) => r.status === "cancelada").length,
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Reservas restaurante</h2>
        <button onClick={bloquear} title="Bloquear">
          🔒 Bloquear
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0" }}>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <select value={turno} onChange={(e) => setTurno(e.target.value)}>
          <option value="desayuno">Desayuno</option>
          <option value="comida">Comida</option>
          <option value="cena">Cena</option>
        </select>
        <button onClick={() => window.print()}>🖨️ Imprimir</button>
        <button onClick={() => setShowCanceladas((v) => !v)}>
          {showCanceladas ? "Ocultar canceladas" : "Mostrar canceladas"}
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>Pax totales visibles:</strong> {totalPax} &nbsp; | &nbsp; Pendientes: {contadores.pendientes} · Llegaron:{" "}
        {contadores.llegaron} · No show: {contadores.no_show} · Canceladas: {contadores.canceladas}
      </div>

      <table width="100%" cellPadding="6" style={{ background: "rgba(255,255,255,0.75)", borderRadius: 10 }}>
        <thead>
          <tr>
            <th align="left">Hora</th>
            <th align="left">Mesa</th>
            <th align="left">Pax</th>
            <th align="left">Nombre</th>
            <th align="left">Tel</th>
            <th align="left">Estado</th>
            <th align="left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((r) => (
            <tr key={r.id} style={{ opacity: r.status === "cancelada" ? 0.45 : 1 }}>
              <td>{r.reservation_time}</td>
              <td>{r.table_name}</td>
              <td>{r.party_size}</td>
              <td>{r.customer_name}</td>
              <td>{r.phone}</td>
              <td>{r.status}</td>
              <td style={{ display: "flex", gap: 6 }}>
                <button onClick={() => marcarLlegada(r.id)} title="Llegó">
                  ✅
                </button>
                <button onClick={() => marcarNoShow(r.id)} title="No show">
                  ❌
                </button>
                <button onClick={() => cancelarReserva(r.id)} title="Cancelar">
                  🚫
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
