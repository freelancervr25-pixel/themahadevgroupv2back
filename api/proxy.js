import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const BACKEND_URL = "https://simplysales.postick.co.in/mahadev";
const PROXY_SECRET = process.env.PROXY_SECRET || "changeme";

// All requests starting with /api/mahadev will be proxied
app.all("/api/mahadev/*", async (req, res) => {
  try {
    const path = req.originalUrl.replace(/^\/api\/mahadev/, "");
    const url = BACKEND_URL + path;

    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        "x-proxy-auth": PROXY_SECRET,
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const text = await backendRes.text();
    res.status(backendRes.status).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Express proxy server is running!" });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
  });
}

export default app;
