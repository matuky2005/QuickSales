import express from "express";
import cors from "cors";
import morgan from "morgan";
import productsRouter from "./routes/products.js";
import customersRouter from "./routes/customers.js";
import salesRouter from "./routes/sales.js";
import reportsRouter from "./routes/reports.js";
import cashClosuresRouter from "./routes/cashClosures.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/sales", salesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/cash-closures", cashClosuresRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
