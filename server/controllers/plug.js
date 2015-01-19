var plug = require('../lib/plug.js');
var async = require('async');
File = require('../models/files.js');
Note = require('../models/notes.js');

var init = false; //used to test plugDB connection

module.exports.main = function (req, res) {
    res.render('index.jade'), function(err, html) {
        res.send(200, html);
};
/*    plug.init( function() {
    	plug.close();
    });
*/
    /*plug.init(function(){
		deleteAllFiles(createNotes, 2);
		getNotes(insertPlug, target);
	});*/

};

module.exports.init = function(req, res) {
    if(init) {
        console.log('PlugDb already initialized');
        res.redirect('back');
    }
    plug.init( function(err) {
        var msg;
        if(err){
            console.log(err);
            msg = "Init failed";
        }
        else{
            init = true;
            msg = "Init succeeded";
        }
        //res.send(200, msg);
        console.log(msg);    
        res.render('index.jade', {status: msg}, function(err, html){
            res.send(200, html);
        });
    });
    
};

module.exports.insert = function(req, res) {
    if(!init){
        console.log("PlugDB not initialized");
        res.redirect('back');
    }
	deleteAllFiles(createNotes, 2);
	getNotes(insertPlug);

}

module.exports.close = function(req, res) {
    if(!init){
        console.log("PlugDB is not initialized");
        res.redirect('back');
    }
    plug.close( function(err) {
        if(err){
            msg = "Closing failed";
        }
        else{
            msg = "Closed"
        }
        console.log(msg);
        res.render('index.jade', {status: msg}, function(err, html){
            res.send(200, html);
        });
    });
};

var createFiles = function(nDocs) {
	for(var i=0;i<nDocs;i++){
		var docName = "gen_doc_" + i;
		File.create({"name":"test", "content":"doc"}, function(err, file) {
			if(err)
	    		console.error(err);
	    	else
	    		log.raw('file created : ' + file.id);
		});
	}
};

var createNotes = function(nNotes) {
	for(var i=0;i<nNotes;i++){
		var noteName = "gen_note " + i;
		Note.create({"title":noteName, "parent_id":"tree-node-all", "path":noteName, "version":1, "content":"coucou"}, function(err, note) {
			if(err)
	    		console.error(err);
	    	else
	    		log.raw('note created : ' + note.id);
		});
	}
};

var getFiles = function(callback, target) {
	// Getting request results
	File.request("all", function (err, files) {
		if(err)
			console.error(err);
		else{
			var ids = [];
		    for(var i=0;i<files.length;i++){
		    	ids.push(files[i].id);
		    }
	   		callback(ids, target);
	   	}
	});
};

var getNotes = function(callback, target) {
	// Getting request results
	Note.request("all", function (err, files) {
		if(err)
			console.error(err);
		else{
			var ids = [];
		    for(var i=0;i<files.length;i++){
		    	ids.push(files[i].id);
		    }
	   		callback(ids, target);
	   	}
	});
};

var insertPlug = function(ids) {
	log.raw("insert in plug: " + ids);
	plug.insert(ids, function(){
		replicateDocs(ids);
		plug.close();
	});
};

var deleteAllFiles = function(callback, nDocs) {
	File.requestDestroy("all", function(err) {
		if(err)
    		log.raw(err);
    	else
    		log.raw("all files deleted");
    	callback(nDocs);
	});
};

var deleteAllNotes = function(callback, nDocs) {
	Note.requestDestroy("all", function(err) {
		if(err)
    		log.raw(err);
    	else
    		log.raw("all notes deleted");
    	callback(nDocs);
	});
};

var replicateDocs = function(ids, target) {
	var data = { 
		source: "cozy", 
		target: "http://192.168.0.20:5984/cozy_backup",
		doc_ids: ids 
	};
	return couchClient.post("_replicate", data, function(err, res, body){
		if(err || !body.ok)
			return handleError(err, body, "Backup failed ");
		else{
			log.raw('Backup suceeded \o/');
			log.raw(body);
			return process.exit(1);
		}
	});
};

var generateKey = function(){
	return crypto.randomBytes(256, function(ex, buf) {
  		if (ex) throw ex;
  		return buf;
	});
};



var handleError = function(err, body, msg) {
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



