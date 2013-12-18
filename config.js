module.exports =  {

    ////////////////////////////////////
    // ElasticSearch Backend Settings
    ////////////////////////////////////

    "es_host": "localhost",  // The host of Elastic Search
    "es_port": 9200,  // The port of Elastic Search
    "es_using_ssl": false,  // If the ES is using SSL(https)?
    "es_username":  "",  // The basic authentication user of ES server, leave it blank if no basic auth applied
    "es_password":  "",  // The password of basic authentication of ES server, leave it blank if no basic auth applied.

    ////////////////////////////////////
    // Proxy server configurations
    ////////////////////////////////////

    "listen_port": 9201,  // Which port should we listen to


    ////////////////////////////////////
    // Kibana3 Authentication Settings
    // Currently we support two different auth methods: Google OAuth2 and Basic Auth
    // You can use one of them or both
    ////////////////////////////////////

    // Google OAuth2 settings
    // The client ID of Google OAuth2, leave it empty if you don't want to use OAuth2
    "client_id": "",
    "client_secret": "",  // The client secret of Google OAuth2
    "allowed_emails": ["*"],  // An emails list for the authorized users

    // Basic Authentication Settings
    // The following config is different from the previous one
    // It will be applied on the client who access kibana3.
    // Multiple user/passwd supported
    // The User/Passwd list of basic auth
    // Leave it empty if you don't want to use it
    "basic_auth_users": [
        // {"user": "usr1", "password": "pwd1"},
        // {"user": "usr2", "password": "pwd2"},
    ]
};
