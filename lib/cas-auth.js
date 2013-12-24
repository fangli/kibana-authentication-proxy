/**
 * Configure CAS Authentication
 * When no cas_server_url presented, no CAS authentication applied.
 */


exports.configureCas = function(express, app, config) {

  if (!config.enable_cas_auth) {
    console.log('Warning: No CAS authentication presented');
    return;
  } else {
    console.log('Info: CAS Authentication applied');
  }

  config.cas_server_url = config.cas_server_url.replace(/\s+$/,'');

  app.get('/auth/cas/login', function (req, res) {
    var service_url  = req.protocol + "://" + req.get('host') + req.url;

    var CAS = require('cas');
    var cas = new CAS({base_url: config.cas_server_url, service: service_url});

    var cas_login_url = config.cas_server_url + "/login?service=" + service_url;

    var ticket = req.param('ticket');
    if (ticket) {
      cas.validate(ticket, function(err, status, username) {
        if (err || !status) {
          // Handle the error
          res.send(
            "Invalid CAS ticket! Permission denied.<br>" +
              "<a href='" + cas_login_url + "'>Try again</a>"
          );
        } else {
          // Log the user in
          req.session.cas_user_name = username;
          res.redirect("/");
        }
      });
    } else {
      if (!req.session.cas_user_name) {
        res.redirect(cas_login_url);
      } else {
        res.redirect("/");
      }
    }
  });

  app.use(function(req, res, next) {
    if (req.url.indexOf('/auth/cas/login') === 0 || req.session.cas_user_name) {
      return next();
    } else {
      res.redirect('/auth/cas/login');
    }
  });
};
