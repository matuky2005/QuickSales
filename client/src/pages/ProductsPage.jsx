import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api.js";

const ProductsPage = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [precioSugerido, setPrecioSugerido] = useState("");
  const [marca, setMarca] = useState("");
  const [atributosInput, setAtributosInput] = useState("");
  const [status, setStatus] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef(null);
  const [brands, setBrands] = useState([]);
  const [exportBrand, setExportBrand] = useState("");
  const [showForm, setShowForm] = useState(false);

  const buscar = async () => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("query", query.trim());
      }
      if (filterBrand.trim()) {
        params.set("brand", filterBrand.trim());
      }
      params.set("includeInactive", "true");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const [data, brandData] = await Promise.all([
        apiFetch(`/api/products${suffix}`),
        apiFetch("/api/products/brands")
      ]);
      setProducts(data);
      setBrands(brandData);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const crearProducto = async () => {
    if (!descripcion.trim()) return;
    try {
      const payload = {
        descripcion: descripcion.trim(),
        marca: marca.trim(),
        atributos: atributosInput
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        precioSugerido: Number(precioSugerido || 0)
      };
      const product = await apiFetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      setStatus("Producto guardado.");
      setShowForm(false);
      setDescripcion("");
      setPrecioSugerido("");
      setMarca("");
      setAtributosInput("");
      setEditingId(null);
      setProducts((prev) =>
        prev.some((item) => item._id === product._id)
          ? prev.map((item) => (item._id === product._id ? product : item))
          : [product, ...prev]
      );
    } catch (error) {
      setStatus(error.message);
    }
  };

  const startEdit = (product) => {
    setShowForm(true);
    setEditingId(product._id);
    setDescripcion(product.descripcion || "");
    setPrecioSugerido(product.precioSugerido ?? "");
    setMarca(product.marca || "");
    setAtributosInput((product.atributos || []).join(", "));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDescripcion("");
    setPrecioSugerido("");
    setMarca("");
    setAtributosInput("");
    setShowForm(false);
  };

  const toggleProductStatus = async (product) => {
    try {
      const updated = await apiFetch(`/api/products/${product._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active: !product.active })
      });
      setProducts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (error) {
      setStatus(error.message);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await apiFetch(`/api/products/${product._id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((item) => item._id !== product._id));
    } catch (error) {
      setStatus(error.message);
    }
  };

  const buildCsvValue = (value) => {
    const stringValue = String(value ?? "");
    if (stringValue.includes(";") || stringValue.includes("\"") || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, "\"\"")}"`;
    }
    return stringValue;
  };

  const exportCsv = () => {
    const headers = ["id", "descripcion", "marca", "atributos", "precioSugerido"];
    const filteredProducts = exportBrand
      ? products.filter((product) => product.marca === exportBrand)
      : products;
    const rows = filteredProducts.map((product) => [
      product._id,
      product.descripcion || "",
      product.marca || "",
      (product.atributos || []).join("|"),
      product.precioSugerido ?? 0
    ]);
    const content = [headers, ...rows]
      .map((row) => row.map(buildCsvValue).join(";"))
      .join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "productos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportTemplateCsv = () => {
    const headers = ["descripcion", "marca", "atributos", "precioSugerido"];
    const content = headers.map(buildCsvValue).join(";") + "\n";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "productos-plantilla.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          current += "\"";
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ";" && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map((value) => value.trim());
  };

  const parseAttributes = (value) => {
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    const separator = trimmed.includes("|") ? "|" : ",";
    return trimmed
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (!lines.length) {
        setStatus("El archivo está vacío.");
        return;
      }
      const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
      const findIndex = (name) => headers.indexOf(name);
      const descripcionIndex = findIndex("descripcion");
      const marcaIndex = findIndex("marca");
      const atributosIndex = findIndex("atributos");
      const precioIndex = findIndex("preciosugerido");

      const items = [];
      for (const line of lines.slice(1)) {
        const values = parseCsvLine(line);
        const descripcionValue = values[descripcionIndex]?.trim();
        if (!descripcionValue) continue;
        items.push({
          descripcion: descripcionValue,
          marca: values[marcaIndex]?.trim() || "",
          atributos: parseAttributes(values[atributosIndex] || ""),
          precioSugerido: Number(values[precioIndex] || 0)
        });
      }
      if (!items.length) {
        setStatus("No se encontraron productos válidos para importar.");
        return;
      }
      const response = await apiFetch("/api/products/import", {
        method: "POST",
        body: JSON.stringify({ items })
      });
      const { summary } = response;
      setStatus(
        `Importación completada. Creados: ${summary.created}, actualizados: ${summary.updated}, ` +
        `sin cambios: ${summary.unchanged}, omitidos: ${summary.skipped}.`
      );
      buscar();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      buscar();
    }, 300);
    return () => clearTimeout(delay);
  }, [filterBrand, query]);

  const groupedByBrand = products.reduce((acc, product) => {
    const brandKey = product.marca || "Sin marca";
    if (!acc[brandKey]) {
      acc[brandKey] = [];
    }
    acc[brandKey].push(product);
    return acc;
  }, {});

  return (
    <div className="container">
      <h2>Productos</h2>
      {status && <div className="alert">{status}</div>}
      <div className="inline" style={{ marginTop: 16 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        <select value={filterBrand} onChange={(event) => setFilterBrand(event.target.value)}>
          <option value="">Todas las marcas</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <button onClick={buscar}>Buscar</button>
        <button className="secondary" onClick={() => setShowForm(true)}>Nuevo producto</button>
      </div>
      {showForm && (
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          <label>
            Descripción
            <input value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
          </label>
          <label>
            Marca
            <input list="brands-list" value={marca} onChange={(event) => setMarca(event.target.value)} />
            <datalist id="brands-list">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </label>
          <label>
            Atributos (coma)
            <input
              value={atributosInput}
              onChange={(event) => setAtributosInput(event.target.value)}
            />
          </label>
          <label>
            Precio sugerido
            <input
              type="number"
              value={precioSugerido}
              onChange={(event) => setPrecioSugerido(event.target.value)}
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button onClick={crearProducto}>{editingId ? "Actualizar producto" : "Guardar producto"}</button>
            <button className="ghost" onClick={cancelEdit}>Cancelar</button>
          </div>
        </div>
      )}
      <div className="inline" style={{ marginTop: 16 }}>
        <select value={exportBrand} onChange={(event) => setExportBrand(event.target.value)}>
          <option value="">Exportar todas las marcas</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <button className="secondary" onClick={exportCsv}>Exportar CSV</button>
        <button className="secondary" onClick={exportTemplateCsv}>Exportar plantilla</button>
        <button
          className="secondary"
          onClick={() => importInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? "Importando..." : "Importar CSV"}
        </button>
        <label style={{ display: "none" }}>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            onChange={importCsv}
            disabled={isImporting}
          />
        </label>
      </div>
      <div className="helper" style={{ marginTop: 8 }}>
        Exportá para obtener el formato. Usá separador “;” y atributos separados por “|”.
      </div>
      <div className="table-wrapper" style={{ marginTop: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Marca</th>
              <th>Atributos</th>
              <th>Precio sugerido</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.descripcion}</td>
                <td>{product.marca || "Sin marca"}</td>
                <td>{product.atributos?.length ? product.atributos.join(", ") : "-"}</td>
                <td>{product.precioSugerido}</td>
                <td>
                  {product.active === false ? "Suspendido" : "Activo"}
                </td>
                <td>
                  <button className="ghost" onClick={() => startEdit(product)}>Editar</button>
                  <button className="ghost" onClick={() => toggleProductStatus(product)}>
                    {product.active === false ? "Reactivar" : "Suspender"}
                  </button>
                  <button className="ghost" onClick={() => removeProduct(product)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="helper">Sin productos para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="stack" style={{ marginTop: 24 }}>
        <h3>Productos por marca</h3>
        {Object.entries(groupedByBrand).map(([brand, items]) => (
          <div key={brand}>
            <strong>{brand}</strong>
            <ul>
              {items.map((product) => (
                <li key={product._id}>
                  {product.descripcion} - {product.precioSugerido}
                  {product.active === false ? " · Suspendido" : ""}
                  {product.atributos?.length ? ` · ${product.atributos.join(", ")}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;
