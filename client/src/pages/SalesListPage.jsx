import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const paymentMethods = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "QR"];

const SalesListPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [customer, setCustomer] = useState("");
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [selectedSale, setSelectedSale] = useState(null);
  const [notes, setNotes] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    metodo: "EFECTIVO",
    monto: "",
    cuentaTransferencia: "",
    tipoTarjeta: "credito"
  });
  const [noteForm, setNoteForm] = useState({
    tipo: "CREDITO",
    metodo: "EFECTIVO",
    cuentaTransferencia: "",
    monto: "",
    motivo: ""
  });

  const loadSales = async (page = 1) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (status) params.append("status", status);
    if (customer) params.append("customer", customer);
    params.append("page", page);
    params.append("limit", pagination.limit);
    try {
      const data = await apiFetch(`/api/sales?${params.toString()}`);
      setSales(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0 });
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const loadNotes = async (saleId) => {
    try {
      const data = await apiFetch(`/api/credit-notes?saleId=${saleId}`);
      setNotes(data);
    } catch (error) {
      setNotes([]);
    }
  };

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    loadNotes(sale._id);
  };

  const submitPayment = async () => {
    if (!selectedSale) return;
    if (paymentForm.metodo === "TRANSFERENCIA" && !paymentForm.cuentaTransferencia) {
      setStatusMessage("La cuenta de transferencia es obligatoria.");
      return;
    }
    try {
      const payload = {
        pagos: [
          {
            metodo: paymentForm.metodo,
            monto: Number(paymentForm.monto || 0),
            cuentaTransferencia: paymentForm.cuentaTransferencia || undefined,
            tipoTarjeta: paymentForm.tipoTarjeta || undefined
          }
        ]
      };
      const updated = await apiFetch(`/api/sales/${selectedSale._id}/payments`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSelectedSale(updated);
      setPaymentForm({ ...paymentForm, monto: "", cuentaTransferencia: "" });
      setStatusMessage("Pago registrado.");
      loadSales(pagination.page);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const submitNote = async () => {
    if (!selectedSale) return;
    if (noteForm.metodo === "TRANSFERENCIA" && !noteForm.cuentaTransferencia) {
      setStatusMessage("La cuenta de transferencia es obligatoria.");
      return;
    }
    try {
      const payload = {
        saleId: selectedSale._id,
        tipo: noteForm.tipo,
        metodo: noteForm.metodo,
        cuentaTransferencia: noteForm.cuentaTransferencia || undefined,
        monto: Number(noteForm.monto || 0),
        motivo: noteForm.motivo
      };
      await apiFetch("/api/credit-notes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setNoteForm({
        tipo: noteForm.tipo,
        metodo: noteForm.metodo,
        cuentaTransferencia: "",
        monto: "",
        motivo: ""
      });
      setStatusMessage("Nota registrada.");
      loadNotes(selectedSale._id);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div className="container">
      <h2>Ventas</h2>
      <p className="helper">
        Seleccioná una venta para ver su detalle, imputar pagos o registrar notas de crédito/débito.
      </p>
      {statusMessage && <div className="alert">{statusMessage}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Desde
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
          </select>
        </label>
        <label>
          Cliente
          <input value={customer} onChange={(event) => setCustomer(event.target.value)} />
        </label>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={() => loadSales(1)}>Buscar</button>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr
              key={sale._id}
              className={selectedSale?._id === sale._id ? "selected" : ""}
              onClick={() => handleSelectSale(sale)}
              style={{ cursor: "pointer" }}
            >
              <td>{new Date(sale.fechaHora).toLocaleString()}</td>
              <td>{sale.customerNombreSnapshot || "Sin cliente"}</td>
              <td>{sale.total}</td>
              <td>{sale.saldoPendiente}</td>
              <td>{sale.estado}</td>
            </tr>
          ))}
          {sales.length === 0 && (
            <tr>
              <td colSpan="5" className="helper">Sin ventas para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="inline" style={{ marginTop: 12 }}>
        <button
          className="ghost"
          onClick={() => loadSales(Math.max(pagination.page - 1, 1))}
          disabled={pagination.page === 1}
        >
          Anterior
        </button>
        <span className="helper">
          Página {pagination.page} de {Math.max(Math.ceil(pagination.total / pagination.limit), 1)}
        </span>
        <button
          className="ghost"
          onClick={() => loadSales(pagination.page + 1)}
          disabled={pagination.page * pagination.limit >= pagination.total}
        >
          Siguiente
        </button>
      </div>

      {selectedSale && (
        <div className="grid" style={{ marginTop: 24 }}>
          <h3>Detalle</h3>
          <div className="grid grid-3">
            <div>Cliente: {selectedSale.customerNombreSnapshot || "Sin cliente"}</div>
            <div>Total: {selectedSale.total}</div>
            <div>Saldo pendiente: {selectedSale.saldoPendiente}</div>
            <div>Estado: {selectedSale.estado}</div>
            <div>Cadete: {selectedSale.cadeteMontoPendiente || 0}</div>
          </div>

          <div>
            <strong>Items</strong>
            <ul>
              {selectedSale.items.map((item, index) => (
                <li key={`${item.descripcionSnapshot}-${index}`}>
                  {item.descripcionSnapshot} · {item.cantidad} x {item.precioUnitario} = {item.subtotal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <strong>Pagos</strong>
            <ul>
              {selectedSale.pagos.map((pago, index) => (
                <li key={`${pago.metodo}-${index}`}>
                  {pago.metodo} - {pago.monto}
                  {pago.cuentaTransferencia ? ` (${pago.cuentaTransferencia})` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-3">
            <div className="stack">
              <label>
                Método
                <select
                  value={paymentForm.metodo}
                  onChange={(event) => setPaymentForm({ ...paymentForm, metodo: event.target.value })}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </label>
              {paymentForm.metodo === "TRANSFERENCIA" && (
                <label>
                  Cuenta
                  <input
                    value={paymentForm.cuentaTransferencia}
                    onChange={(event) =>
                      setPaymentForm({ ...paymentForm, cuentaTransferencia: event.target.value })
                    }
                  />
                </label>
              )}
              {paymentForm.metodo === "TARJETA" && (
                <label>
                  Tipo tarjeta
                  <select
                    value={paymentForm.tipoTarjeta}
                    onChange={(event) => setPaymentForm({ ...paymentForm, tipoTarjeta: event.target.value })}
                  >
                    <option value="credito">Crédito</option>
                    <option value="debito">Débito</option>
                  </select>
                </label>
              )}
            </div>
            <label>
              Monto pago
              <input
                type="number"
                value={paymentForm.monto}
                onChange={(event) => setPaymentForm({ ...paymentForm, monto: event.target.value })}
              />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="secondary" onClick={submitPayment}>Imputar pago</button>
            </div>
          </div>

          <h4 style={{ marginTop: 16 }}>Notas de crédito/débito</h4>
          <div className="grid grid-3">
            <label>
              Tipo nota
              <select
                value={noteForm.tipo}
                onChange={(event) => setNoteForm({ ...noteForm, tipo: event.target.value })}
              >
                <option value="CREDITO">Crédito</option>
                <option value="DEBITO">Débito</option>
              </select>
            </label>
            <label>
              Método
              <select
                value={noteForm.metodo}
                onChange={(event) => setNoteForm({ ...noteForm, metodo: event.target.value })}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            {noteForm.metodo === "TRANSFERENCIA" && (
              <label>
                Cuenta transferencia
                <input
                  value={noteForm.cuentaTransferencia}
                  onChange={(event) =>
                    setNoteForm({ ...noteForm, cuentaTransferencia: event.target.value })
                  }
                />
              </label>
            )}
            <label>
              Monto nota
              <input
                type="number"
                value={noteForm.monto}
                onChange={(event) => setNoteForm({ ...noteForm, monto: event.target.value })}
              />
            </label>
            <label>
              Motivo
              <input
                value={noteForm.motivo}
                onChange={(event) => setNoteForm({ ...noteForm, motivo: event.target.value })}
              />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="ghost" onClick={submitNote}>Registrar nota</button>
            </div>
          </div>

          {notes.length > 0 && (
            <div>
              <strong>Notas</strong>
              <ul>
                {notes.map((note) => (
                  <li key={note._id}>
                    {note.tipo} · {note.metodo} · {note.monto} · {note.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesListPage;
