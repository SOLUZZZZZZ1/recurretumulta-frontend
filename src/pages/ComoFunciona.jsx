import React from "react";

export default function ComoFunciona() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      
      <h1>Cómo funciona</h1>

      <ol style={{ marginTop: "20px", lineHeight: "2" }}>
        <li>
          <strong>Subes tu multa</strong><br />
          Analizamos automáticamente el expediente.
        </li>

        <li>
          <strong>Evaluamos el caso</strong><br />
          Te indicamos si es viable recurrirla.
        </li>

        <li>
          <strong>Eliges cómo continuar</strong><br />
          No presentar recurso o dejar que lo presentemos por ti.
        </li>
      </ol>

      <h2 style={{ marginTop: "40px" }}>Tú decides</h2>

      <p>
        Puedes dejarlo en nuestras manos.
        Nos encargamos de todo el proceso para que no tengas que preocuparte de nada.
      </p>

    </div>
  );
}