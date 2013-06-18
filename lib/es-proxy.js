/**
 * Proxies the request to elasticsearch
 * node-http-proxy worked really well until it met elasticsearch deployed on cloudfoundry
 * hence this small proxy and naive proxy based on:
 * http://www.catonmat.net/http-proxy-in-nodejs/
 */
var http = require('http');

function proxyRequest(request, response, host, port, user, password, getProxiedRequestPath, isUI) {
  if (redirects(isUI, request, response)) {
    return;
  }
  var filteredHeaders = {};
  Object.keys(request.headers).forEach(function(header) {
    if (header === 'host') {
      //most necessary:
      filteredHeaders[header] = host;
    } else if (header !== 'cookie' && 
        (isUI === true || (header !== 'referer' &&
               header !== 'user-agent' && header !== 'accept-language'))) {
      //avoid leaking unecessay info and save some room
      filteredHeaders[header] = request.headers[header];
    }
  });
  if (user) {
    var auth = 'Basic ' + new Buffer(user + ':' + password).toString('base64');
    filteredHeaders.authorization = auth;
  }

  var options =  {
    path: getProxiedRequestPath(request),
    method: request.method,
    hostname: host,
    port: port,
    headers: filteredHeaders
  };
  if (user) {
    options.auth = password ? user + ':' + password : user;
  }
  //console.log('headers', filteredHeaders);
  var proxyReq = http.request(options);

  proxyReq.addListener('response', function(proxyResp) {
    var http10 = request.httpVersionMajor === 1 && request.httpVersionMinor < 1;
    if(http10 && proxyResp.headers['transfer-encoding'] !== undefined){
      //filter headers
      var headers = proxyResp.headers;
      delete proxyResp.headers['transfer-encoding'];        
      var buffer = "";
      
      //buffer answer
      proxyResp.addListener('data', function(chunk) {
        buffer += chunk;
      });
      proxyResp.addListener('end', function() {
        headers['Content-length'] = buffer.length;//cancel transfer encoding "chunked"
        response.writeHead(proxyResp.statusCode, headers);
        response.write(buffer, 'binary');
        response.end();
      });
    } else {
      //send headers as received
      response.writeHead(proxyResp.statusCode, proxyResp.headers);
      
      //easy data forward
      proxyResp.addListener('data', function(chunk) {
        response.write(chunk, 'binary');
      });
      proxyResp.addListener('end', function() {
        response.end();
      });
    }
  });

  //proxies to SEND request to real server
  request.addListener('data', function(chunk) {
    proxyReq.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxyReq.end();
  });
}

/**
 * Detect our favorite ES plugins index request and redirect to the
 * Properly connected endpoint.
 *
 * @return true if a redirection took place
 * @return false otherwise
 *
 * Q: Are we getting out of scope?
 * A: Yes a bit. Should we rename this Ze ES Proxy?
 */
function redirects(isUI, request, response) {
  if (isUI) {
    if (request.originalUrl === '/_plugin/head/') {
      //index.html?base_uri=http://node-01.example.com:9200
      var initHead = request.originalUrl + 'index.html?base_uri=' + request.protocol +
        '://' + request.headers.host + '/__es';
      response.redirect(initHead);
      return true;
    } else if (request.originalUrl === '/_plugin/bigdesk/') {
      // index.html?endpoint=http%3A%2F%2F127.0.0.1%3A9201&refresh=3000&connect=true
      var initBigdesk = request.originalUrl + 'index.html?connect=true&endpoint=' + request.protocol +
        '://' + request.headers.host + '/__es';
      response.redirect(initBigdesk);
      return true;
    }
  }
  return false;
}

exports.configureESProxy = function(app, esHost, esPort, esUser, esPassword) {
  app.use("/__es", function(request, response, next) {
    proxyRequest(request, response, esHost, esPort, esUser, esPassword,
      function getProxiedRequestPath(request) {
        return request.url;
      });
  });
  app.use("/_plugin", function(request, response, next) {
    proxyRequest(request, response, esHost, esPort, esUser, esPassword,
      function getProxiedRequestPath(request) {
        return request.originalUrl;
      }, true);
  });
};

/*
Did not quite work with node-http-proxy.
works very well until we point it at elasiticsearch deployed on cloudfoundry...

function configureESProxy(app, esHost, esPort, esUser, esPassword) {
  var httpProxy = require('http-proxy');
  var proxy = new httpProxy.RoutingProxy({changeOrigin: true, enable: {xforward: false}});
  app.use("/__es", function(req, res, next) {
    var buffer = httpProxy.buffer(req);
    if (esUser) {
      var auth = 'Basic ' + new Buffer(esUser + ':' + esPassword).toString('base64');
      req.headers.authorization = auth;
    }
    delete req.headers.cookie;
    proxy.proxyRequest(req, res, {
      host: esHost,
      port: esPort,
      buffer: buffer
    });    
  });
  //Allow observer to modify headers or abort response:
  // proxy.on('proxyResponse', function (req, res, response) {
  //   console.log("[proxyResponse]", response);
  // });
  // proxy.on('proxyError', function () {
  //   console.log("[proxyError]", arguments);
  // });
}

*/

