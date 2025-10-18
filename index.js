// Main entrypoint for Vercel deployment
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import https from "https";

dotenv.config();
const app = express();

// Manual CORS handling for maximum compatibility
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-proxy-auth"
  );
  res.header("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.json());

const BACKEND_URL = "https://simplysales.postick.co.in/mahadev/";
const PROXY_SECRET = process.env.PROXY_SECRET || "changeme";

// Create HTTPS agent for development to handle TLS issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production",
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Mahadev Group API Proxy Server",
    status: "running",
    endpoints: {
      proxy: "/api/mahadev/*",
      health: "/",
    },
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Mahadev Group API Proxy",
    version: "1.0.0",
    description:
      "Express proxy server for Mahadev Group API - POST requests only",
    endpoints: {
      proxy: "/api/mahadev/* - Proxies POST requests to backend",
      health: "/ - Health check",
    },
    methods: ["POST"],
  });
});

// Test proxy endpoint (for debugging)
app.get("/test-proxy", (req, res) => {
  res.json({
    message: "Proxy test endpoint",
    note: "Use /api/mahadev/* for actual proxy requests",
    example: "/api/mahadev/home_products",
  });
});

// Handle OPTIONS for proxy route
app.options("/api/mahadev/*", (req, res) => {
  res.status(200).end();
});

// MAIN PROXY LOGIC - Handle only POST requests for /api/mahadev/*
app.post("/api/mahadev/*", async (req, res) => {
  try {
    // Extract the path after /api/mahadev
    const path = req.originalUrl.replace(/^\/api\/mahadev/, "");
    const url = BACKEND_URL + path;

    console.log(`Proxying ${req.method} ${req.originalUrl} to ${url}`);

    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        "x-proxy-auth": PROXY_SECRET,
      },
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
      agent: httpsAgent,
    });

    const text = await backendRes.text();
    res.status(backendRes.status).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
