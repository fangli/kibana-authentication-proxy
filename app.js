/**
 * Hosts the latest kibana3 and elasticsearch behind Google OAuth2 Authentication
 * with nodejs and express.
 * License: MIT
 * Copyright: Funplus Game Inc.
 * Author: Fang Li.
 * Project: https://github.com/fangli/kibana-authentication-proxy
 */

var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');

var config = require('./config');
var app = express();

console.log('Server starting...');

app.use(express.cookieParser());
app.use(express.session({ secret: config.cookie_secret }));

// Authentication
require('./lib/basic-auth').configureBasic(express, app, config);
require('./lib/google-oauth').configureOAuth(express, app, config);
require('./lib/cas-auth.js').configureCas(express, app, config);

// Setup ES proxy
require('./lib/es-proxy').configureESProxy(app, config.es_host, config.es_port,
          config.es_username, config.es_password);


// Serve config.js for kibana3
// We should use special config.js for the frontend and point the ES to __es/
app.get('/config.js', kibana3configjs);

// Serve all kibana3 frontend files
app.use('/', express.static(__dirname + '/kibana/src'));

run();

function run() {
  if (config.enable_ssl_port === true) {
    var options = {
      key: fs.readFileSync(config.ssl_key_file),
      cert: fs.readFileSync(config.ssl_cert_file),
    };
    https.createServer(options, app).listen(config.listen_port_ssl);
    console.log('Server listening on ' + config.listen_port_ssl + '(SSL)');
  }
  http.createServer(app).listen(config.listen_port);
  console.log('Server listening on ' + config.listen_port);
}

function kibana3configjs(request, response) {
  response.setHeader('Content-Type', 'application/javascript');
  response.end("define(['settings'], " +
    "function (Settings) {'use strict'; return new Settings({elasticsearch: '/__es', default_route     : '/dashboard/file/default.json'," +
      "kibana_index: '" +
      config.kibana_es_index +
      "', panel_names: ['histogram', 'map', 'pie', 'table', 'filtering', 'timepicker', 'text', 'hits', 'column', 'trends', 'bettermap', 'query', 'terms', 'sparklines'] }); });");
}
