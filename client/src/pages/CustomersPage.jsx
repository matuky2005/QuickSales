import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const CustomersPage = () => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState("");

  const buscar = async () => {
    if (!query.trim()) return;
    try {
      const data = await apiFetch(`/api/customers?query=${encodeURIComponent(query)}`);
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
          <li key={customer._id}>{customer.nombre}</li>
        ))}
      </ul>
    </div>
  );
};

export default CustomersPage;
