import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

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
