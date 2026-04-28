import { useState } from "react";

export default function EliminarCoche() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    matricula: "",
    ciudad: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(
        "https://recurretumulta-backend.onrender.com/vehicle-removal/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.nombre,
            phone: form.telefono,
            plate: form.matricula,
            city: form.ciudad
          })
        }
      );

      const data = await res.json();
      window.location.href = data.checkout_url;
    } catch (err) {
      alert("Error al iniciar el proceso");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🚗 Eliminar coche sin problemas</h1>

      <p>
        Si tu coche solo te da problemas (embargos, impuestos, seguro…),
        nosotros lo gestionamos por ti.
      </p>

      <h3>💰 Precio: 39€</h3>

      <input name="nombre" placeholder="Nombre" onChange={handleChange} /><br /><br />
      <input name="telefono" placeholder="Teléfono" onChange={handleChange} /><br /><br />
      <input name="matricula" placeholder="Matrícula" onChange={handleChange} /><br /><br />
      <input name="ciudad" placeholder="Ciudad" onChange={handleChange} /><br /><br />

      <button onClick={handleSubmit}>
        Eliminar mi coche
      </button>

      <p style={{ marginTop: 20, fontSize: 12 }}>
        Este servicio no elimina deudas previas, solo gestiona la baja del vehículo.
      </p>
    </div>
  );
}