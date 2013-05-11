var http = require('http');
var https = require('https');
var spawn= require('child_process').spawn;
var fs = require('fs');
var url= require('url');

// Check port number
var httpPort = 8888;
var httpsPort = 8889;
var keyFile = 'key.pem';
var certFile = 'cert.pem';

http.createServer(handleRequest).listen(httpPort);
fs.stat(keyFile, function(noSecure) {
    if (!noSecure) {
	var secureOptions = {
	    key : fs.readFileSync(keyFile),
	    cert : fs.readFileSync(certFile)
	};
	https.createServer(secureOptions, handleRequest).listen(httpsPort);
    }
});

// mime types
var mimes= {
    txt: 'text/plain',
    html: 'text/html',
    js: 'text/javascript',
    css: 'text/css',
    jpg: 'image/jpeg',
    png: 'image/png',
    ico: 'image/ico',
    svg: 'image/svg+xml'
}

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
    if (urlParts.pathname=="/createToken") {
	var token = generateCode(6);
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end(token);
	log('createToken '+ token +' '+ urlParts.query.myid);
    }
    else if (req.url.match(/^\/completeDonation\/.*/)) {
	var request= req.url.match(/^\/completeDonation\/(.*)/)[1];
	saveEncryptedFile("donation_"+generateCode(10), timeStamp()+' '+request, function(err) {
	    if (err) {denyAccess(res, "Error"); }
	    else { 
		res.end('OK');
		log(request.replace(/\?.*/,'')+' '+urlParts.query.token);
	    }
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