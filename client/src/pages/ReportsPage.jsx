import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const ReportsPage = () => {
  const [date, setDate] = useState("");
  const [report, setReport] = useState(null);
  const [brandDate, setBrandDate] = useState("");
  const [brandStartDate, setBrandStartDate] = useState("");
  const [brandEndDate, setBrandEndDate] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [brandReport, setBrandReport] = useState(null);
  const [status, setStatus] = useState("");

  const loadReport = async () => {
    if (!date) return;
    try {
      const data = await apiFetch(`/api/reports/daily?date=${date}`);
      setReport(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const loadBrandReport = async () => {
    if (!brandDate && !brandStartDate) return;
    const params = new URLSearchParams();
    if (brandDate) {
      params.set("date", brandDate);
    } else {
      params.set("startDate", brandStartDate);
      if (brandEndDate) {
        params.set("endDate", brandEndDate);
      }
    }
    if (brandFilter.trim()) {
      params.set("brand", brandFilter.trim());
    }
    try {
      const data = await apiFetch(`/api/reports/by-brand?${params.toString()}`);
      setBrandReport(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="container">
      <h2>Reporte diario</h2>
      <div className="inline" style={{ marginTop: 16 }}>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button onClick={loadReport}>Buscar</button>
      </div>
      {status && <div className="alert">{status}</div>}
      {report && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="badge">Total: {report.totalVendido}</div>
          <div>Cobrado en caja: {report.totalCobrado}</div>
          <div>Saldo pendiente: {report.saldoPendiente}</div>
          <div>Envío por rendir (cadete): {report.totalEnvioCadete}</div>
          <div>Ventas: {report.cantidadVentas}</div>
          <div>
            <strong>Totales por método</strong>
            <ul>
              {Object.entries(report.totalesPorMetodo).map(([metodo, total]) => (
                <li key={metodo}>{metodo}: {total}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Ventas</strong>
            <ul>
              {report.ventas.map((venta) => (
                <li key={venta._id}>
                  {new Date(venta.fechaHora).toLocaleTimeString()} - {venta.customerNombreSnapshot || "Sin cliente"} - {venta.total}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="stack" style={{ marginTop: 24 }}>
        <h2>Reporte por marca</h2>
        <div className="grid grid-3">
          <label>
            Fecha
            <input type="date" value={brandDate} onChange={(event) => setBrandDate(event.target.value)} />
          </label>
          <label>
            Desde
            <input
              type="date"
              value={brandStartDate}
              onChange={(event) => setBrandStartDate(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={brandEndDate}
              onChange={(event) => setBrandEndDate(event.target.value)}
            />
          </label>
          <label>
            Marca
            <input
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
              placeholder="Ej: Ultratech"
            />
          </label>
        </div>
        <div className="inline">
          <button onClick={loadBrandReport}>Buscar</button>
        </div>
        {brandReport && (
          <div className="stack" style={{ marginTop: 12 }}>
            {brandReport.marca && (
              <div className="badge">Marca filtrada: {brandReport.marca}</div>
            )}
            <ul>
              {brandReport.marcas.map((marca) => (
                <li key={marca.marca}>
                  {marca.marca}: {marca.total} · Cantidad: {marca.cantidad}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
