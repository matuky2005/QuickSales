import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../utils/api.js";

const initialRecargo = { tipo: "fijo", valor: 0 };

const SalePage = () => {
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [clienteNombre, setClienteNombre] = useState("");
  const [recargo, setRecargo] = useState(initialRecargo);
  const [envio, setEnvio] = useState({ monto: 0, cobro: "INCLUIDO" });
  const [pagos, setPagos] = useState([]);
  const [pagoEnElMomento, setPagoEnElMomento] = useState(true);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoPago, setMontoPago] = useState(0);
  const [tipoTarjeta, setTipoTarjeta] = useState("credito");
  const [cuentaTransferencia, setCuentaTransferencia] = useState("");
  const [marca, setMarca] = useState("");
  const [atributosInput, setAtributosInput] = useState("");
  const [status, setStatus] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  const descripcionRef = useRef(null);
  const clienteRef = useRef(null);
  const pagoRef = useRef(null);
  const montoPagoRef = useRef(null);

  const subtotalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );

  const montoRecargo = useMemo(() => {
    if (recargo.tipo === "porcentaje") {
      return Math.round((subtotalItems * Number(recargo.valor || 0)) / 100);
    }
    return Math.round(Number(recargo.valor || 0));
  }, [recargo, subtotalItems]);

  const montoEnvio = Math.round(Number(envio.monto || 0));
  const total = subtotalItems + montoRecargo + montoEnvio;
  const totalCobrarCaja = Math.max(total - montoEnvio, 0);
  const totalPagos = useMemo(
    () => pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0),
    [pagos]
  );
  const saldoPendiente = Math.max(Math.round(totalCobrarCaja - totalPagos), 0);

  const resetVenta = () => {
    setDescripcion("");
    setCantidad(1);
    setPrecioUnitario(0);
    setItems([]);
    setSelectedIndex(0);
    setClienteNombre("");
    setRecargo(initialRecargo);
    setEnvio({ monto: 0, cobro: "INCLUIDO" });
    setPagos([]);
    setPagoEnElMomento(true);
    setMetodoPago("EFECTIVO");
    setMontoPago(0);
    setTipoTarjeta("credito");
    setCuentaTransferencia("");
    setStatus("Venta limpiada.");
    setTimeout(() => setStatus(""), 2000);
    descripcionRef.current?.focus();
  };

  const addItem = async () => {
    const descripcionSnapshot = descripcion.trim();
    if (!descripcionSnapshot) {
      return;
    }
    const cantidadNum = Number(cantidad || 0);
    const precioNum = Number(precioUnitario || 0);
    if (cantidadNum <= 0 || precioNum < 0) {
      setStatus("Cantidad o precio inválido.");
      return;
    }
    try {
      const product = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          descripcion: descripcionSnapshot,
          precioSugerido: precioNum,
          marca: marca.trim(),
          atributos: atributosInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });
      const subtotal = Math.round(cantidadNum * precioNum);
      setItems((prev) => [
        ...prev,
        {
          productId: product._id,
          descripcionSnapshot: product.descripcion,
          cantidad: cantidadNum,
          precioUnitario: precioNum,
          subtotal
        }
      ]);
      setSelectedIndex(items.length);
      setDescripcion("");
      setCantidad(1);
      setPrecioUnitario(product.precioSugerido || 0);
      setMarca("");
      setAtributosInput("");
      descripcionRef.current?.focus();
      setStatus("Ítem agregado.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const addPago = () => {
    const monto = Number(montoPago || 0);
    if (monto <= 0) {
      setStatus("Monto inválido.");
      return;
    }
    if (Math.round(totalPagos + monto) > Math.round(totalCobrarCaja)) {
      setStatus("El pago supera el total a cobrar en caja.");
      return;
    }
    const nuevoPago = {
      metodo: metodoPago,
      monto
    };
    if (metodoPago === "TARJETA") {
      nuevoPago.tipoTarjeta = tipoTarjeta;
    }
    if (metodoPago === "TRANSFERENCIA") {
      nuevoPago.cuentaTransferencia = cuentaTransferencia || "Cuenta";
    }
    setPagos((prev) => [...prev, nuevoPago]);
    setMontoPago(0);
    setCuentaTransferencia("");
    montoPagoRef.current?.focus();
  };

  const eliminarItemSeleccionado = () => {
    if (items.length === 0) return;
    setItems((prev) => prev.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
    setStatus("Ítem eliminado.");
  };

  const guardarVenta = async () => {
    try {
      const payload = {
        fechaHora: new Date().toISOString(),
        customerNombreSnapshot: clienteNombre.trim() || undefined,
        items,
        recargo: { tipo: recargo.tipo, valor: Number(recargo.valor || 0) },
        envio: { monto: montoEnvio, cobro: envio.cobro },
        total,
        pagos,
        pagoEnElMomento
      };
      await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setStatus(saldoPendiente > 0 ? "Venta guardada con saldo pendiente." : "Venta guardada.");
      resetVenta();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const crearCliente = async () => {
    const nombre = clienteNombre.trim();
    if (!nombre) return;
    try {
      await apiFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify({ nombre })
      });
      setStatus("Cliente registrado.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    descripcionRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        descripcionRef.current?.focus();
      }
      if (event.key === "F4") {
        event.preventDefault();
        clienteRef.current?.focus();
      }
      if (event.key === "F6") {
        event.preventDefault();
        pagoRef.current?.focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      }
      if ((event.ctrlKey && event.key === "Backspace") || event.key === "Delete") {
        event.preventDefault();
        eliminarItemSeleccionado();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (window.confirm("¿Cancelar venta actual?") ) {
          resetVenta();
        }
      }
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        guardarVenta();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, total, pagos, recargo, clienteNombre]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!descripcion.trim()) {
        setSugerencias([]);
        return;
      }
      try {
        const data = await apiFetch(`/api/products?query=${encodeURIComponent(descripcion)}`);
        setSugerencias(data);
        const exactMatch = data.find(
          (item) => item.descripcion.toLowerCase() === descripcion.trim().toLowerCase()
        );
        if (exactMatch) {
          setPrecioUnitario(exactMatch.precioSugerido || 0);
        }
      } catch (error) {
        setSugerencias([]);
      }
    };
    loadSuggestions();
  }, [descripcion]);

  return (
    <div className="container">
      <h2>Nueva venta</h2>
      <p className="helper">
        Atajos: F2 producto, Enter agrega ítem, F4 cliente, F6 pago, Ctrl+Enter guardar, Esc cancelar.
      </p>
      {status && <div className="alert">{status}</div>}

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="stack">
          <label>
            Descripción producto
            <input
              ref={descripcionRef}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addItem();
                }
              }}
              placeholder="Ej: PROTEINA..."
            />
          </label>
          {sugerencias.length > 0 && (
            <div className="helper">Sugerencias: {sugerencias.map((p) => p.descripcion).join(" · ")}</div>
          )}
        </div>
        <div>
          <label>
            Marca
            <input value={marca} onChange={(event) => setMarca(event.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Atributos (coma)
            <input
              value={atributosInput}
              onChange={(event) => setAtributosInput(event.target.value)}
              placeholder="ej: 1kg, frutilla"
            />
          </label>
        </div>
        <div>
          <label>
            Cantidad
            <input
              type="number"
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Precio unitario
            <input
              type="number"
              value={precioUnitario}
              onChange={(event) => setPrecioUnitario(event.target.value)}
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <button className="secondary" onClick={addItem}>Agregar ítem</button>
          </div>
        </div>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.descripcionSnapshot}-${index}`} className={index === selectedIndex ? "selected" : ""}>
              <td>{item.descripcionSnapshot}</td>
              <td>{item.cantidad}</td>
              <td>{item.precioUnitario}</td>
              <td>{item.subtotal}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="4" className="helper">Sin ítems todavía.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="stack">
          <label>
            Cliente
            <input
              ref={clienteRef}
              value={clienteNombre}
              onChange={(event) => setClienteNombre(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  crearCliente();
                }
              }}
              placeholder="Nombre del cliente"
            />
          </label>
        </div>
        <div className="stack">
          <label>
            Recargo
            <div className="inline">
              <select
                value={recargo.tipo}
                onChange={(event) => setRecargo((prev) => ({ ...prev, tipo: event.target.value }))}
              >
                <option value="fijo">Fijo</option>
                <option value="porcentaje">%</option>
              </select>
              <input
                type="number"
                value={recargo.valor}
                onChange={(event) => setRecargo((prev) => ({ ...prev, valor: event.target.value }))}
              />
            </div>
          </label>
        </div>
        <div className="stack">
          <label>
            Total
            <input type="number" value={total} readOnly />
          </label>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label className="inline">
          <input
            type="checkbox"
            checked={pagoEnElMomento}
            onChange={(event) => setPagoEnElMomento(event.target.checked)}
          />
          Pago en el momento
        </label>
        {!pagoEnElMomento && (
          <div className="helper">La venta se guardará como pendiente.</div>
        )}
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="stack">
          <label>
            Envío
            <input
              type="number"
              value={envio.monto}
              onChange={(event) => setEnvio((prev) => ({ ...prev, monto: event.target.value }))}
            />
          </label>
        </div>
        <div className="stack">
          <label>
            Cobro envío
            <select
              value={envio.cobro}
              onChange={(event) => setEnvio((prev) => ({ ...prev, cobro: event.target.value }))}
            >
              <option value="INCLUIDO">Cliente paga en local</option>
              <option value="CADETE">Cadete lleva/cobra</option>
            </select>
          </label>
        </div>
        <div className="stack">
          <label>
            Total en caja (sin envío)
            <input type="number" value={totalCobrarCaja} readOnly />
          </label>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <h3>Pagos</h3>
        <div className="grid grid-3">
          <div>
            <label>
              Método
              <select ref={pagoRef} value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="TARJETA">TARJETA</option>
                <option value="QR">QR</option>
              </select>
            </label>
          </div>
          {metodoPago === "TARJETA" && (
            <div>
              <label>
                Tipo tarjeta
                <select value={tipoTarjeta} onChange={(event) => setTipoTarjeta(event.target.value)}>
                  <option value="credito">Crédito</option>
                  <option value="debito">Débito</option>
                </select>
              </label>
            </div>
          )}
          {metodoPago === "TRANSFERENCIA" && (
            <div>
              <label>
                Cuenta
                <input
                  value={cuentaTransferencia}
                  onChange={(event) => setCuentaTransferencia(event.target.value)}
                  placeholder="Alias / banco"
                />
              </label>
            </div>
          )}
          <div>
            <label>
              Monto
              <input
                ref={montoPagoRef}
                type="number"
                value={montoPago}
                onChange={(event) => setMontoPago(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPago();
                  }
                }}
              />
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="secondary" onClick={addPago}>Agregar pago</button>
          </div>
        </div>

        {pagos.length > 0 && (
          <ul>
            {pagos.map((pago, index) => (
              <li key={`${pago.metodo}-${index}`}>
                {pago.metodo} - {pago.monto}
                {pago.tipoTarjeta ? ` (${pago.tipoTarjeta})` : ""}
                {pago.cuentaTransferencia ? ` (${pago.cuentaTransferencia})` : ""}
              </li>
            ))}
          </ul>
        )}
        <div className="helper">
          Total cobrado: {totalPagos} · Saldo pendiente: {saldoPendiente}
          {envio.cobro === "CADETE" ? ` · Cadete debe rendir: ${montoEnvio}` : ""}
        </div>
      </div>

      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={guardarVenta}>Guardar venta (Ctrl+Enter)</button>
        <button className="ghost" onClick={resetVenta}>Limpiar</button>
      </div>
    </div>
  );
};

export default SalePage;
