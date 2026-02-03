import express from "express";
import cors from "cors";
import morgan from "morgan";
import productsRouter from "./routes/products.js";
import customersRouter from "./routes/customers.js";
import salesRouter from "./routes/sales.js";
import reportsRouter from "./routes/reports.js";
import cashClosuresRouter from "./routes/cashClosures.js";
import creditNotesRouter from "./routes/creditNotes.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import cashMovementsRouter from "./routes/cashMovements.js";
import exchangeRatesRouter from "./routes/exchangeRates.js";
import settingsRouter from "./routes/settings.js";
import { notFoundHandler, errorHandler, requireUser } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/exchange-rates", exchangeRatesRouter);
app.use("/api", requireUser);
app.use("/api/settings", settingsRouter);
app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/sales", salesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/cash-closures", cashClosuresRouter);
app.use("/api/credit-notes", creditNotesRouter);
app.use("/api/users", usersRouter);
app.use("/api/cash-movements", cashMovementsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
