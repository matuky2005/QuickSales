import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const CashClosurePage = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [closureData, setClosureData] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [status, setStatus] = useState("");

  const crearCierre = async () => {
    if (!date) return;
    try {
      const data = await apiFetch("/api/cash-closures", {
        method: "POST",
        body: JSON.stringify({
          fecha: date
        })
      });
      setClosureData(data);
      setStatus("Cierre guardado.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const buscarCierre = async () => {
    if (!date) return;
    try {
      const data = await apiFetch(`/api/cash-closures?date=${date}&detail=${showDetalle}`);
      setClosureData(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    if (!date || !closureData) return;
    buscarCierre();
  }, [showDetalle]);

  const marcarCadeteRendido = async (ventaId) => {
    try {
      const updated = await apiFetch(`/api/sales/${ventaId}/cadete-rendido`, { method: "PATCH" });
      setClosureData((prev) => {
        if (!prev?.ventas) return prev;
        return {
          ...prev,
          ventas: prev.ventas.map((venta) => (venta._id === updated._id ? updated : venta))
        };
      });
    } catch (error) {
      setStatus(error.message);
    }
  };

  const closure = closureData?.closure || closureData;
  const ventas = closureData?.ventas || [];

  return (
    <div className="container">
      <h2>Cierre de caja</h2>
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Fecha
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      <div className="inline no-print" style={{ marginTop: 16 }}>
        <button onClick={crearCierre}>Cerrar caja</button>
        <button className="ghost" onClick={buscarCierre}>Buscar cierre</button>
        <button className="secondary" onClick={() => window.print()}>Imprimir cierre</button>
        <label className="inline" style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={showDetalle}
            onChange={(event) => setShowDetalle(event.target.checked)}
          />
          Ver detalle
        </label>
      </div>
      {status && <div className="alert">{status}</div>}
      {closure && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div>Total ventas: {closure.totalVentas}</div>
          <div>Cantidad ventas: {closure.cantidadVentas}</div>
          <div>
            <strong>Totales por método</strong>
            <table className="table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(closure.totalesPorMetodo || {}).map(([metodo, total]) => (
                  <tr key={metodo}>
                    <td>{metodo}</td>
                    <td>{total}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{closure.totalVentas}</strong></td>
                </tr>
              </tbody>
            </table>
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
      {showDetalle && ventas.length > 0 && (
        <div className="stack" style={{ marginTop: 16 }}>
          <strong>Detalle de ventas</strong>
          <table className="table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Saldo</th>
                <th>Cadete</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta._id}>
                  <td>{new Date(venta.fechaHora).toLocaleTimeString()}</td>
                  <td>{venta.customerNombreSnapshot || "Sin cliente"}</td>
                  <td>{venta.total}</td>
                  <td>{venta.saldoPendiente || 0}</td>
                  <td>
                    {venta.cadeteMontoPendiente || 0}
                    {venta.cadeteMontoPendiente > 0 && (
                      <button
                        className="ghost"
                        style={{ marginLeft: 8 }}
                        onClick={() => marcarCadeteRendido(venta._id)}
                      >
                        Marcar rendido
                      </button>
                    )}
                  </td>
                  <td>
                    <ul className="helper" style={{ margin: 0, paddingLeft: 16 }}>
                      {venta.items.map((item, index) => (
                        <li key={`${venta._id}-${index}`}>
                          {item.descripcionSnapshot}
                          {item.marca ? ` · ${item.marca}` : ""}
                          {item.atributos?.length ? ` · ${item.atributos.join(", ")}` : ""}
                          {" · "}
                          {item.cantidad} x {item.precioUnitario}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CashClosurePage;
