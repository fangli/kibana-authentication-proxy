
/*!
 * A Node.js CAS client, implementing the protocol as defined at:
 * http://www.jasig.org/cas/protocol
 */

/**
 * Module dependencies
 */

var http = require('http');
var https = require('https');
var url = require('url');
var xml2js = require('xml2js');

/**
 * Initialize CAS with the given `options`.
 *
 * @param {Object} options
 *     { 
 *       'base_url': 
 *           The full URL to the CAS server, including the base path.
 *       'service': 
 *           The URL of the current page. Optional with authenticate().
 *       'protocol_version': 
 *           Either 1.0 or 2.0
 *     }
 * @api public
 */
var CAS = module.exports = function CAS(options) 
{  
  options = options || {};

  if (!options.protocol_version) {
    options.protocol_version = 2.0;
  }

  this.protocol_version = options.protocol_version;

  if (!options.base_url) {
    throw new Error('Required CAS option `base_url` missing.');
  } 

  var cas_url = url.parse(options.base_url);
  if (cas_url.protocol != 'https:') {
    throw new Error('Only https CAS servers are supported.');
  } 

  if (!cas_url.hostname) {
    throw new Error('Option `base_url` must be a valid url like: https://example.com/cas');
  } 
  
  this.hostname = cas_url.hostname;
  this.port = cas_url.port || 443;
  this.base_path = cas_url.pathname;
  this.service = options.service;
};

/**
 * Library version.
 */
CAS.version = '0.0.1';




/**
 * Attempt to validate a given ticket with the CAS server.
 * `callback` is called with (err, auth_status, username, extended)
 *
 * @param {String} ticket
 *     A service ticket (ST)
 * @param {Function} callback
 *     callback(err, auth_status, username, extended).
 *     `extended` is an object containing:
 *       - username
 *       - attributes
 *       - ticket
 * @param {String} service
 *     The URL of the service requesting authentication. Optional if
 *     the `service` option was already specified during initialization.
 * @param {Boolean} renew 
 *     (optional) Set this to TRUE to force the CAS server to request
 *     credentials from the user even if they had already done so
 *     recently.
 * @api public
 */
CAS.prototype.validate = function(ticket, callback, service, renew) 
{
  var validate_path;
  var protocol_version = this.protocol_version;
  if (protocol_version < 2.0) {
    validate_path = 'validate';
  } else {
      validate_path = 'serviceValidate';
    }
  
  var service_url = service || this.service;
  if (!service_url) {
    throw new Error('Required CAS option `service` missing.');
  }

  var query = {
    'ticket': ticket,
    'service': service_url
  };

  if (renew) {
    query['renew'] = 1;
  }
  
  var queryPath = url.format({
      pathname: this.base_path+'/'+validate_path,
      query: query
    });

  var req = https.get({
    host: this.hostname,
    port: this.port,
    path: queryPath
    }, function(res) {
        // Handle server errors
        res.on('error', function(e) {
        callback(e);
    });

    res.setEncoding('utf8');
    var response = '';
    res.on('data', function(chunk) {
      response += chunk;
      if (response.length > 1e6) {
        req.connection.destroy();
      }
    });

    res.on('end', function() {
      if (protocol_version < 2.0) {
        var sections = response.split('\n');
        if (sections.length >= 1) {
          if (sections[0] == 'no') {
            callback(undefined, false);
            return;
          } else if (sections[0] == 'yes' &&  sections.length >= 2) {
            callback(undefined, true, sections[1]);
            return;
          }
        }
        callback(new Error('Bad response format.'));
        return;
      }
      
      var parser = new xml2js.Parser();
      parser.parseString(response, function(err, result) {
          if (err) {
              callback(new Error('xml2js could not parse response: ' + response));
              return;
          }
          var elemSuccess = result['cas:serviceResponse']['cas:authenticationSuccess'];
          if (elemSuccess) {
              elemSuccess = elemSuccess[0];
              var elemUser = elemSuccess['cas:user'];
              if (!elemUser) {
                  callback(new Error("No username?"), false);
                  return;
              }
              var username = elemUser[0];
              var attributes = elemSuccess['cas:attributes'][0];

              callback(undefined, true, username, {
                  'username': username,
                  'attributes': attributes,
                  'ticket': ticket,
              });
              return;
          }

          var elemFailure = result['cas:serviceResponse']['cas:authenticationFailure'];
          if (elemFailure) {
              elemFailure = elemFailure[0];
              var code = elemFailure['$']['code'];
              var message = 'Validation failed [' + code +']: ';
              message += elemFailure['_'];
              callback(new Error(message), false);
              return;
          }

          callback(new Error('Bad response format.'));
          console.error(response);
          return;
      })
  });
});
};

