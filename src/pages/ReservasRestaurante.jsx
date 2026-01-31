
import { useEffect, useState } from "react";

export default function ReservasRestaurante() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10));
  const [turno, setTurno] = useState("comida");
  const [showCanceladas, setShowCanceladas] = useState(false);
  const [pin, setPin] = useState(() => sessionStorage.getItem("reservas_pin") || "");
  const [pinInput, setPinInput] = useState("");

  const autorizado = Boolean(pin);

  async function cargarReservas() {
    if (!pin) return;

    const r = await fetch(`/api/ops/restaurant-reservations?date=${fecha}&shift=${turno}`, {
      headers: { "x-reservas-pin": pin }
    });

    if (!r.ok) {
      setReservas([]);
      return;
    }

    const data = await r.json();
    setReservas(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    cargarReservas();
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
    await fetch(`/api/ops/restaurant-reservations/${id}/arrived`, { method: "POST", headers: { "x-reservas-pin": pin } });
    cargarReservas();
  }

  async function marcarNoShow(id) {
    await fetch(`/api/ops/restaurant-reservations/${id}/no-show`, { method: "POST", headers: { "x-reservas-pin": pin } });
    cargarReservas();
  }

  async function cancelarReserva(id) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await fetch(`/api/ops/restaurant-reservations/${id}/cancel`, { method: "POST", headers: { "x-reservas-pin": pin } });
    cargarReservas();
  }

  if (!autorizado) {
    return (
      <div style={{ padding: 40, maxWidth: 400, margin: "0 auto" }}>
        <h2>Acceso reservas</h2>
        <input
          type="password"
          placeholder="PIN"
          value={pinInput}
          onChange={e => setPinInput(e.target.value)}
          style={{ width: "100%", padding: 10, fontSize: 16 }}
        />
        <button onClick={confirmarPin} style={{ marginTop: 10, width: "100%", padding: 10 }}>
          Entrar
        </button>
      </div>
    );
  }

  const visibles = showCanceladas
    ? reservas
    : reservas.filter(r => r.status !== "cancelada");

  const totalPax = visibles.reduce((acc, r) => acc + (r.party_size || 0), 0);

  const contadores = {
    pendientes: reservas.filter(r => r.status === "pendiente").length,
    llegaron: reservas.filter(r => r.status === "llego").length,
    no_show: reservas.filter(r => r.status === "no_show").length,
    canceladas: reservas.filter(r => r.status === "cancelada").length,
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Reservas restaurante</h2>
        <button onClick={bloquear}>🔒 Bloquear</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        <select value={turno} onChange={e => setTurno(e.target.value)}>
          <option value="desayuno">Desayuno</option>
          <option value="comida">Comida</option>
          <option value="cena">Cena</option>
        </select>
        <button onClick={() => window.print()}>🖨️ Imprimir</button>
        <button onClick={() => setShowCanceladas(v => !v)}>
          {showCanceladas ? "Ocultar canceladas" : "Mostrar canceladas"}
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>Pax totales visibles:</strong> {totalPax} &nbsp; | &nbsp;
        Pendientes: {contadores.pendientes} ·
        Llegaron: {contadores.llegaron} ·
        No show: {contadores.no_show} ·
        Canceladas: {contadores.canceladas}
      </div>

      <table width="100%" cellPadding="6">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Mesa</th>
            <th>Pax</th>
            <th>Nombre</th>
            <th>Tel</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map(r => (
            <tr key={r.id} style={{ opacity: r.status === "cancelada" ? 0.4 : 1 }}>
              <td>{r.reservation_time}</td>
              <td>{r.table_name}</td>
              <td>{r.party_size}</td>
              <td>{r.customer_name}</td>
              <td>{r.phone}</td>
              <td>{r.status}</td>
              <td>
                <button onClick={() => marcarLlegada(r.id)}>✅</button>
                <button onClick={() => marcarNoShow(r.id)}>❌</button>
                <button onClick={() => cancelarReserva(r.id)}>🚫</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
