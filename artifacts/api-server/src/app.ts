import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// Middleware simples para substituir o pinoHttp problemático nos logs
app.use((req: any, res: any, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
