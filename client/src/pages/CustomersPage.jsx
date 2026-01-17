import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const CustomersPage = () => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);

  const buscar = async () => {
    if (!query.trim()) return;
    const data = await apiFetch(`/api/customers?query=${encodeURIComponent(query)}`);
    setCustomers(data);
  };

  return (
    <div className="container">
      <h2>Clientes</h2>
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
