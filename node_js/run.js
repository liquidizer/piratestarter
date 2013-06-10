process.chdir("/var/www/piratestarter/node_js");
var http = require('http');
var spawn= require('child_process').spawn;
var callPsas= require('./psas').callPsas;
var fs = require('fs');
var url= require('url');

var server= http.createServer(handleRequest);
server.listen(8888);

// mime types
var mimes= {
    txt: 'text/plain',
    html: 'text/html',
    js: 'text/javascript',
    css: 'text/css',
    jpg: 'image/jpeg',
    png: 'image/png',
    ico: 'image/ico',
    svg: 'image/svg+xml',
    'ttf': "application/font-truetype",
    otf: "application/font-opentype",
    woff: "application/font-woff" ,
    eot: "application/vnd.ms-fontobject"
}

var btc= '1PiratenNb8U8sfLgw9aRjS11cLLfY4M9S';
var btc_cache='?';

// Generate validation code
function generateCode(len) {
    var chars= ['0', '1', '2', '3', '4', '5','6', '7', '8', '9', 'a', 'B', 'C', 'd', 'E', 'f',
                'g', 'H', 'i', 'k', 'L', 'm','N', 'P', 'r', 't', 'U', 'v', 'W', 'x', 'Y', 'z'];
    var r = Math.floor(Math.random() * chars.length);
    return len == 0 ? "" : generateCode(len - 1) + chars[r];
}

// Run web server
function handleRequest(req, res) {

    // check code if provided
    var urlParts= url.parse(req.url, true);
    if (urlParts.pathname=="/psas/getStatus") {
	callPsas('getStatus', '', function(data) {
	    res.end(data);
	});
    } 
    else if (urlParts.pathname=="/getBitcoinStatus") {
	var options= {
	    host: 'blockchain.info',
	    path: '/de/q/addressbalance/'+btc
	};
	http.get(options, function(red) {
	    var btc_state='';
	    red.on('data', function(chunk) { btc_state+=chunk.toString(); });
	    red.on('end', function() {
		btc_cache= btc_state;
		res.end(btc_cache);
	    });
	}).on('error', function(e) { res.end(btc_cache); });
    } 
    else if (urlParts.pathname=="/createToken") {
	var myid= urlParts.query.myid;
	callPsas('createToken','kennung='+myid,function(result) {
	    var token= result.match(/<string[^>]*>(.*)<\/string>/);
	    res.end(token && token[1]);
	    log('createToken '+ (token && token[1]) +' '+ myid);
	});	
    }
    else if (urlParts.pathname=="/createLastschrift") {
	getPostData(req, function(data) {
	    log('createLastschrift');
	    callPsas('createLastschrift', data, function () {
		log('Sent to Psas.');
	    });
	    saveEncryptedFile("donation_"+generateCode(10), 
			      timeStamp()+' createLastschrift?'+data, 
			      function(err) { 
				  if (err) denyAccess("Error"); else res.end('OK');
			      });
	});
    }
    else if (urlParts.pathname=="/createUeberweisung") {
	getPostData(req, function(data) {
	    log('createUeberweisung');
	    callPsas('createUeberweisung', data, function () {
		log('Sent to Psas.');
	    });
	    sendConfirmationMail('create?'+data);
	    saveEncryptedFile("donation_"+generateCode(10), 
			      timeStamp()+' createUeberweisung?'+data, 
			      function(err) {
				  if (err) denyAccess("Error"); else res.end('OK');
			      });
	});
    }
    else if (urlParts.pathname=="/createBitcoinSpende") {
	getPostData(req, function(data) {
	    log('createBitcoinSpende');
	    saveEncryptedFile("donation_"+generateCode(10), 
			      timeStamp()+' createBitcoinSpende?'+data, 
			      function(err) {
				  if (err) denyAccess("Error"); else res.end('OK');
			      });
	});
    }
    else {
	var filename= urlParts.pathname.replace(/^\//,'') || "test.html";
	serveFile(res, filename);
    }
}

function serveFile(res, filename) {
    var mime= mimes[filename.replace(/[^.]*\./g,'')];
    if (!mime) {
	denyAccess(res, "Access denied");
	return;
    }
    fs.readFile(filename, function(err, data) {
	if (data) {
	    res.writeHead(200, { 'Content-Type': mime || 'text/plain'});
	    res.end(data)
	} else {
	    res.writeHead(404, { 'Content-Type': 'text/plain' });
	    res.end('File does not exist.');
	}
    });
}

function denyAccess(res, message) {
    console.log(message);
    res.writeHead(406, { 'Content-Type': 'text/plain' });
    res.end(message);
}

function saveEncryptedFile(filename, data, callback) {
    encrypt(data, function(crypt) {
	    fs.writeFile(filename, crypt, callback);
	});
}

function getPostData(req, callback) {
    var data='';
    if (req.method!='POST') 
	callback();
    else {
	req.on('data', function(chunk) { data += chunk; });
	req.on('end', function() { callback(data); });
    }
}

function log(message) {
    var logMessage= timeStamp()+' '+message;
    var stream= fs.createWriteStream('log.txt', {flags: 'a', encoding:'utf-8'});
    stream.end(logMessage+'\n');
    console.log(logMessage);
}

function timeStamp() {
    var pad= function(x) {
	return x<10 ? '0'+x : ''+x;
    };
    var now= new Date();
    return now.getFullYear()+'-'+
	pad(now.getMonth()+1)+'-'+
	pad(now.getDate())+'T'+
	pad(now.getHours())+':'+
	pad(now.getMinutes())+':'+
	pad(now.getSeconds());
};

function encrypt(data, callback) {
    var crypt= '';
    var gpg= spawn('gpg', ['-a','-e','-r','piratestarter']);
    gpg.stdout.on('data', function(data) { crypt+=data.toString();  });
    gpg.on('exit', function() { callback(crypt); });
    gpg.stdin.write(data);
    gpg.stdin.end();
}

function sendConfirmationMail(data) {
    var query= url.parse(data, true).query;
    if (query.mail) {
	fs.readFile('mail.txt', function(err, body) {
	    if (body) {
		var data= body.toString();
		data= data.replace(/\${NAME}/, query.name);
		data= data.replace(/\${TOKEN}/, query.token);
		data= data.replace(/\${BETRAG}/, query.betrag);

		var mail= spawn('mail', ['-s','PirateStarter',
					 '-aFrom:piratestarter@piratenpartei-bayern.de',
					 '-aContent-Type: text/plain; charset="UTF-8"',
					 ,query.mail]);
		mail.stdout.on('data', function() {});
		mail.stderr.on('data', function(msg) {console.log(msg.toString());});
		mail.on('error', function(msg) {console.log(msg.toString());});
		mail.stdin.write(data);
		mail.stdin.end();
	    }
	});
    }
}
