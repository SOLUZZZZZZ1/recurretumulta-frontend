import React from "react";
import { useParams, Link } from "react-router-dom";

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  return (
    <div className="min-h-screen p-6 bg-white text-black">
      <h1 className="text-2xl font-bold">Modo operador PRO</h1>
      <p className="mt-4">Expediente: {caseId}</p>

      <div className="mt-6">
        <Link
          to={`/ops/case/${caseId}`}
          className="inline-block px-4 py-2 rounded bg-black text-white"
        >
          Volver al detalle normal
        </Link>
      </div>
    </div>
  );
}