import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "DuckFind API" });
});

app.listen(port, () => {
  console.log(`Api listening on http://localhost:${port}`);
});
