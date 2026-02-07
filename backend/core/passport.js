const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { connectDB } = require("./db");
const { generateUnique6DigitId } = require("../controllers/helpers");

// Serialize by numeric _id
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    const user = await users.findOne({ _id: numericId });
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = await connectDB();
        const users = db.collection("users");

        const existing = await users.findOne({ googleId: profile.id });
        if (existing) {
          await users.updateOne(
            { _id: existing._id },
            { $set: { lastLogin: new Date() } },
          );
          return done(null, existing, { isNew: false });
        }

        // Create new user with 6-digit integer _id
        const _id = await generateUnique6DigitId("users");
        const email =
          Array.isArray(profile.emails) && profile.emails[0]
            ? profile.emails[0].value
            : "";
        const name =
          profile.displayName ||
          (profile.name
            ? `${profile.name.givenName} ${profile.name.familyName}`
            : "User");

        const newUser = {
          _id,
          googleId: profile.id,
          email,
          name,
          role: "customer",
          addresses: [],
          wishlist: [],
          cartItems: [],
          createdAt: new Date(),
        };

        await users.insertOne(newUser);
        return done(null, newUser, { isNew: true });
      } catch (err) {
        done(err);
      }
    },
  ),
);

module.exports = passport;
