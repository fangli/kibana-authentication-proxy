kibana Authentication Proxy
============

Hosts the latest [kibana3](www.elasticsearch.org/overview/kibana/) and elasticsearch behind Google OAuth2 or Basic Authentication with NodeJS and Express.

- A proxy between Elasticsearch, kibana3 and user client
- Support Elasticsearch which protected by basic authentication, only kibana-authentication-proxy knows the user/passwd
- Compatible with the latest kibana3
- Support Google OAuth2 and Basic Authentication(multiple users supported) to authorize users
- Inspired by and based on [kibana-proxy](https://github.com/hmalphettes/kibana-proxy), most of the proxy libraries were written by them

*We NO LONGER support third-party plugins such as `Bigdesk` or `Head` since it's hard to test and maintain the dependency*

Installation
=====

```
# git clone https://github.com/fangli/kibana-authentication-proxy
# git submodule init
# git submodule update
# npm install

// Then you can edit the config.js as the configuration section
// and run!
# node app.js
```

Configuration
=============

All settings are placed in the /config.js file, hack it as you go.

### Elasticsearch backend onfigurations

- ``es_host``:  *The host of ElasticSearch*
- ``es_port``:  *The port of ElasticSearch*
- ``es_using_ssl``:  *If the ES is using SSL(https)?*
- ``es_username``:  *(optional) The basic authentication user of ES server, leave it blank if no basic auth applied*
- ``es_password``:  *(optional) The password of basic authentication of ES server, leave it blank if no basic auth applied*

### Client settings

- ``listen_port``:  *The listen port of kibana3*

### Client authentication settings

We currently support two auth methods: Google OAuth2 and BasicAuth, you can use one of them or both of them. it depends on the configuration you have.

*1. Google OAuth2*

- ``client_id``:  *The client ID of Google OAuth2, leave empty if you don't want to use it*
- ``client_secret``: *The client secret of Google OAuth2*
- ``allowed_emails``: *An emails list for the authorized users, should like ["a@b.com", "\*@c.com", "\*"]*

*2. Basic Authentication*

- ``basic_auth_users``:  *A list of user/passwd, see the comments in config.js for help. leave empty if you won't use it*

Resources
=========
- The original proxy project of [kibana-proxy](https://github.com/hmalphettes/kibana-proxy)
- [Kibana 3](http://www.elasticsearch.org/overview/kibana/) and [Elasticsearch](https://github.com/elasticsearch/elasticsearch)


Contributing
============
- Fork it
- Create your feature branch (git checkout -b my-new-feature)
- Commit your changes (git commit -am 'Add some feature')
- Push to the branch (git push origin my-new-feature)
- Create new Pull Request


Releases
========
- Fixed bug: Deprecated function alert of connect3
- Added basic auth
- Fixed bug: use new config for kibana3
- Initial


License
=======
kibana Authentication Proxy is freely distributable under the terms of the MIT license.

Copyright (c) 2013 Fang Li, Funplus Game

See LICENCE for details.
