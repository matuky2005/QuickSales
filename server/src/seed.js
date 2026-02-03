import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Customer from "./models/Customer.js";
import Sale from "./models/Sale.js";
import User from "./models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quicksales";

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("No se pudo conectar a MongoDB para ejecutar el seed.");
    console.error(
      "Este comando requiere MongoDB en ejecución (local o remoto)."
    );
    console.error("Verificá que el servicio esté iniciado y la URI sea correcta.");
    console.error(`URI actual: ${MONGODB_URI}`);
    throw error;
  }
  await Promise.all([
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Sale.deleteMany({}),
    User.deleteMany({})
  ]);

  const products = await Product.insertMany([
    { descripcion: "PROTEINA - ULTRATECH 1LB - FRUTILLA", precioSugerido: 10500 },
    { descripcion: "CREATINA MONOHIDRATO 300G", precioSugerido: 8500 },
    { descripcion: "BARRA PROTEICA CHOCOLATE", precioSugerido: 2200 }
  ]);

  const customers = await Customer.insertMany([
    { nombre: "Juan Perez" },
    { nombre: "Lucia Gómez" }
  ]);

  await User.insertMany([{ username: "matias", password: "1023", active: true }]);

  const sales = [
    {
      fechaHora: new Date(),
      customerId: customers[0]._id,
      customerNombreSnapshot: customers[0].nombre,
      items: [
        {
          productId: products[0]._id,
          descripcionSnapshot: products[0].descripcion,
          cantidad: 2,
          precioUnitario: 10500,
          subtotal: 21000
        }
      ],
      recargo: { tipo: "fijo", valor: 0, montoCalculado: 0 },
      envio: { monto: 0, cobro: "INCLUIDO" },
      total: 21000,
      totalCobrado: 21000,
      saldoPendiente: 0,
      cadeteMontoPendiente: 0,
      pagos: [{ metodo: "EFECTIVO", monto: 21000 }]
    },
    {
      fechaHora: new Date(),
      customerId: customers[1]._id,
      customerNombreSnapshot: customers[1].nombre,
      items: [
        {
          productId: products[1]._id,
          descripcionSnapshot: products[1].descripcion,
          cantidad: 1,
          precioUnitario: 8500,
          subtotal: 8500
        }
      ],
      recargo: { tipo: "fijo", valor: 500, montoCalculado: 500 },
      envio: { monto: 0, cobro: "INCLUIDO" },
      total: 9000,
      totalCobrado: 9000,
      saldoPendiente: 0,
      cadeteMontoPendiente: 0,
      pagos: [{ metodo: "TRANSFERENCIA", cuentaTransferencia: "alias.demo", monto: 9000 }]
    },
    {
      fechaHora: new Date(),
      items: [
        {
          productId: products[2]._id,
          descripcionSnapshot: products[2].descripcion,
          cantidad: 3,
          precioUnitario: 2200,
          subtotal: 6600
        }
      ],
      recargo: { tipo: "porcentaje", valor: 10, montoCalculado: 660 },
      envio: { monto: 1200, cobro: "CADETE" },
      total: 7260,
      totalCobrado: 7260 - 1200,
      saldoPendiente: 0,
      cadeteMontoPendiente: 1200,
      pagos: [
        { metodo: "EFECTIVO", monto: 5000 },
        { metodo: "QR", monto: 1060 }
      ]
    },
    {
      fechaHora: new Date(),
      items: [
        {
          productId: products[0]._id,
          descripcionSnapshot: products[0].descripcion,
          cantidad: 1,
          precioUnitario: 10500,
          subtotal: 10500
        },
        {
          productId: products[2]._id,
          descripcionSnapshot: products[2].descripcion,
          cantidad: 2,
          precioUnitario: 2200,
          subtotal: 4400
        }
      ],
      recargo: { tipo: "fijo", valor: 0, montoCalculado: 0 },
      envio: { monto: 0, cobro: "INCLUIDO" },
      total: 14900,
      totalCobrado: 14900,
      saldoPendiente: 0,
      cadeteMontoPendiente: 0,
      pagos: [{ metodo: "TARJETA", tipoTarjeta: "credito", monto: 14900 }]
    },
    {
      fechaHora: new Date(),
      items: [
        {
          productId: products[1]._id,
          descripcionSnapshot: products[1].descripcion,
          cantidad: 2,
          precioUnitario: 8500,
          subtotal: 17000
        }
      ],
      recargo: { tipo: "fijo", valor: 0, montoCalculado: 0 },
      envio: { monto: 0, cobro: "INCLUIDO" },
      total: 17000,
      totalCobrado: 17000,
      saldoPendiente: 0,
      cadeteMontoPendiente: 0,
      pagos: [{ metodo: "EFECTIVO", monto: 17000 }]
    }
  ];

  await Sale.insertMany(sales);
  await mongoose.disconnect();
  console.log("Seed complete");
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  console.error("Sugerencia: iniciá MongoDB y reintentá el comando.");
  process.exit(1);
});
