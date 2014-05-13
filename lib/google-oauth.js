/**
 * Configure google oauth passport's.
 * Config parameters:
 * - client_id: the application ID
 * - client_secret: the applicatin secrete
 * - allowed_emails: a comma separated listed of patterns
 *   each pattern can be '*': anything,
 *                       '*@domain': any email in the domain
 *                       'an@email': a specific email.
 */
exports.configureOAuth = function(express, app, config) {
  if (!config.enable_google_oauth) {
    console.log('Warning: No Google OAuth2 presented');
    return;
  } else {
    console.log('Info: Google OAuth2 Authentication applied');
  }

  var validateUser = function(passportProfile) {
    var validEmail;
    passportProfile.emails.some(function(email) {
      email = email.value;
      config.allowed_emails.some(function(patt) {
        if (patt === email) {
          validEmail = email;
          return true;
        }
        if (patt === '*') {
          validEmail = email;
          return true;
        }
        if ('*' + email.slice(email.indexOf('@')) === patt) {
          validEmail = email;
          return true;
        }
      });
      if (validEmail) {
        return true;
      }
    });
    return validEmail;
  };

  var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
  var passport = require('passport');
  var scope = config.scope || [ 'https://www.googleapis.com/auth/userinfo.email' ];

  var passportIsSet = false;

  var lazySetupPassport = function(req) {
    passportIsSet = true;

    var protocol = (req.connection.encrypted || req.headers['x-forwarded-proto'] == "https" ) ? "https" : "http";
    var host  =  req.headers['x-forwarded-host'] || req.headers.host;
  //not doing anything with this:
  //it will try to serialize the users in the session.
    passport.serializeUser(function(user, done) {
      done(null, user);
    });
    passport.deserializeUser(function(obj, done) {
      done(null, obj);
    });

    var callbackUrl = protocol + "://" + host + "/auth/google/callback";
    passport.use(new GoogleStrategy({
      clientID: config.client_id, clientSecret: config.client_secret, callbackURL: callbackUrl
    }, function(accessToken, refreshToken, profile, done) {
      var validEmail = validateUser(profile);
      if (!validEmail) {
        done(null, false, { message: 'not an authorized email ' + profile.emails[0] });
      } else {
        done(null, profile);
      }
    }));

    app.get('/auth/google', passport.authenticate(
      'google',
      { scope: scope, }),
    function(req, res) {
      // The request will be redirected to Google for authentication, so
      // this function will not be called.
    });

    app.get('/auth/google/callback', passport.authenticate(
      'google',
      { failureRedirect: req.session.beforeLoginURL || '/' }),
    function(req, res) {
      // Successful authentication, redirect home.
      req.session.authenticated = true;
      res.redirect(req.session.beforeLoginURL || '/');
    });

  };

  app.use(express.urlencoded());
  app.use(express.json());
  app.use(require('connect-restreamer')());
  app.use(function(req, res, next) {
    if (req.url.indexOf('/auth/google') === 0 || req.session.authenticated) {
      return next();
    }
    if (!passportIsSet) {
      lazySetupPassport(req);
    }

    req.session.beforeLoginURL = req.url;
    res.redirect('/auth/google');
  });
  app.use(passport.initialize({ userProperty: 'googleOauth' }));
  app.use(passport.session());
};
