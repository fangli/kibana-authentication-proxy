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
    // Which port listen to
    "listen_port": 9201,
    // Control HTTP max-Age header. Whether the browser cache static kibana files or not?
    // 0 for no-cache, unit in millisecond, default to 0
    // We strongly recommand you set to a larger number such as 2592000000(a month) to get a better loading speed
    "brower_cache_maxage": 0,
    // Enable SSL protocol
    "enable_ssl_port": false,
        // The following settings are valid only when enable_ssl_port is true
        "listen_port_ssl": 4443,
        // Use absolute path for the key file
        "ssl_key_file": "POINT_TO_YOUR_SSL_KEY",
        // Use absolute path for the certification file
        "ssl_cert_file": "POINT_TO_YOUR_SSL_CERT",

    // The ES index for saving kibana dashboards
    // default to "kibana-int"
    // With the default configuration, all users will use the same index for kibana dashboards settings,
    // But we support using different kibana settings for each user.
    // If you want to use different kibana indices for individual users, use %user% instead of the real username
    // Since we support multiple authentication types(google, cas or basic), you must decide which one you gonna use.

    // Bad English:D
    // For example:
    // Config "kibana_es_index": "kibana-int-for-%user%", "which_auth_type_for_kibana_index": "basic"
    // will use kibana index settings like "kibana-int-for-demo1", "kibana-int-for-demo2" for user demo1 and demo2.
    // in this case, if you enabled both Google Oauth2 and BasicAuth, and the username of BasicAuth is the boss.
    "kibana_es_index": "kibana-int", // "kibana-int-%user%"
    "which_auth_type_for_kibana_index": "cas", // google, cas or basic

    ////////////////////////////////////
    // Security Configurations
    ////////////////////////////////////
    // Cookies secret
    // Please change the following secret randomly for security.
    "cookie_secret": "REPLACE_WITH_A_RANDOM_STRING_PLEASE",


    ////////////////////////////////////
    // Kibana3 Authentication Settings
    // Currently we support 3 different auth methods: Google OAuth2, Basic Auth and CAS SSO.
    // You can use one of them or both
    ////////////////////////////////////


    // =================================
    // Google OAuth2 settings
    // Enable? true or false
    // When set to false, google OAuth will not be applied.
    "enable_google_oauth": false,
        // We use the following redirect URI:
        // http://YOUR-KIBANA-SITE:[listen_port]/auth/google/callback
        // Please add it in the google developers console first.
        // The client ID of Google OAuth2
        "client_id": "",
        "client_secret": "",  // The client secret of Google OAuth2
        "allowed_emails": ["*"],  // An emails list for the authorized users


    // =================================
    // Basic Authentication Settings
    // The following config is different from the previous basic auth settings.
    // It will be applied on the client who access kibana3.
    // Enable? true or false
    "enable_basic_auth": false,
        // Multiple user/passwd supported
        // The User&Passwd list for basic auth
        "basic_auth_users": [
            {"user": "demo1", "password": "pwd1"},
            {"user": "demo2", "password": "pwd2"},
        ],


    // =================================
    // CAS SSO Login
    // Enable? true or false
    "enable_cas_auth": false,
        // Point to the CAS authentication URL
        "cas_server_url": "https://point-to-the-cas-server/cas",
        // CAS protocol version, one of 1.0 or 2.0
        "cas_protocol_version": 1.0,
};
