const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = (passport) => {
  passport.serializeUser((user,done) => {
    done(null, user);
  });
  passport.deserializeUser((user,done) => {
    done(null, user);
  });

  passport.use(new GoogleStrategy({
    clientID: "28046980409-olom3um51prepdmkfseoiln865piadm8.apps.googleusercontent.com",
    clientSecret: "BxKLqk3GMkfc2-nWUp0QaBqL",
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  (token, refreshToken, profile, done) => {
    return done(null, {
      profile:profile,
      token:token
    });
  }));
};