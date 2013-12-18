/**
 * Hosts kibana as an express application.
 * Optional google oauth integration.
 * Proxies the calls to elasticsearch
 * Insert basic authentication to elasticsearch calls if necessary.
 * Deployable on cloudfoundry.
 *
 * License: MIT
 * Copyright: Sutoiku, Inc.
 * Author: Hugues Malphettes.
 */

var parseUrl = require('url').parse;
var express = require('express');
var app = express();
var server;

var configureESProxy = require('./lib/es-proxy').configureESProxy;
var configureOAuth = require('./lib/google-oauth').configureOAuth;

var config = createConfig();
configureApp(app, config);

function createConfig() {
  var config = {};
  if (!config.port) {
    config.port = process.env.PORT || process.env.VCAP_APP_PORT || 3003;
  }
  if (!config.es_url) {
    config.es_url = process.env.ES_URL || 'http://localhost:9200';
  }
  // oauth
  if (process.env.APP_ID && process.env.APP_SECRET) {
    config.appID = process.env.APP_ID;
    config.appSecret = process.env.APP_SECRET;
    config.authorizedEmails = (process.env.AUTHORIZED_EMAILS || '*').split(',');
  }
  // parse the url
  parseESURL(config.es_url, config);

  return config;
}

function configureApp(app, config) {
  app.disable('x-powered-by');
  app.use(express.logger('dev'));

  configureOAuth(express, app, config);

  app.get('/config.js', kibanaConfig);

  configureESProxy(app, config.es_host, config.es_port,
            config.es_username, config.es_password);

  app.use('/', express.static(__dirname + '/kibana/src'));
  server = app.listen(config.port, /*"0.0.0.0",*/ function() {
    console.log('server listening on ' + config.port);
  });
}

function parseESURL(esurl, config) {
  var urlP = parseUrl(esurl);
  config.es_host = urlP.hostname;

  var secure = urlP.protocol === 'https:';
  if (urlP.port !== null && urlP.port !== undefined) {
      config.es_port = urlP.port;
  } else if (secure) {
      config.es_port = '443';
  } else {
      config.es_port = '80';
  }
  if (urlP.auth) {
    var toks = urlP.auth.split(':');
    config.es_username = toks[0];
    config.es_password = toks[1] || '';
  }
}

function kibanaConfig(request, response) {
  //returns the javascript that is the config object. for kibana.
  var responseBody = "define(['settings'], function (Settings) {'use strict'; return new Settings({elasticsearch: 'http://'+window.location.host+'/__es', default_route     : '/dashboard/file/default.json', kibana_index: 'kibana-int', panel_names: ['histogram', 'map', 'pie', 'table', 'filtering', 'timepicker', 'text', 'hits', 'column', 'trends', 'bettermap', 'query', 'terms', 'sparklines'] }); });";
  response.setHeader('Content-Type', 'application/javascript');
  response.end(responseBody);
}

