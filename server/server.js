import http from "node:http";
import MongoStore from "connect-mongo";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import linkFlairRoutes from "./routes/linkflairRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { attachCurrentUser } from "./middleware/auth.js";
import { setIo } from "./realtime.js";
import { ensureConfiguredAdmin } from "./utils/adminBootstrap.js";

dotenv.config();

export const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/phreddit";
export const PORT = Number(process.env.PORT || 8000);

export function getAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...configuredOrigins
  ]);
}

export function createApp({ useSessionStore = true } = {}) {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(helmet());

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

  if (cookieSecure || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }

  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production.");
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
  app.use("/api/reports", reportRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: `Route not found: ${req.method} ${req.originalUrl}`
    });
  });

  app.use((error, _req, res, _next) => {
    let status = error.status || 500;
    let message = error.message || "Internal server error.";

    if (error.name === "CastError") {
      status = 400;
      message = "Invalid resource id.";
    } else if (error.name === "ValidationError") {
      status = 400;
      message = Object.values(error.errors || {})
        .map((detail) => detail.message)
        .join(" ") || "Invalid input.";
    } else if (error.code === 11000) {
      status = 409;
      message = "That value is already in use.";
    }

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
  const adminBootstrap = await ensureConfiguredAdmin();
  if (adminBootstrap.configured) {
    console.log("Configured the ADMIN_EMAIL account as an administrator.");
  } else if (adminBootstrap.reason === "not-found") {
    console.warn("ADMIN_EMAIL does not match an existing account yet.");
  }

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: [...getAllowedOrigins()],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("post:join", (postId) => {
      if (typeof postId === "string" && postId.length <= 40) {
        socket.join(`post:${postId}`);
      }
    });
    socket.on("post:leave", (postId) => {
      if (typeof postId === "string") {
        socket.leave(`post:${postId}`);
      }
    });
  });

  setIo(io);

  return server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}
