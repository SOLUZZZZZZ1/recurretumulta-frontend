import { useEffect, useMemo, useState } from "react";

const emptyForm = () => ({
  reservation_time: "14:00",
  shift: "comida",
  table_name: "",
  party_size: 2,
  customer_name: "",
  phone: "",
  extras_dog: false,
  extras_celiac: false,
  extras_notes: "",
});

function getRestaurantId() {
  const hash = window.location.hash || "";
  const qs = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(qs);
  return params.get("r") || "rest_001";
}

export default function ReservasRestaurante() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [turno, setTurno] = useState("comida");
  const [showCanceladas, setShowCanceladas] = useState(false);

  const [restaurantId, setRestaurantId] = useState(getRestaurantId());

  const [pin, setPin] = useState(() => sessionStorage.getItem("reservas_pin") || "");
  const [pinInput, setPinInput] = useState("");

  const autorizado = Boolean(pin);

  useEffect(() => {
    const onHash = () => setRestaurantId(getRestaurantId());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  async function cargarReservas() {
    if (!pin) return;

    const r = await fetch(
      `/api/ops/restaurant-reservations?date=${fecha}&shift=${turno}&restaurant_id=${restaurantId}`,
      { headers: { "x-reservas-pin": pin } }
    );

    if (!r.ok) {
      setReservas([]);
      return;
    }

    const data = await r.json();
    setReservas(Array.isArray(data.items) ? data.items : []);
  }

  useEffect(() => {
    cargarReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, turno, pin, restaurantId]);

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

  // ✅ ESTA es la única lista que se usa en la tabla
  const visibles = useMemo(() => {
    return showCanceladas
      ? reservas
      : reservas.filter(r => r.status !== "cancelada");
  }, [reservas, showCanceladas]);

  const totalPax = useMemo(
    () => visibles.reduce((acc, r) => acc + (Number(r.party_size) || 0), 0),
    [visibles]
  );

  if (!autorizado) {
    return (
      <div style={{ padding: 40, maxWidth: 420, margin: "0 auto" }}>
        <h2>Acceso reservas</h2>
        <p style={{ marginTop: 8, opacity: 0.85 }}>
          Restaurante: <b>{restaurantId}</b>
        </p>
        <input
          type="password"
          placeholder="PIN"
          value={pinInput}
          onChange={e => setPinInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && confirmarPin()}
          style={{ width: "100%", padding: 10, fontSize: 16, marginTop: 8 }}
        />
        <button onClick={confirmarPin} style={{ marginTop: 10, width: "100%", padding: 12 }}>
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Reservas – {restaurantId}</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        <select value={turno} onChange={e => setTurno(e.target.value)}>
          <option value="desayuno">Desayuno</option>
          <option value="comida">Comida</option>
          <option value="cena">Cena</option>
        </select>
        <button onClick={() => setShowCanceladas(v => !v)}>
          {showCanceladas ? "Ocultar canceladas" : "Mostrar canceladas"}
        </button>
        <button onClick={bloquear}>🔒 Bloquear</button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>Pax totales:</strong> {totalPax}
      </div>

      <table width="100%" cellPadding="6">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Mesa</th>
            <th>Pax</th>
            <th>Nombre</th>
            <th>Tel</th>
            <th>Extras</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map(r => (
            <tr key={r.id}>
              <td>{(r.reservation_time || "").slice(0, 5)}</td>
              <td>{r.table_name}</td>
              <td>{r.party_size}</td>
              <td>{r.customer_name}</td>
              <td>{r.phone}</td>
              <td>
                {r.extras_dog && "🐶 "}
                {r.extras_celiac && "🌾 "}
                {r.extras_notes && "📝"}
              </td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
