import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const CashClosurePage = () => {
  const [date, setDate] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");
  const [notas, setNotas] = useState("");
  const [closure, setClosure] = useState(null);
  const [status, setStatus] = useState("");

  const crearCierre = async () => {
    if (!date) return;
    try {
      const data = await apiFetch("/api/cash-closures", {
        method: "POST",
        body: JSON.stringify({
          fecha: date,
          efectivoContado: efectivoContado ? Number(efectivoContado) : undefined,
          notas
        })
      });
      setClosure(data);
      setStatus("Cierre guardado.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const buscarCierre = async () => {
    if (!date) return;
    try {
      const data = await apiFetch(`/api/cash-closures?date=${date}`);
      setClosure(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="container">
      <h2>Cierre de caja</h2>
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Fecha
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Efectivo contado (opcional)
          <input
            type="number"
            value={efectivoContado}
            onChange={(event) => setEfectivoContado(event.target.value)}
          />
        </label>
        <label>
          Notas
          <input value={notas} onChange={(event) => setNotas(event.target.value)} />
        </label>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={crearCierre}>Cerrar caja</button>
        <button className="ghost" onClick={buscarCierre}>Buscar cierre</button>
      </div>
      {status && <div className="alert">{status}</div>}
      {closure && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div>Total ventas: {closure.totalVentas}</div>
          <div>Cantidad ventas: {closure.cantidadVentas}</div>
          <div>
            <strong>Totales por método</strong>
            <ul>
              {Object.entries(closure.totalesPorMetodo || {}).map(([metodo, total]) => (
                <li key={metodo}>{metodo}: {total}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Totales por cuenta</strong>
            <ul>
              {Object.entries(closure.totalesPorCuenta || {}).map(([cuenta, total]) => (
                <li key={cuenta}>{cuenta}: {total}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashClosurePage;
