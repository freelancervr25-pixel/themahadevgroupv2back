import express from "express";
import fetch from "node-fetch";

const app = express();

// Manual CORS middleware - set headers for ALL requests
app.use((req, res, next) => {
  // Set CORS headers for all responses
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-proxy-auth, X-Requested-With"
  );
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.json());

// Specific OPTIONS handler for home_products endpoint
app.options('/api/mahadev/home_products', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Simple proxy endpoint
app.post("/api/mahadev/*", async (req, res) => {
  try {
    // Extract the path after /api/mahadev
    const path = req.originalUrl.replace(/^\/api\/mahadev/, "");

    // Forward to your backend
    const backendUrl = `https://simplysales.postick.co.in/mahadev${path}`;

    console.log(`Proxying POST ${req.originalUrl} to ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-auth": "supersecret123", // Add your auth header
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();

    // Forward the response
    res.status(response.status).send(data);
  } catch (error) {
    console.error("Proxy error:", error);

    res.status(500).json({
      error: "Proxy failed",
      message: error.message,
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Simple Proxy Server",
    status: "running",
    endpoint: "/api/mahadev/*",
  });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
  });
}

export default app;
