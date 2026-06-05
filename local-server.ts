import path from "path";
import express from "express";

// Import Vercel handlers for local development
import healthHandler from "./api/health";
import metaHandler from "./api/meta";
import roomsHandler from "./api/rooms";
import roomDetailHandler from "./api/rooms/[id]";
import reviewsHandler from "./api/rooms/[id]/reviews";
import registerHandler from "./api/auth/register";
import loginHandler from "./api/auth/login";
import forgotHandler from "./api/auth/forgot-password";
import resetHandler from "./api/auth/reset-password";

function wrap(handler: any) {
  return async (req: any, res: any) => {
    // Merge express request parameters (e.g. :id) into query object for Vercel handlers
    req.query = { ...req.query, ...req.params };
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error("❌ Local Dev handler error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  };
}

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // Mount API handlers
  app.all("/api/health", wrap(healthHandler));
  app.all("/api/meta", wrap(metaHandler));
  app.all("/api/rooms", wrap(roomsHandler));
  app.all("/api/rooms/:id/reviews", wrap(reviewsHandler));
  app.all("/api/rooms/:id", wrap(roomDetailHandler));
  app.all("/api/auth/register", wrap(registerHandler));
  app.all("/api/auth/login", wrap(loginHandler));
  app.all("/api/auth/forgot-password", wrap(forgotHandler));
  app.all("/api/auth/reset-password", wrap(resetHandler));

  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Error starting local server:", err);
});
