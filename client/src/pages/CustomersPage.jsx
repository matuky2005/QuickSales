import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const CustomersPage = () => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [statement, setStatement] = useState(null);
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");

  const buscar = async () => {
    try {
      const params = query.trim()
        ? `?query=${encodeURIComponent(query)}`
        : "";
      const data = await apiFetch(`/api/customers${params}`);
      setCustomers(data);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const crearCliente = async () => {
    if (!nombre.trim()) return;
    try {
      const customer = await apiFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify({ nombre: nombre.trim() })
      });
      setStatus("Cliente guardado.");
      setNombre("");
      setCustomers((prev) => [customer, ...prev]);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const loadStatement = async (customer) => {
    if (!customer) return;
    const params = new URLSearchParams();
    if (statementStartDate) {
      params.set("startDate", statementStartDate);
    }
    if (statementEndDate) {
      params.set("endDate", statementEndDate);
    }
    try {
      const data = await apiFetch(`/api/customers/${customer._id}/statement?${params.toString()}`);
      setStatement(data);
      setSelectedCustomer(customer);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    buscar();
  }, []);

  return (
    <div className="container">
      <h2>Clientes</h2>
      {status && <div className="alert">{status}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Nombre
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={crearCliente}>Guardar cliente</button>
        </div>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        <button onClick={buscar}>Buscar</button>
      </div>
      <ul style={{ marginTop: 16 }}>
        {customers.map((customer) => (
          <li key={customer._id}>
            {customer.nombre}
            <button
              className="ghost"
              style={{ marginLeft: 8 }}
              onClick={() => loadStatement(customer)}
            >
              Ver estado de cuenta
            </button>
          </li>
        ))}
      </ul>

      <div className="stack" style={{ marginTop: 24 }}>
        <h3>Estado de cuenta</h3>
        <div className="grid grid-3">
          <label>
            Desde
            <input
              type="date"
              value={statementStartDate}
              onChange={(event) => setStatementStartDate(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={statementEndDate}
              onChange={(event) => setStatementEndDate(event.target.value)}
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              className="ghost"
              onClick={() => loadStatement(selectedCustomer)}
              disabled={!selectedCustomer}
            >
              Buscar movimientos
            </button>
            <button
              className="secondary no-print"
              onClick={() => window.print()}
              disabled={!statement}
            >
              Imprimir
            </button>
          </div>
        </div>
        {statement && (
          <div className="stack" style={{ marginTop: 12 }}>
            <div className="badge">Cliente: {statement.customer.nombre}</div>
            <div>Total: {statement.total}</div>
            <div>Total cobrado: {statement.totalCobrado}</div>
            <div>Saldo pendiente: {statement.saldoPendiente}</div>
            <ul>
              {statement.sales.map((sale) => (
                <li key={sale._id}>
                  {new Date(sale.fechaHora).toLocaleString()} - Total {sale.total} - Saldo {sale.saldoPendiente}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
