import React from "react";

export default function ChecklistAprobacion({
  pdfLeido = false,
  hechoRevisado = false,
  familiaRevisada = false,
  plazosRevisados = false,
  canalRevisado = false,
  onToggle,
}) {
  const items = [
    {
      key: "pdfLeido",
      label: "He leído el último PDF regenerado",
      help: "Nunca aprobar sin abrir el PDF final.",
    },
    {
      key: "hechoRevisado",
      label: "El hecho denunciado está correcto y limpio",
      help: "Debe reflejar la conducta real sin ruido OCR.",
    },
    {
      key: "familiaRevisada",
      label: "La familia jurídica es la correcta",
      help: "Semáforo, vehículo, móvil, etc.",
    },
    {
      key: "plazosRevisados",
      label: "He revisado los plazos del expediente",
      help: "Plazo inicial y, si aplica, plazo post-presentación.",
    },
    {
      key: "canalRevisado",
      label: "Sé por qué canal se va a presentar",
      help: "DGT, sede electrónica, registro electrónico, etc.",
    },
  ];

  const allOk = items.every((it) => ({
    pdfLeido,
    hechoRevisado,
    familiaRevisada,
    plazosRevisados,
    canalRevisado,
  })[it.key]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-xl font-semibold text-slate-900">Checklist antes de aprobar</h3>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {items.map((item) => {
            const checked = ({
              pdfLeido,
              hechoRevisado,
              familiaRevisada,
              plazosRevisados,
              canalRevisado,
            })[item.key];

            return (
              <label
                key={item.key}
                className={`block rounded-2xl border p-4 cursor-pointer ${
                  checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onToggle?.(item.key, e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div className="font-medium text-slate-900">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.help}</div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div
          className={`mt-4 rounded-2xl border p-4 text-sm ${
            allOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {allOk
            ? "Checklist completa. Ya puedes aprobar con más seguridad."
            : "Faltan comprobaciones. Mejor no aprobar todavía."}
        </div>
      </div>
    </div>
  );
}
