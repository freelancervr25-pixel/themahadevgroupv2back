import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import https from "https";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const BACKEND_URL = "https://simplysales.postick.co.in/mahadev";
const PROXY_SECRET = process.env.PROXY_SECRET || "changeme";

// Create HTTPS agent for development to handle TLS issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production",
});

// Handle all requests - Vercel will route /api/mahadev/* to this function
app.all("*", async (req, res) => {
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
