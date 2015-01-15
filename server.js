// Generate a new instance of express server.
var express = require('express')
  , http = require('http')
  , request = require('request-json-light')
  , plug = require('./lib/plug.js')
  , log = require('printit')()
  , Schema = require('jugglingdb').Schema;

var db = new Schema('cozy-adapter', { url: 'http://localhost:9101/' });
var app = express();
var couchUrl = "http://127.0.0.1:5985/";
var couchClient = request.newClient(couchUrl);

var target = "http://admin1:admin@localhost:5984/mysharedb";

// The data system listens to localhost:9101
//dataSystem = new Client('http://localhost:9101');


// In production we must authentificate the application
/*if(process.env.NODE_ENV === 'production') {
  user = process.env.NAME;
  password = process.env.TOKEN;
  dataSystem.setBasicAuth(user, password);
}*/




/* This will allow Cozy to run your app smoothly but
 it won't break other execution environment */
var port = process.env.PORT || 9250;
var host = process.env.HOST || "127.0.0.1";



/*
// The request must be created first, let's say it is
var generateDocs = function(nDocs) {

	for(var i=0;i<nDocs;i++)
	{
		//var doc = "doc " + i;
		var data = {
			"docType" : "file",
			"doc" : "testy"
		};
		post(data);
	}
}

var post = function(data) {
	dataSystem.post('data/', data, function(err, res, body) {
	  if(err !== null || (res !== null && res.statusCode != 201)) {
	    if(res !== null) 
	    	code = res.statusCode; 
	    else 
	    	code = "no status code";
	    console.log("An error occurred -- [" + code + "] " + err);
	  }
	  else {
	    console.log("created doc : ");
	    console.log(body);
	  }
	});
};

var listDocs = function() {
	dataSystem.post('/request/file/all/', {}, function(err, res, body) {
	  if(err !== null || (res !== null && res.statusCode != 200)) {
	    if(res !== null) {code = res.statusCode;} else { code = "no status code"; }
	    console.log("An error occurred -- [" + code + "] " + err);
	  }
	  else {
	    console.log("List of all the files");
	    var ids = [];
	    for(var i=0;i<body.length;i++){
	    	ids.push(body[i].id);
	    	console.log("id : " + ids[i]);
	    }
	    return ids;
	  }
	});
};

var deleteDoc = function(id) {
	dataSystem.delete('/data/' + id, function(err, res, body) {
	  if(err !== null || (res !== null && res.statusCode != 204)) {
	    if(res !== null) {code = res.statusCode;} else { code = "no status code"; }
	    console.log("An error occurred -- [" + code + "] " + err);
	  }
	  else {
	 	console.log("doc with id " + id);
	  }
	});
};
*/

File = db.define('File', {
  "id": String,
  "content": { "type": String, "default": ""}
});

// Starts the server itself
var server = http.createServer(app).listen(port, host, function() {
  	console.log("Server listening to %s:%d within %s environment",
              host, port, app.get('env'));

	plug.init(function(){
		//deleteAllFiles();
		createFiles(2);
		getFiles(insertFiles);
	});
	

});

// At the root of your website, we show the index.html page
app.get('/', function(req, res) {
  res.sendfile('./public/index.html');
  
  //plug.start();
});


var createFiles = function(nDocs) {
	for(var i=0;i<nDocs;i++){
		File.create({"content":"doc"}, function(err, file) {
			if(err)
	    		console.error(err);
	    	else
	    		console.log('file created : ' + file.id);
		});
	}
};

var getFiles = function(callback) {
	// Getting request results
	File.request("all", function (err, files) {
		if(err)
			console.error(err);
		else{
			var res = [];
		    for(var i=0;i<files.length;i++){
		    	res.push(files[i].id);
		    }
	   		callback(res);
	   	}
	});
};

var insertFiles = function(ids) {
	console.log(ids);
	plug.insert(ids, function(){
		replicateDocs(ids);
		plug.close();
	});
};

var deleteAllFiles = function() {
	File.requestDestroy("all", function(err) {
		if(err)
    		console.log(err);
    	else
    		console.log("all files deleted");
	});
};

var replicateDocs = function(ids) {
	var data = { 
		source: "cozy", 
		target: "http://gara.ovh:5984/cozy_backup",
		doc_ids: ids 
	};
		/*'{"source": "cozy",
		"target": "'+ target+'",
		"doc_ids" : "' + ids + '"
		}';
		*/

	//configureCouchClient();

	return couchClient.post("_replicate", data, function(err, res, body){
		if(err || !body.ok)
			return handleError(err, body, "Backup failed ");
		else{
			console.log('Backup suceeded \o/');
			log.raw(body);
			return process.exit(1);
		}
	});
}

var configureCouchClient = function(callback) {
    var password, username, _ref;
    _ref = getAuthCouchdb(), username = _ref[0], password = _ref[1];
    return couchClient.setBasicAuth(username, password);
  };

var  handleError = function(err, body, msg) {
    log.error("An error occured:");
    if (err) {
      log.raw(err);
    }
    log.raw(msg);
    if (body != null) {
      if (body.msg != null) {
        log.raw(body.msg);
      } else if (body.error != null) {
        if (body.error.message != null) {
          log.raw(body.error.message);
        }
        if (body.message != null) {
          log.raw(body.message);
        }
        if (body.error.result != null) {
          log.raw(body.error.result);
        }
        if (body.error.code != null) {
          log.raw("Request error code " + body.error.code);
        }
        if (body.error.blame != null) {
          log.raw(body.error.blame);
        }
        if (typeof body.error === "string") {
          log.raw(body.error);
        }
        if (body.reason != null )
        	log.raw(body.reason);
      } else {
        log.raw(body);
      }
    }
    return process.exit(1);
  };