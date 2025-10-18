// Main entrypoint for Vercel deployment
import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
