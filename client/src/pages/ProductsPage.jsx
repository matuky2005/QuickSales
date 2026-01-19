import React, { useEffect, useState } from "react";
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

  const buscar = async () => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("query", query.trim());
      }
      if (filterBrand.trim()) {
        params.set("brand", filterBrand.trim());
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const data = await apiFetch(`/api/products${suffix}`);
      setProducts(data);
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
  };

  useEffect(() => {
    buscar();
  }, [filterBrand]);

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
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Descripción
          <input value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        </label>
        <label>
          Marca
          <input value={marca} onChange={(event) => setMarca(event.target.value)} />
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
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={crearProducto}>{editingId ? "Actualizar producto" : "Guardar producto"}</button>
          {editingId && (
            <button className="ghost" onClick={cancelEdit}>Cancelar</button>
          )}
        </div>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        <input
          value={filterBrand}
          onChange={(event) => setFilterBrand(event.target.value)}
          placeholder="Marca"
        />
        <button onClick={buscar}>Buscar</button>
      </div>
      <ul style={{ marginTop: 16 }}>
        {products.map((product) => (
          <li key={product._id}>
            {product.descripcion} {product.marca ? `(${product.marca})` : ""} - Sugerido: {product.precioSugerido}
            {product.atributos?.length ? ` · ${product.atributos.join(", ")}` : ""}
            <button className="ghost" style={{ marginLeft: 8 }} onClick={() => startEdit(product)}>
              Editar
            </button>
          </li>
        ))}
      </ul>

      <div className="stack" style={{ marginTop: 24 }}>
        <h3>Productos por marca</h3>
        {Object.entries(groupedByBrand).map(([brand, items]) => (
          <div key={brand}>
            <strong>{brand}</strong>
            <ul>
              {items.map((product) => (
                <li key={product._id}>
                  {product.descripcion} - {product.precioSugerido}
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
