import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../utils/api.js";

const initialRecargo = { tipo: "fijo", valor: 0 };

const paymentMethods = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "QR"];

const SalePage = () => {
  const transferAccountsKey = "qs-transfer-accounts";
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [clienteNombre, setClienteNombre] = useState("");
  const [recargo, setRecargo] = useState(initialRecargo);
  const [envio, setEnvio] = useState({ monto: 0, cobro: "INCLUIDO" });
  const [paraEnviar, setParaEnviar] = useState(false);
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
  const [clienteSugerencias, setClienteSugerencias] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [confirmVenta, setConfirmVenta] = useState(false);
  const [confirmacionCopiada, setConfirmacionCopiada] = useState(false);
  const [productSuggestionIndex, setProductSuggestionIndex] = useState(-1);
  const [customerSuggestionIndex, setCustomerSuggestionIndex] = useState(-1);
  const [transferAccounts, setTransferAccounts] = useState([]);
  const [productSuggestionTouched, setProductSuggestionTouched] = useState(false);
  const [productSearchEnabled, setProductSearchEnabled] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [exchangeStatus, setExchangeStatus] = useState("");
  const [exchangeSource, setExchangeSource] = useState("");
  const [exchangeType, setExchangeType] = useState(
    () => localStorage.getItem("qs-dollar-type") || "OFICIAL"
  );
  const [autoPrecioUsd, setAutoPrecioUsd] = useState(true);

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
  const selectedRate = useMemo(() => {
    if (!exchangeRates) return null;
    const key = exchangeType === "BLUE" ? "blue" : "oficial";
    return exchangeRates[key]?.venta || null;
  }, [exchangeRates, exchangeType]);

  const resetVenta = () => {
    setDescripcion("");
    setCantidad(1);
    setPrecioUnitario(0);
    setItems([]);
    setSelectedIndex(0);
    setClienteNombre("");
    setRecargo(initialRecargo);
    setEnvio({ monto: 0, cobro: "INCLUIDO" });
    setParaEnviar(false);
    setPagos([]);
    setPagoEnElMomento(true);
    setMetodoPago("EFECTIVO");
    setMontoPago(0);
    setTipoTarjeta("credito");
    setCuentaTransferencia("");
    setSelectedProduct(null);
    setAutoPrecioUsd(true);
    setStatus("Venta limpiada.");
    setTimeout(() => setStatus(""), 2000);
    descripcionRef.current?.focus();
  };

  const addItem = () => {
    const descripcionSnapshot = descripcion.trim();
    if (!descripcionSnapshot) {
      return;
    }
    if (selectedProduct?.moneda === "USD" && !selectedRate) {
      setStatus("Seleccioná una cotización válida para productos en USD.");
      return;
    }
    const cantidadNum = Number(cantidad || 0);
    const precioNum = Number(precioUnitario || 0);
    if (cantidadNum <= 0 || precioNum < 0) {
      setStatus("Cantidad o precio inválido.");
      return;
    }
    const atributos = atributosInput.trim()
      ? atributosInput
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : selectedProduct?.atributos || [];
    const subtotal = Math.round(cantidadNum * precioNum);
    const marcaSnapshot = marca.trim() || selectedProduct?.marca || "";
    setItems((prev) => [
      ...prev,
      {
        productId: selectedProduct?._id,
        descripcionSnapshot: selectedProduct?.descripcion || descripcionSnapshot,
        cantidad: cantidadNum,
        precioUnitario: precioNum,
        subtotal,
        marca: marcaSnapshot,
        atributos,
        moneda: selectedProduct?.moneda || "ARS",
        precioUnitarioOriginal:
          selectedProduct?.moneda === "USD" ? Number(selectedProduct?.precioSugerido || 0) : undefined,
        tipoCambio: selectedProduct?.moneda === "USD" ? Number(selectedRate || 0) : undefined
      }
    ]);
    setSelectedIndex(items.length);
    setDescripcion("");
    setCantidad(1);
    setPrecioUnitario(0);
    setMarca("");
    setAtributosInput("");
    setSelectedProduct(null);
    setSugerencias([]);
    setProductSuggestionIndex(-1);
    setProductSuggestionTouched(false);
    setProductSearchEnabled(false);
    setAutoPrecioUsd(true);
    descripcionRef.current?.focus();
    setStatus("Ítem agregado.");
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
      const trimmedAccount = cuentaTransferencia.trim();
      if (trimmedAccount) {
        setTransferAccounts((prev) => {
          const next = prev.includes(trimmedAccount) ? prev : [...prev, trimmedAccount];
          localStorage.setItem(transferAccountsKey, JSON.stringify(next));
          return next;
        });
      }
    }
    setPagos((prev) => [...prev, nuevoPago]);
    setMontoPago(0);
    setCuentaTransferencia("");
    montoPagoRef.current?.focus();
  };

  const updatePago = (index, field, value) => {
    setPagos((prev) =>
      prev.map((pago, idx) =>
        idx === index
          ? {
              ...pago,
              [field]: field === "monto" ? Number(value) : value
            }
          : pago
      )
    );
  };

  const removePago = (index) => {
    setPagos((prev) => prev.filter((_, idx) => idx !== index));
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

  const solicitarConfirmacion = () => {
    if (!items.length) {
      setStatus("Agregá al menos un ítem antes de guardar.");
      return;
    }
    setConfirmVenta(true);
  };

  const confirmarVenta = async () => {
    setConfirmVenta(false);
    await guardarVenta();
  };

  const copiarConfirmacion = async () => {
    const lineas = items.map((item) => {
      const partes = [
        item.descripcionSnapshot,
        item.marca || null,
        item.atributos?.length ? item.atributos.join(", ") : null,
        `${item.cantidad} x ${item.precioUnitario} = ${item.subtotal}`
      ].filter(Boolean);
      return partes.join(" - ");
    });
    const resumen = [
      "Confirmación de venta",
      ...lineas,
      `Total: ${total}`
    ].join("\n");
    try {
      await navigator.clipboard.writeText(resumen);
      setConfirmacionCopiada(true);
      setStatus("Confirmación copiada al portapapeles.");
      setTimeout(() => {
        setConfirmacionCopiada(false);
        setStatus("");
      }, 2000);
    } catch (error) {
      setStatus("No se pudo copiar la confirmación.");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  const crearCliente = async () => {
    const nombre = clienteNombre.trim();
    if (!nombre) return;
    if (selectedCustomer) {
      setStatus("Cliente seleccionado.");
      return;
    }
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
    if (confirmVenta) {
      setConfirmacionCopiada(false);
    }
  }, [confirmVenta]);

  useEffect(() => {
    const stored = localStorage.getItem(transferAccountsKey);
    if (stored) {
      try {
        setTransferAccounts(JSON.parse(stored));
      } catch {
        setTransferAccounts([]);
      }
    }
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        descripcionRef.current?.focus();
      }
      if (event.key === "F3") {
        event.preventDefault();
        setProductSearchEnabled((prev) => {
          const next = !prev;
          if (!next) {
            setSugerencias([]);
            setProductSuggestionIndex(-1);
            setProductSuggestionTouched(false);
          }
          return next;
        });
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
        solicitarConfirmacion();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, total, pagos, recargo, clienteNombre]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!productSearchEnabled || !descripcion.trim()) {
        setSugerencias([]);
        return;
      }
      try {
        const data = await apiFetch(`/api/products?query=${encodeURIComponent(descripcion)}`);
        setSugerencias(data);
        setProductSuggestionIndex(-1);
        setProductSuggestionTouched(false);
        const exactMatch = data.find(
          (item) => item.descripcion.toLowerCase() === descripcion.trim().toLowerCase()
        );
        if (exactMatch) {
          if (exactMatch.moneda === "USD" && selectedRate) {
            setPrecioUnitario(Math.round((exactMatch.precioSugerido || 0) * selectedRate));
            setAutoPrecioUsd(true);
          } else {
            setPrecioUnitario(exactMatch.precioSugerido || 0);
          }
        }
      } catch (error) {
        setSugerencias([]);
        setProductSuggestionIndex(-1);
      }
    };
    loadSuggestions();
  }, [descripcion, productSearchEnabled, selectedRate]);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const settings = await apiFetch("/api/settings/dolar");
        if (settings?.oficial && settings?.blue) {
          setExchangeRates({
            oficial: { venta: settings.oficial },
            blue: { venta: settings.blue }
          });
          setExchangeSource("Configurado manualmente");
          setExchangeStatus("");
          return;
        }
        const data = await apiFetch("/api/exchange-rates/dolar");
        setExchangeRates(data);
        setExchangeSource("Ambito");
        setExchangeStatus("");
      } catch (error) {
        setExchangeStatus("No se pudo obtener la cotización del dólar.");
      }
    };
    loadRates();
  }, []);

  useEffect(() => {
    if (!selectedProduct || selectedProduct.moneda !== "USD") {
      return;
    }
    if (!selectedRate || !autoPrecioUsd) {
      return;
    }
    const base = Number(selectedProduct.precioSugerido || 0);
    setPrecioUnitario(Math.round(base * selectedRate));
  }, [selectedProduct, selectedRate, autoPrecioUsd]);

  useEffect(() => {
    const loadCustomerSuggestions = async () => {
      if (!clienteNombre.trim()) {
        setClienteSugerencias([]);
        return;
      }
      try {
        const data = await apiFetch(`/api/customers?query=${encodeURIComponent(clienteNombre)}`);
        setClienteSugerencias(data);
        setCustomerSuggestionIndex(data.length ? 0 : -1);
        const exactMatch = data.find(
          (item) => item.nombre.toLowerCase() === clienteNombre.trim().toLowerCase()
        );
        if (exactMatch) {
          setSelectedCustomer(exactMatch);
        }
      } catch (error) {
        setClienteSugerencias([]);
        setCustomerSuggestionIndex(-1);
      }
    };
    loadCustomerSuggestions();
  }, [clienteNombre]);

  const seleccionarProducto = (product) => {
    setSelectedProduct(product);
    setDescripcion(product.descripcion);
    if (product.moneda === "USD" && selectedRate) {
      setPrecioUnitario(Math.round((product.precioSugerido || 0) * selectedRate));
    } else {
      setPrecioUnitario(product.precioSugerido || 0);
    }
    setMarca(product.marca || "");
    setAtributosInput((product.atributos || []).join(", "));
    setSugerencias([]);
    setProductSuggestionIndex(-1);
    setProductSuggestionTouched(false);
    setProductSearchEnabled(false);
    setAutoPrecioUsd(true);
    descripcionRef.current?.focus();
  };

  const seleccionarCliente = (customer) => {
    setSelectedCustomer(customer);
    setClienteNombre(customer.nombre);
    setClienteSugerencias([]);
    setCustomerSuggestionIndex(-1);
    clienteRef.current?.focus();
  };

  return (
    <div className="container">
      <h2>Nueva venta</h2>
      <p className="helper">
        Atajos: F2 producto, F3 buscar producto, Enter agrega ítem, F4 cliente, F6 pago,
        Ctrl+Enter guardar, Esc cancelar.
      </p>
      {status && <div className="alert">{status}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="stack">
          <label>
            Cotización dólar
            <select
              value={exchangeType}
              onChange={(event) => {
                setExchangeType(event.target.value);
                localStorage.setItem("qs-dollar-type", event.target.value);
              }}
            >
              <option value="OFICIAL">Oficial</option>
              <option value="BLUE">Blue</option>
            </select>
          </label>
          {exchangeRates ? (
            <div className="helper">
              Oficial: {exchangeRates.oficial?.venta ?? "-"} · Blue: {exchangeRates.blue?.venta ?? "-"}
              {exchangeSource ? ` · ${exchangeSource}` : ""}
            </div>
          ) : (
            <div className="helper">{exchangeStatus || "Cargando cotización..."}</div>
          )}
        </div>
        <div className="stack">
          <label>
            Tipo de cambio seleccionado
            <input type="number" value={selectedRate || ""} readOnly />
          </label>
          <div className="helper">Se usa para productos cargados en USD.</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="stack">
          <label>
            Descripción producto
            <div className="inline">
              <input
                ref={descripcionRef}
                value={descripcion}
                onChange={(event) => {
                  setDescripcion(event.target.value);
                  setSelectedProduct(null);
                  if (!productSearchEnabled) {
                    setSugerencias([]);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && sugerencias.length) {
                    event.preventDefault();
                    setProductSuggestionTouched(true);
                    setProductSuggestionIndex((prev) => {
                      if (prev < 0) return 0;
                      return Math.min(prev + 1, sugerencias.length - 1);
                    });
                    return;
                  }
                  if (event.key === "ArrowUp" && sugerencias.length) {
                    event.preventDefault();
                    setProductSuggestionTouched(true);
                    setProductSuggestionIndex((prev) => Math.max(prev - 1, 0));
                    return;
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (
                      productSuggestionTouched &&
                      productSuggestionIndex >= 0 &&
                      sugerencias[productSuggestionIndex]
                    ) {
                      seleccionarProducto(sugerencias[productSuggestionIndex]);
                      return;
                    }
                    addItem();
                  }
                }}
                placeholder="Ej: PROTEINA..."
              />
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setProductSearchEnabled(true);
                  descripcionRef.current?.focus();
                }}
              >
                Buscar
              </button>
            </div>
          </label>
          {sugerencias.length > 0 && (
            <ul className="suggestions-list">
              {sugerencias.map((producto, index) => (
                <li key={producto._id}>
                  <button
                    type="button"
                    className={`ghost ${index === productSuggestionIndex ? "is-active" : ""}`}
                    onClick={() => seleccionarProducto(producto)}
                  >
                    <span>
                      {producto.descripcion}
                      {producto.marca ? ` - ${producto.marca}` : ""}
                      {producto.atributos?.length ? ` - ${producto.atributos.join(", ")}` : ""}
                    </span>
                    <span className="helper">
                      {producto.moneda === "USD" ? "U$S" : "$"} {producto.precioSugerido || 0}
                      {producto.moneda === "USD" && selectedRate
                        ? ` · $ ${Math.round((producto.precioSugerido || 0) * selectedRate)}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label>
            Marca
            <input
              value={marca}
              onChange={(event) => {
                setMarca(event.target.value);
                setSelectedProduct(null);
              }}
            />
          </label>
        </div>
        <div>
          <label>
            Atributos (coma)
            <input
              value={atributosInput}
              onChange={(event) => {
                setAtributosInput(event.target.value);
                setSelectedProduct(null);
              }}
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
              onChange={(event) => {
                setPrecioUnitario(event.target.value);
                setAutoPrecioUsd(false);
              }}
            />
          </label>
          {selectedProduct?.moneda === "USD" && (
            <div className="helper">
              Precio USD {selectedProduct.precioSugerido || 0} · TC {selectedRate || "-"}
            </div>
          )}
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
              <td>
                {item.precioUnitario}
                {item.moneda === "USD" && (
                  <div className="helper">
                    USD {item.precioUnitarioOriginal} · TC {item.tipoCambio}
                  </div>
                )}
              </td>
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
              onChange={(event) => {
                setClienteNombre(event.target.value);
                setSelectedCustomer(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && clienteSugerencias.length) {
                  event.preventDefault();
                  setCustomerSuggestionIndex((prev) =>
                    Math.min(prev + 1, clienteSugerencias.length - 1)
                  );
                  return;
                }
                if (event.key === "ArrowUp" && clienteSugerencias.length) {
                  event.preventDefault();
                  setCustomerSuggestionIndex((prev) => Math.max(prev - 1, 0));
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (customerSuggestionIndex >= 0 && clienteSugerencias[customerSuggestionIndex]) {
                    seleccionarCliente(clienteSugerencias[customerSuggestionIndex]);
                    return;
                  }
                  crearCliente();
                }
              }}
              placeholder="Nombre del cliente"
            />
          </label>
          {!clienteNombre.trim() && (
            <div className="helper">Sin cliente asignado.</div>
          )}
          {clienteSugerencias.length > 0 && (
            <ul className="suggestions-list">
              {clienteSugerencias.map((cliente, index) => (
                <li key={cliente._id}>
                  <button
                    type="button"
                    className={`ghost ${index === customerSuggestionIndex ? "is-active" : ""}`}
                    onClick={() => seleccionarCliente(cliente)}
                  >
                    <span>{cliente.nombre}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            checked={!pagoEnElMomento}
            onChange={(event) => setPagoEnElMomento(!event.target.checked)}
          />
          Pago pendiente
        </label>
        {!pagoEnElMomento && (
          <div className="helper">La venta se guardará como pendiente.</div>
        )}
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label className="inline">
          <input
            type="checkbox"
            checked={paraEnviar}
            onChange={(event) => setParaEnviar(event.target.checked)}
          />
          Para enviar
        </label>
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
          {envio.cobro === "CADETE" ? (
            <div className="helper">
              Si el cliente transfiere el envío, cargá ese pago aquí y el monto quedará como
              “Cadete debe rendir” para descontar en la rendición.
            </div>
          ) : (
            <div className="helper">
              El envío se cobra en caja junto con el resto de la venta.
            </div>
          )}
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
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
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
                  list="transfer-accounts-sale"
                />
                <datalist id="transfer-accounts-sale">
                  {transferAccounts.map((account) => (
                    <option key={account} value={account} />
                  ))}
                </datalist>
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
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Método</th>
                <th>Monto</th>
                <th>Cuenta</th>
                <th>Tipo tarjeta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago, index) => (
                <tr key={`${pago.metodo}-${index}`}>
                  <td>
                    <select
                      value={pago.metodo}
                      onChange={(event) => updatePago(index, "metodo", event.target.value)}
                    >
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={pago.monto}
                      onChange={(event) => updatePago(index, "monto", event.target.value)}
                    />
                  </td>
                  <td>
                    {pago.metodo === "TRANSFERENCIA" ? (
                      <input
                        value={pago.cuentaTransferencia || ""}
                        onChange={(event) =>
                          updatePago(index, "cuentaTransferencia", event.target.value)
                        }
                        list="transfer-accounts-sale"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {pago.metodo === "TARJETA" ? (
                      <select
                        value={pago.tipoTarjeta || "credito"}
                        onChange={(event) => updatePago(index, "tipoTarjeta", event.target.value)}
                      >
                        <option value="credito">Crédito</option>
                        <option value="debito">Débito</option>
                      </select>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button className="ghost" onClick={() => removePago(index)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="helper">
          Total cobrado: {totalPagos} · Saldo pendiente: {saldoPendiente}
          {envio.cobro === "CADETE" ? ` · Cadete debe rendir: ${montoEnvio}` : ""}
        </div>
        {saldoPendiente > 0 && (
          <div className="helper">Atención: hay saldo pendiente.</div>
        )}
      </div>

      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={solicitarConfirmacion}>Guardar venta (Ctrl+Enter)</button>
        <button className="ghost" onClick={resetVenta}>Limpiar</button>
      </div>

      {confirmVenta && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Confirmar venta</h3>
            <ul className="modal-items">
              {items.map((item, index) => (
                <li key={`${item.descripcionSnapshot}-${index}`}>
                  {item.descripcionSnapshot}
                  {item.marca ? ` · ${item.marca}` : ""}
                  {item.atributos?.length ? ` · ${item.atributos.join(", ")}` : ""}
                  {" · "}
                  {item.cantidad} x {item.precioUnitario} = {item.subtotal}
                </li>
              ))}
            </ul>
            <div className="modal-total">
              Total: {total}
            </div>
            {confirmacionCopiada && (
              <div className="helper">Confirmación copiada al portapapeles.</div>
            )}
            <div className="modal-actions">
              <button className="ghost" onClick={() => setConfirmVenta(false)}>Volver</button>
              <button className="secondary" onClick={copiarConfirmacion}>Copiar</button>
              <button onClick={confirmarVenta}>Confirmar venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalePage;
