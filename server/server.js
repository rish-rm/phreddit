import MongoStore from "connect-mongo";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import linkFlairRoutes from "./routes/linkflairRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { attachCurrentUser } from "./middleware/auth.js";

dotenv.config();

export const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/phreddit";
export const PORT = Number(process.env.PORT || 8000);

export function createApp({ useSessionStore = true } = {}) {
  const app = express();
  const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...configuredOrigins
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow server-to-server requests (no browser Origin header).
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));

  const cookieSameSite = process.env.SESSION_COOKIE_SAMESITE || "lax";
  const cookieSecure =
    process.env.SESSION_COOKIE_SECURE === "true" || cookieSameSite === "none";

  if (cookieSecure) {
    app.set("trust proxy", 1);
  }

  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure
    }
  };

  if (useSessionStore) {
    sessionConfig.store = MongoStore.create({ mongoUrl: MONGO_URI });
  }

  app.use(session(sessionConfig));
  app.use(attachCurrentUser);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/communities", communityRoutes);
  app.use("/api/linkflairs", linkFlairRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/comments", commentRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: `Route not found: ${req.method} ${req.originalUrl}`
    });
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || (error.name === "CastError" ? 400 : 500);
    const message = error.name === "CastError"
      ? "Invalid resource id."
      : error.message || "Internal server error.";

    if (status >= 500) {
      console.error(error);
    }

    res.status(status).json({
      error: message
    });
  });

  return app;
}

export async function startServer() {
  await mongoose.connect(MONGO_URI);
  const app = createApp();
  return app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}
