import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const CustomersPage = () => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [statement, setStatement] = useState(null);
  const [overview, setOverview] = useState(null);
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [statementDetail, setStatementDetail] = useState(false);
  const [initialDebtAmount, setInitialDebtAmount] = useState("");
  const [initialDebtDescription, setInitialDebtDescription] = useState("Saldo inicial");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState("");

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
      setOverview(null);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const loadOverview = async (customer) => {
    if (!customer) return;
    try {
      const data = await apiFetch(`/api/customers/${customer._id}/overview`);
      setOverview(data);
      setSelectedCustomer(customer);
      setStatement(null);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setEditName(customer.nombre || "");
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditName("");
  };

  const updateCustomer = async () => {
    if (!editingCustomer) return;
    try {
      const updated = await apiFetch(`/api/customers/${editingCustomer._id}`, {
        method: "PATCH",
        body: JSON.stringify({ nombre: editName.trim() })
      });
      setCustomers((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      if (selectedCustomer?._id === updated._id) {
        setSelectedCustomer(updated);
      }
      setStatus("Cliente actualizado.");
      cancelEdit();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteCustomer = async (customer) => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await apiFetch(`/api/customers/${customer._id}`, { method: "DELETE" });
      setCustomers((prev) => prev.filter((item) => item._id !== customer._id));
      if (selectedCustomer?._id === customer._id) {
        setSelectedCustomer(null);
        setStatement(null);
        setOverview(null);
      }
      setStatus("Cliente eliminado.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const createInitialDebt = async () => {
    if (!selectedCustomer) return;
    const monto = Number(initialDebtAmount || 0);
    if (monto <= 0) {
      setStatus("Monto inválido para deuda inicial.");
      return;
    }
    try {
      await apiFetch(`/api/customers/${selectedCustomer._id}/initial-debt`, {
        method: "POST",
        body: JSON.stringify({
          monto,
          descripcion: initialDebtDescription.trim() || "Saldo inicial"
        })
      });
      setStatus("Deuda inicial registrada.");
      setInitialDebtAmount("");
      setInitialDebtDescription("Saldo inicial");
      loadStatement(selectedCustomer);
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
      {editingCustomer && (
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          <label>
            Editar nombre
            <input value={editName} onChange={(event) => setEditName(event.target.value)} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button className="secondary" onClick={updateCustomer}>Actualizar</button>
            <button className="ghost" onClick={cancelEdit}>Cancelar</button>
          </div>
        </div>
      )}
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
            <button
              className="ghost"
              style={{ marginLeft: 8 }}
              onClick={() => loadOverview(customer)}
            >
              Ver resumen
            </button>
            <button
              className="ghost"
              style={{ marginLeft: 8 }}
              onClick={() => startEdit(customer)}
            >
              Editar
            </button>
            <button
              className="ghost"
              style={{ marginLeft: 8 }}
              onClick={() => deleteCustomer(customer)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <div className="stack" style={{ marginTop: 24 }}>
        <h3>Estado de cuenta</h3>
        <div className="grid grid-3 no-print">
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
          <label className="inline">
            <input
              type="checkbox"
              checked={statementDetail}
              onChange={(event) => setStatementDetail(event.target.checked)}
            />
            Ver detalle por venta
          </label>
        </div>
        {overview && (
          <div className="stack" style={{ marginTop: 12 }}>
            <div className="badge">Cliente: {overview.customer.nombre}</div>
            <div>Total: {overview.total}</div>
            <div>Total cobrado: {overview.totalCobrado}</div>
            <div>Saldo pendiente: {overview.saldoPendiente}</div>
            <strong>Últimas compras</strong>
            <ul>
              {overview.ultimasVentas.map((sale) => (
                <li key={sale._id}>
                  {new Date(sale.fechaHora).toLocaleString()} - Total {sale.total} - Saldo {sale.saldoPendiente}
                </li>
              ))}
            </ul>
          </div>
        )}
        {statement && (
          <div className="print-only">
            <h3>Estado de cuenta</h3>
            <div>Cliente: {statement.customer.nombre}</div>
            <div>
              Período: {statementStartDate || "-"} al {statementEndDate || "-"}
            </div>
            <div>Detalle: {statementDetail ? "Por venta" : "Resumen"}</div>
          </div>
        )}
        {statement && (
          <div className="stack" style={{ marginTop: 12 }}>
            <div className="badge">Cliente: {statement.customer.nombre}</div>
            <div>Total: {statement.total}</div>
            <div>Total cobrado: {statement.totalCobrado}</div>
            <div>Saldo pendiente: {statement.saldoPendiente}</div>
            {statementDetail ? (
              <ul>
                {statement.sales.map((sale) => (
                  <li key={sale._id}>
                    {new Date(sale.fechaHora).toLocaleString()} - Total {sale.total} - Saldo {sale.saldoPendiente}
                    <ul>
                      {sale.items?.map((item, index) => (
                        <li key={`${sale._id}-${index}`}>
                          {item.descripcionSnapshot} · {item.cantidad} x {item.precioUnitario} = {item.subtotal}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {statement.sales.map((sale) => (
                  <li key={sale._id}>
                    {new Date(sale.fechaHora).toLocaleString()} - Total {sale.total} - Saldo {sale.saldoPendiente}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {selectedCustomer && (
          <div className="stack" style={{ marginTop: 16 }}>
            <h4>Deuda inicial</h4>
            <div className="grid grid-3">
              <label>
                Descripción
                <input
                  value={initialDebtDescription}
                  onChange={(event) => setInitialDebtDescription(event.target.value)}
                />
              </label>
              <label>
                Monto
                <input
                  type="number"
                  value={initialDebtAmount}
                  onChange={(event) => setInitialDebtAmount(event.target.value)}
                />
              </label>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="secondary" onClick={createInitialDebt}>
                  Registrar deuda
                </button>
              </div>
            </div>
            <div className="helper">
              Genera una venta pendiente para registrar pagos a cuenta y reflejar el saldo.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
