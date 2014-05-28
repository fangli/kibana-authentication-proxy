/**
 * AD authentication
 * 
 */

var ActiveDirectory = require('activedirectory');
var util = require('util');

exports.configureADAuth = function(express, app, config) {
	if (!config.enable_adauth) {
		console.log('Warning: No AD authentication present');
		return;
	} else {
		console.log('Info: AD Authentication applied');
	}
	
	var proto;
	var user_valid = false;
	
	if (config.ad_ssl) {		
		proto = 'ldaps';
		port  = 636;
	} else {
		proto = 'ldap';
		port  = 389;
	}

	app.use(express.basicAuth(function(user, pass) {
		if(express.session.ad_user)
			return true;
			
		user = util.format('%s@%s', user, config.ad_fqdn);
		url  = util.format('%s://%s:%s', proto, config.ad_fqdn, config.ad_port);
		var ad = new ActiveDirectory({url: url,
		                              baseDN: config.base_dn,
		                              username: user,
		                              password: pass });				
		
		ad.authenticate(user, pass, function(err, auth) {
			  if (err) {
				  console.log(util.format("Error: User '%s' failed to authenticate. Error: %s", user, err.name));
				  return false;
			  }
			  
			  if (auth) {
			    ad.isUserMemberOf(user, config.member_of, function(err, is_member) {
			    	  if (err) {
			    	    console.log(util.format("Error: Failed looking up group membership for user '%s'. Error: %s", user, JSON.stringify(err)));
			    	  }
			    	  
			    	  if(is_member) {
			    		  console.log(util.format("Info: AD Authentication for user '%s' was successful", user));
			    		  express.session.ad_user = user;
			    		  user_valid = true;			    		  
			    	  } else {
			    		  console.log(util.format("Error: User '%s' not member of group '%s'", user, config.member_of));
			    	  }
			    });
			  } else {
				  console.log(util.format("Error: User '%s' failed to authenticate", user));
			  }
		});
		
		return user_valid;
	}));	
};

