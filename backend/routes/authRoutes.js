const express = require("express");
const passport = require("../core/passport");
const { connectDB } = require("../core/db");

const router = express.Router();

// Initiate Google OAuth, capturing redirect and passing via state
router.get("/google", (req, res, next) => {
  const redirectPath =
    typeof req.query.redirect === "string" ? req.query.redirect : "/";
  const state = Buffer.from(redirectPath, "utf8").toString("base64");
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    prompt: "select_account",
  })(req, res, next);
});

// Google OAuth callback
router.get("/google/callback", (req, res, next) => {
  const state =
    typeof req.query.state === "string"
      ? req.query.state
      : Buffer.from("/", "utf8").toString("base64");
  let redirectPath = "/";
  try {
    redirectPath = Buffer.from(state, "base64").toString("utf8") || "/";
  } catch {}

  passport.authenticate(
    "google",
    { session: true, failureRedirect: "/" },
    (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.redirect("/");
      req.logIn(user, (err) => {
        if (err) return next(err);
        const clientUrl = process.env.CLIENT_URL || "/";

        // If new user, force redirect to complete-register and preserve original path via query
        const isNew = info && info.isNew === true;
        const destination = isNew
          ? `/complete-register?redirect=${encodeURIComponent(redirectPath)}`
          : redirectPath;

        let target;
        try {
          target =
            clientUrl === "/"
              ? destination
              : new URL(destination, clientUrl).toString();
        } catch {
          const base = clientUrl.replace(/\/$/, "");
          const path = destination.startsWith("/")
            ? destination
            : `/${destination}`;
          target = `${base}${path}`;
        }
        // Ensure session is persisted before redirecting
        try {
          req.session.save(() => res.redirect(target));
        } catch {
          return res.redirect(target);
        }
      });
    },
  )(req, res, next);
});

// Current session user
router.get("/current_user", async (req, res, next) => {
  try {
    if (req.user) return res.json(req.user);
    const id = req.session?.passport?.user;
    if (Number.isInteger(id)) {
      const db = await connectDB();
      const users = db.collection("users");
      const user = await users.findOne({ _id: id });
      return res.json(user || null);
    }
    res.json(null);
  } catch (err) {
    next(err);
  }
});

// Logout and redirect home
router.get("/logout", (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || "/";
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect(clientUrl);
    });
  });
});

module.exports = router;
