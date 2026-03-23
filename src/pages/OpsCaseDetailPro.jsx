import React, { useMemo, useState } from "react";

const badgeStyles = {
  ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  review: "bg-amber-100 text-amber-800 border-amber-200",
  manual: "bg-rose-100 text-rose-800 border-rose-200",
  sent: "bg-sky-100 text-sky-800 border-sky-200",
};

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-white border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="text-sm opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Badge({ children, type = "review" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeStyles[type]}`}>
      {children}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value || "—"}</div>
    </div>
  );
}

const demoCase = {
  id: "EXP-2026-000184",
  status: "review",
  tipo: "Sanción tráfico",
  familia: "semaforo",
  confianza: 0.94,
  canal: "Web",
  cliente: "Caso demo",
  matricula: "1234-ABC",
  fechaHecho: "2026-03-23",
  organismo: "DGT",
  hecho: "No respetar luz roja en intersección",
  observacionesIA:
    "Clasificación robusta. Recurso generado. Conviene ver si la redacción del hecho viene de plantilla y si existe soporte gráfico o agente denunciante.",
  riesgo: "medio",
  envioDgtReady: false,
};

const documents = [
  { name: "denuncia.pdf", type: "PDF", size: "1.8 MB", ok: true },
  { name: "recurso_generado.docx", type: "DOCX", size: "280 KB", ok: true },
  { name: "anexos_cliente.pdf", type: "PDF", size: "620 KB", ok: true },
];

const events = [
  { ts: "18:03", text: "Expediente creado" },
  { ts: "18:04", text: "Clasificación IA: semáforo (0.94)" },
  { ts: "18:04", text: "Recurso generado" },
  { ts: "18:05", text: "Pendiente revisión operador" },
];

const manualRules = [
  "Mandar a revisión manual si familia = generic.",
  "Mandar a revisión manual si confidence < 0.90.",
  "Mandar a revisión manual si detecta señales extrañas como 'BASE MODIFICADA', 'DETALLE AGENTE', 'POINTS', OCR roto o mezcla de familias.",
  "Bloquear envío DGT hasta validación expresa del operador.",
];

export default function OpsCaseDetailPro() {
  const [tab, setTab] = useState("revision");
  const [approved, setApproved] = useState(false);
  const [manual, setManual] = useState(false);
  const [checklist, setChecklist] = useState({
    identidad: true,
    documentos: true,
    clasificacion: true,
    recurso: false,
    dgt: false,
  });

  const progress = useMemo(() => {
    const total = Object.keys(checklist).length;
    const done = Object.values(checklist).filter(Boolean).length;
    return Math.round((done / total) * 100);
  }, [checklist]);

  const tabs = [
    ["revision", "Revisión"],
    ["documentos", "Documentos"],
    ["trazabilidad", "Trazabilidad"],
    ["manual", "Cola manual"],
    ["envio", "Envío DGT"],
  ];

  const toggle = (key) => setChecklist((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-300">Modo operador PRO</div>
            <h1 className="mt-2 text-3xl font-semibold">Panel de validación y envío</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">
              Flujo pensado para operador humano: revisar, corregir, escalar a cola manual y solo después habilitar envío a DGT.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow">
              Guardar cambios
            </button>
            <button
              onClick={() => setManual(true)}
              className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white"
            >
              Mandar a revisión manual
            </button>
            <button
              onClick={() => setApproved(true)}
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Aprobar expediente
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Expediente" value={demoCase.id} />
          <StatCard label="Familia detectada" value={demoCase.familia} />
          <StatCard label="Confianza IA" value={`${Math.round(demoCase.confianza * 100)}%`} tone="emerald" />
          <StatCard label="Riesgo" value={demoCase.riesgo} tone="amber" />
          <StatCard label="Checklist" value={`${progress}%`} tone={progress === 100 ? "emerald" : "amber"} />
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium shadow-sm ${
                tab === id ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "revision" && (
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <Section
              title="Ficha del expediente"
              right={
                <Badge type={manual ? "manual" : approved ? "ready" : "review"}>
                  {manual ? "Manual" : approved ? "Aprobado" : "En revisión"}
                </Badge>
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Tipo" value={demoCase.tipo} />
                <Field label="Canal" value={demoCase.canal} />
                <Field label="Organismo" value={demoCase.organismo} />
                <Field label="Matrícula" value={demoCase.matricula} />
                <Field label="Fecha hecho" value={demoCase.fechaHecho} />
                <Field label="Cliente" value={demoCase.cliente} />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Hecho denunciado</div>
                <div className="mt-2 text-base font-semibold">{demoCase.hecho}</div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{demoCase.observacionesIA}</p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {Object.entries(checklist).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" checked={value} onChange={() => toggle(key)} className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Acciones rápidas">
              <div className="space-y-3">
                <button className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium">
                  Regenerar recurso
                </button>
                <button className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium">
                  Cambiar familia manualmente
                </button>
                <button className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium">
                  Añadir nota interna
                </button>
                <button className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium">
                  Solicitar documentación al cliente
                </button>
                <button className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700">
                  Marcar incidencia crítica
                </button>
              </div>
            </Section>
          </div>
        )}

        {tab === "documentos" && (
          <Section title="Documentos del expediente">
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-sm text-slate-500">
                      {doc.type} · {doc.size}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Ver</button>
                    <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Descargar</button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "trazabilidad" && (
          <Section title="Trazabilidad / Eventos">
            <div className="space-y-4">
              {events.map((e, i) => (
                <div key={i} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                  <div className="min-w-14 text-sm font-semibold text-slate-500">{e.ts}</div>
                  <div className="text-sm">{e.text}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "manual" && (
          <Section title="Cola manual y reglas de escalado">
            <div className="space-y-4">
              {manualRules.map((rule, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  {rule}
                </div>
              ))}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Recomendación: cualquier caso con OCR extraño, mezcla de familias o texto no normalizado debe quedar en revisión humana antes de permitir envío.
              </div>
            </div>
          </Section>
        )}

        {tab === "envio" && (
          <Section title="Envío a DGT">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold">Estado de preparación</div>
                  <div className="mt-2 text-sm text-slate-600">
                    {approved && checklist.dgt
                      ? "El expediente está listo para envío."
                      : "Aún no está habilitado. Falta aprobación del operador y checklist completo."}
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <input type="checkbox" checked={checklist.dgt} onChange={() => toggle("dgt")} className="h-4 w-4" />
                  <span className="text-sm font-medium">Validación final para envío DGT</span>
                </label>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold">Botón de envío</div>
                <button
                  disabled={!(approved && checklist.dgt)}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
                    approved && checklist.dgt
                      ? "bg-sky-600 text-white"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  Enviar a DGT
                </button>
                <p className="mt-3 text-xs text-slate-500">
                  En producción real, esta acción debería registrar auditoría, usuario operador, timestamp y resultado del envío.
                </p>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
