import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api.js";

const emptyItem = { descripcion: "", cantidad: 1 };

const RemitosPage = () => {
  const [tipo, setTipo] = useState("SALIDA");
  const [cliente, setCliente] = useState("");
  const [items, setItems] = useState([emptyItem]);
  const [status, setStatus] = useState("");
  const [ticketSettings, setTicketSettings] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);

  const loadTicketSettings = async () => {
    try {
      const data = await apiFetch("/api/settings/ticket");
      setTicketSettings(data || null);
    } catch (error) {
      setTicketSettings(null);
    }
  };

  useEffect(() => {
    loadTicketSettings();
    const stored = localStorage.getItem("qs-remitos");
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch {
        setDrafts([]);
      }
    }
  }, []);

  const saveDrafts = (next) => {
    setDrafts(next);
    localStorage.setItem("qs-remitos", JSON.stringify(next));
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, emptyItem]);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, [field]: field === "cantidad" ? Number(value) : value }
          : item
      )
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0),
    [items]
  );

  const saveDraft = () => {
    if (!cliente.trim()) {
      setStatus("Ingresá un cliente.");
      return;
    }
    const filteredItems = items.filter((item) => item.descripcion.trim());
    if (!filteredItems.length) {
      setStatus("Agregá al menos un ítem.");
      return;
    }
    const draft = {
      id: Date.now().toString(),
      tipo,
      cliente: cliente.trim(),
      items: filteredItems,
      createdAt: new Date().toISOString()
    };
    saveDrafts([draft, ...drafts]);
    setCliente("");
    setItems([emptyItem]);
    setStatus("Remito guardado como borrador.");
  };

  const printDraft = (draft) => {
    setStatus("");
    setSelectedDraft(draft);
    setTimeout(() => window.print(), 100);
  };

  const removeDraft = (id) => {
    saveDrafts(drafts.filter((draft) => draft.id !== id));
  };

  return (
    <div className="container">
      <h2>Remitos</h2>
      {status && <div className="alert">{status}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Tipo
          <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="SALIDA">Remitir salida</option>
            <option value="ENTRADA">Remitir entrada</option>
          </select>
        </label>
        <label>
          Cliente
          <input value={cliente} onChange={(event) => setCliente(event.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Items</strong>
        <table className="table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`item-${index}`}>
                <td>
                  <input
                    value={item.descripcion}
                    onChange={(event) => updateItem(index, "descripcion", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(event) => updateItem(index, "cantidad", event.target.value)}
                  />
                </td>
                <td>
                  <button className="ghost" onClick={() => removeItem(index)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="inline" style={{ marginTop: 8 }}>
          <button className="secondary" onClick={addItemRow}>Agregar ítem</button>
          <span className="helper">Total unidades: {totalItems}</span>
        </div>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={saveDraft}>Guardar remito</button>
      </div>

      {drafts.length > 0 && (
        <div className="stack" style={{ marginTop: 24 }}>
          <h3>Remitos guardados</h3>
          <ul>
            {drafts.map((draft) => (
              <li key={draft.id} style={{ marginBottom: 8 }}>
                {draft.tipo} · {draft.cliente} · {new Date(draft.createdAt).toLocaleString()}
                <div className="inline" style={{ marginTop: 4 }}>
                  <button className="secondary" onClick={() => printDraft(draft)}>
                    Imprimir
                  </button>
                  <button className="ghost" onClick={() => removeDraft(draft.id)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedDraft && (
        <div className="print-only">
          <div style={{ width: `${ticketSettings?.width || 58}mm` }}>
            {ticketSettings?.header && <pre>{ticketSettings.header}</pre>}
            <div>{selectedDraft.tipo === "SALIDA" ? "Remito de salida" : "Remito de entrada"}</div>
            <div>Cliente: {selectedDraft.cliente}</div>
            {ticketSettings?.showDate && (
              <div>Fecha: {new Date(selectedDraft.createdAt).toLocaleDateString()}</div>
            )}
            {ticketSettings?.showTime && (
              <div>Hora: {new Date(selectedDraft.createdAt).toLocaleTimeString()}</div>
            )}
            <ul>
              {selectedDraft.items.map((item, index) => (
                <li key={`${selectedDraft.id}-${index}`}>
                  {item.descripcion} · {item.cantidad}
                </li>
              ))}
            </ul>
            {ticketSettings?.footer && <pre>{ticketSettings.footer}</pre>}
          </div>
        </div>
      )}
    </div>
  );
};

export default RemitosPage;
