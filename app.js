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

app.use(express.logger());

app.use(function(req, res, next){
  req.url = req.url.replace(/\/\//,'/');
  next();
});

console.log('Server starting...');

if (!config.base_path) {
	config.base_path="";
	console.log("No base_path specified in config so using /");
}

index_filter_usregex=new Object();
if (!config.index_filter_trigger) {
	config.index_filter_trigger='^logstash-';
}
if (!config.index_filter_file) {
	config.index_filter_file=false;
	console.log("No index_filter_file specified so not using index filtering");
} else {
    if ( fs.existsSync(config.index_filter_file) ) {
        var index_filter_data=fs.readFileSync(config.index_filter_file,'utf8');
        var userregexes=index_filter_data.split('\n');
        for (var userregex in userregexes) {
            var usre=userregexes[userregex].match(/^([^:]+):(.+)/);
            if (usre) {
                index_filter_usregex[usre[1]]=usre[2];
            }
        }
        console.log("index_filter_file specified, read and parsed - so using it");
    } else {
	    config.index_filter_file=false;
	    console.log("index_filter_file specified but not found in fs so not using index filtering");
    }
}

app.use(express.cookieParser());
app.use(express.session({ secret: config.cookie_secret }));

// Authentication
if (config.enable_basic_auth && config.basic_auth_file && fs.existsSync(config.basic_auth_file)) {
    console.log('basic_auth_file defined and found, so reading it ...');
    config.basic_auth_users=new Array();
    var basic_auth_users=fs.readFileSync(config.basic_auth_file,'utf8');
    var userpass=basic_auth_users.split('\n');
    for (var userpass_index in userpass) {
        var uspa=userpass[userpass_index].match(/^([^:]+):(.+)/);
        if (uspa) {
            config.basic_auth_users[config.basic_auth_users.length]={"user": uspa[1], "password": uspa[2]};
        }
    }
}
require('./lib/basic-auth').configureBasic(express, app, config);
require('./lib/google-oauth').configureOAuth(express, app, config);
require('./lib/cas-auth.js').configureCas(express, app, config);

// Setup ES proxy
require('./lib/es-proxy').configureESProxy(app, config.es_host, config.es_port,
          config.es_username, config.es_password, config.base_path, config.index_filter_trigger, (config.index_filter_file) ? index_filter_usregex : false);

// Serve config.js for kibana3
// We should use special config.js for the frontend and point the ES to __es/
app.get(config.base_path + '/config.js', kibana3configjs);

// Serve all kibana3 frontend files
app.use(express.compress());
app.use(config.base_path + '/', express.static(__dirname + '/kibana/src', {maxAge: config.brower_cache_maxage || 0}));


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

function kibana3configjs(req, res) {
 

  function getKibanaIndex() {
    var raw_index = config.kibana_es_index;
    var user_type = config.which_auth_type_for_kibana_index;
    var user;
    if (raw_index.indexOf('%user%') > -1) {
      if (user_type === 'google') {
        user = req.googleOauth.id;
      } else if (user_type === 'basic') {
        user = req.user;
      } else if (user_type === 'cas') {
        user = req.session.cas_user_name;
      } else {
        user = 'unknown';
      }
      return raw_index.replace(/%user%/gi, user);
    } else {
      return raw_index;
    }
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.end("define(['settings'], " +
    "function (Settings) {'use strict'; return new Settings({elasticsearch: '" + config.base_path + "/__es', default_route     : '/dashboard/file/default.json'," +
      "kibana_index: '" +
      getKibanaIndex() +
      "', panel_names: ['histogram', 'map', 'pie', 'table', 'filtering', 'timepicker', 'text', 'hits', 'column', 'trends', 'bettermap', 'query', 'terms', 'sparklines'] }); });");
}
