// ReservasRestaurante.jsx corregido: añade Cancelar y no toca DB
import { useEffect, useState } from "react";

export default function ReservasRestaurante() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10));
  const [turno, setTurno] = useState("comida");

  async function cargarReservas() {
    const r = await fetch(`/api/ops/restaurant-reservations?date=${fecha}&shift=${turno}`);
    const data = await r.json();
    setReservas(data || []);
  }

  useEffect(() => {
    cargarReservas();
  }, [fecha, turno]);

  async function marcarLlegada(id) {
    await fetch(`/api/ops/restaurant-reservations/${id}/arrived`, { method: "POST" });
    cargarReservas();
  }

  async function marcarNoShow(id) {
    await fetch(`/api/ops/restaurant-reservations/${id}/no-show`, { method: "POST" });
    cargarReservas();
  }

  async function cancelarReserva(id) {
    if (!window.confirm("¿Cancelar esta reserva?")) return;
    await fetch(`/api/ops/restaurant-reservations/${id}/cancel`, { method: "POST" });
    cargarReservas();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Reservas restaurante</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        <select value={turno} onChange={e => setTurno(e.target.value)}>
          <option value="desayuno">Desayuno</option>
          <option value="comida">Comida</option>
          <option value="cena">Cena</option>
        </select>
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
          {reservas.map(r => (
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
