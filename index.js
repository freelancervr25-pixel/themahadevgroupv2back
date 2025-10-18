// Main entrypoint for Vercel deployment
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import https from "https";

dotenv.config();
const app = express();

// Configure CORS to allow your frontend
const corsOptions = {
  origin: [
    "http://localhost:5173", // Vite default port
    "http://localhost:3000", // React default port
    "http://localhost:8080", // Vue default port
    "https://themahadevgroupv2back.vercel.app", // Your Vercel domain
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-proxy-auth"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight OPTIONS requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-proxy-auth"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});

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
    description: "Express proxy server for Mahadev Group API",
    endpoints: {
      proxy: "/api/mahadev/* - Proxies requests to backend",
      health: "/ - Health check",
    },
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

// MAIN PROXY LOGIC - Handle all /api/mahadev/* requests
app.all("/api/mahadev/*", async (req, res) => {
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

    // Set CORS headers for the response
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-proxy-auth"
    );
    res.header("Access-Control-Allow-Credentials", "true");

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
