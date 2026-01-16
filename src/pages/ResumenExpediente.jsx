import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import PagarPresentar from "../components/PagarPresentar.jsx";
import AppendDocuments from "../components/AppendDocuments.jsx";

const API = "/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || data?.message || "Error API");
  return data;
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="sr-small" style={{ fontWeight: 800 }}>
        {label}
      </div>
      <div className="sr-p" style={{ margin: 0 }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function ResumenExpediente() {
  const q = useQuery();
  const caseId = q.get("case") || "";

  const [analysis, setAnalysis] = useState(null);
  const [publicStatus, setPublicStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rtm_last_analysis");
      if (raw) setAnalysis(JSON.parse(raw
