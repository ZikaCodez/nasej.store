require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./core/passport");
const authRoutes = require("./routes/authRoutes");
const { notFoundHandler, errorHandler } = require("./core/middleware");

const app = express();

app.use(express.json());

// Trust proxy (Vite/Reverse proxy) for correct cookie handling
app.set("trust proxy", 1);

// CORS: allow configured origins and credentials for cross-site requests
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const devDefaults = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const prodDefaults = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];
const allowedOrigins = Array.from(
  new Set([
    ...(process.env.NODE_ENV === "production" ? prodDefaults : devDefaults),
    ...envOrigins,
  ]),
);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow same-origin or non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    const ok = allowedOrigins.includes(origin);
    if (ok) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));
// Preflight handler compatible with Express 5 (avoid '*' path-to-regexp error)
app.options(/^\/(?:api|auth)(?:\/.*)?$/, cors(corsOptions));

// Session store backed by MongoDB (MainDB)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: "MainDB",
      collectionName: "sessions",
    }),
  }),
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
  console.log("Health check OK");
});

// Auth routes (support both /auth and /api/auth for dev proxy callbacks)
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

// API routes
app.use("/api", apiRouter);

// Terminal handlers
app.use(notFoundHandler);
app.use(errorHandler);

const port = 3000;
app.listen(port, () => {
  console.log(`E-Commerce backend listening on port ${port}`);
});
