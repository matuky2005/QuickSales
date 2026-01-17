import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const CashMovementsPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    tipo: "DEPOSITO",
    fecha: today,
    descripcion: "",
    observacion: "",
    monto: ""
  });
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    descripcion: ""
  });
  const [movements, setMovements] = useState([]);
  const [status, setStatus] = useState("");

  const loadMovements = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.descripcion) params.append("descripcion", filters.descripcion);
    try {
      const data = await apiFetch(`/api/cash-movements?${params.toString()}`);
      setMovements(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const submitMovement = async () => {
    if (!form.descripcion || !form.monto) {
      setStatus("Descripción y monto son obligatorios.");
      return;
    }
    try {
      await apiFetch("/api/cash-movements", {
        method: "POST",
        body: JSON.stringify({ ...form, monto: Number(form.monto) })
      });
      setStatus("Movimiento registrado.");
      setForm({ ...form, descripcion: "", observacion: "", monto: "" });
      loadMovements();
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  return (
    <div className="container">
      <h2>Movimientos de caja</h2>
      {status && <div className="alert">{status}</div>}

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Tipo
          <select
            value={form.tipo}
            onChange={(event) => setForm({ ...form, tipo: event.target.value })}
          >
            <option value="DEPOSITO">Depósito</option>
            <option value="PAGO">Pago</option>
            <option value="RETIRO">Retiro</option>
          </select>
        </label>
        <label>
          Fecha
          <input
            type="date"
            value={form.fecha}
            onChange={(event) => setForm({ ...form, fecha: event.target.value })}
          />
        </label>
        <label>
          Monto
          <input
            type="number"
            value={form.monto}
            onChange={(event) => setForm({ ...form, monto: event.target.value })}
          />
        </label>
        <label>
          Descripción
          <input
            value={form.descripcion}
            onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
          />
        </label>
        <label>
          Observación
          <input
            value={form.observacion}
            onChange={(event) => setForm({ ...form, observacion: event.target.value })}
          />
        </label>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={submitMovement}>Registrar</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Buscar movimientos</h3>
      <div className="grid grid-3">
        <label>
          Desde
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
          />
        </label>
        <label>
          Descripción
          <input
            value={filters.descripcion}
            onChange={(event) => setFilters({ ...filters, descripcion: event.target.value })}
          />
        </label>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <button className="ghost" onClick={loadMovements}>Buscar</button>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Observación</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement._id}>
              <td>{movement.fecha}</td>
              <td>{movement.tipo}</td>
              <td>{movement.descripcion}</td>
              <td>{movement.observacion || "-"}</td>
              <td>{movement.monto}</td>
            </tr>
          ))}
          {movements.length === 0 && (
            <tr>
              <td colSpan="5" className="helper">Sin movimientos.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CashMovementsPage;
