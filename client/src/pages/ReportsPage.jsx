import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const ReportsPage = () => {
  const [date, setDate] = useState("");
  const [report, setReport] = useState(null);
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
    </div>
  );
};

export default ReportsPage;
