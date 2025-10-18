import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { createServerlessExpress } from "@vercel/node";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const BACKEND_URL = "https://simplysales.postick.co.in/mahadev";
const PROXY_SECRET = process.env.PROXY_SECRET || "changeme";

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
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
    });

    const text = await backendRes.text();
    res.status(backendRes.status).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

// ✅ Export handler for Vercel
export default createServerlessExpress(app);
