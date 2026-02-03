import { useEffect, useMemo, useState } from "react";

const emptyForm = (turno = "comida") => ({
  reservation_time: turno === "desayuno" ? "09:00" : turno === "cena" ? "21:00" : "14:00",
  table_name: "",
  party_size: 2,
  customer_name: "",
  phone: "",
  extras_dog: false,
  extras_celiac: false,
  extras_notes: "",
});

function getRestaurantIdFromHash() {
  const hash = window.location.hash || "";
  const qs = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(qs);
  return params.get("r") || "rest_001";
}

function isAdminMode() {
  return (window.location.hash || "").includes("#admin");
}

function normalizeItems(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.items)) return json.items;
  return [];
}

export default function ReservasRestaurante() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [turno, setTurno] = useState("comida");
  const [showCanceladas, setShowCanceladas] = useState(false);

  const [restaurantId, setRestaurantId] = useState(getRestaurantIdFromHash());

  const [pin, setPin] = useState(() => sessionStorage.getItem("reservas_pin") || "");
  const [pinInput, setPinInput] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm("comida"));

  const [showPinPanel, setShowPinPanel] = useState(false);
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinNew2, setPinNew2] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  // MINI ADMIN
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem("admin_token") || "");
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [newRestName, setNewRestName] = useState("");
  const [newRestPin, setNewRestPin] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  const autorizado = Boolean(pin);

  useEffect(() => {
    const onHash = () => setRestaurantId(getRestaurantIdFromHash());
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

    const json = await r.json();
    setReservas(normalizeItems(json));
  }

  useEffect(() => {
    cargarReservas();
  }, [fecha, turno, restaurantId, pin]);

  function confirmarPin() {
    if (!pinInput.trim()) return;
    sessionStorage.setItem("reservas_pin", pinInput.trim());
    setPin(pinInput.trim());
    setPinInput("");
  }

  function bloquear() {
    sessionStorage.removeItem("reservas_pin");
    setPin("");
    setReservas([]);
  }

  async function guardarReserva() {
    const payload = {
      reservation_time: form.reservation_time,
      table_name: form.table_name,
      party_size: Number(form.party_size),
      customer_name: form.customer_name,
      phone: form.phone || "",
      extras_dog: !!form.extras_dog,
      extras_celiac: !!form.extras_celiac,
      extras_notes: form.extras_notes || "",
    };

    const r = await fetch(
      `/api/ops/restaurant-reservations/${editId}?restaurant_id=${restaurantId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-reservas-pin": pin },
        body: JSON.stringify(payload),
      }
    );

    if (!r.ok) return alert("Error al guardar");

    setModalOpen(false);
    cargarReservas();
  }

  async function cambiarPin() {
    const r = await fetch("/api/ops/restaurants/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        current_pin: pinCurrent,
        new_pin: pinNew,
      }),
    });

    if (!r.ok) return setPinMsg("Error al cambiar PIN");

    sessionStorage.setItem("reservas_pin", pinNew);
    setPin(pinNew);
    setPinMsg("PIN cambiado ✅");
  }

  async function crearRestaurante() {
    if (!adminToken) return setAdminMsg("Falta ADMIN_TOKEN");

    const r = await fetch("/api/ops/admin/restaurants/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({
        display_name: newRestName,
        pin: newRestPin,
      }),
    });

    const t = await r.text();
    if (!r.ok) return setAdminMsg("Error: " + t);

    const j = JSON.parse(t);
    setAdminMsg(`Creado: ${j.id} → ${j.url}`);
    setNewRestName("");
    setNewRestPin("");
  }

  if (!autorizado) {
    return (
      <div style={{ padding: 40, maxWidth: 420, margin: "0 auto" }}>
        <h2>Acceso reservas</h2>
        <input
          type="password"
          placeholder="PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmarPin()}
        />
        <button onClick={confirmarPin}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Reservas · {restaurantId}</h2>

      {isAdminMode() && (
        <div style={{ marginTop: 20, padding: 12, background: "#eee", borderRadius: 8 }}>
          <h3>🛠 Mini admin</h3>
          {!adminToken && (
            <>
              <input
                placeholder="ADMIN_TOKEN"
                type="password"
                value={adminTokenInput}
                onChange={(e) => setAdminTokenInput(e.target.value)}
              />
              <button
                onClick={() => {
                  sessionStorage.setItem("admin_token", adminTokenInput);
                  setAdminToken(adminTokenInput);
                }}
              >
                Guardar token
              </button>
            </>
          )}

          <input
            placeholder="Nombre restaurante"
            value={newRestName}
            onChange={(e) => setNewRestName(e.target.value)}
          />
          <input
            placeholder="PIN inicial"
            type="password"
            value={newRestPin}
            onChange={(e) => setNewRestPin(e.target.value)}
          />
          <button onClick={crearRestaurante}>Crear restaurante</button>
          {adminMsg && <div>{adminMsg}</div>}
        </div>
      )}

      <button onClick={bloquear}>Bloquear</button>
    </div>
  );
}
