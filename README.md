kibana-proxy
============

Hosts [Kibana 3](http://three.kibana.org) as a nodejs express application.

Features:
- Proxy access to Elasticsearch: all elasticsearch queries are sent through the express application.
- Optional Google OAuth2 login with (passport)[http://passport.org].
- Support for Elasticsearch protected by basic-authentication: only the express app will know about the username and password.


Usage
=====

```
git clone git@github.com:hmalphettes/Old-Kibana-2-ruby-sinatra.git
git submodule init
git submodule update
npm install
node app.js &
open http://localhost:3003
```

Configuration
=============
Configuration is done via environment variables:
- `ES_URL`: example: `http://user:password@your-elasticsearch.local`; default: `http://localhost:9200`
- `PORT`: the port where the app is run, default to 3003
- `APP_ID`, `APP_SECRET`: Google OAuth2 config. Optional.
- `AUTHORIZED_EMAILS`: define what authenticated email is granted access; a comma separated listed of patterns; defaults to '*'. each pattern must be one-of:
    - '*': anything,
    -- '*@domain': any email in the domain
    -- 'an@email': a specific email.

Push to cloudfoundry.com
========================
- Copy the manifest-example.yml file as manifest-real.yml provided as an example.
- Change the name of the app and elasticsearch URL.
- `vmc push --manifest-real.yml`.
