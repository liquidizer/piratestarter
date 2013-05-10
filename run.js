var http = require('http');
var fs = require('fs');
var url= require('url');

// Check port number
var port = process.env.PORT || 8888;

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
http.createServer(function(req, res) {

    // check code if provided
    var urlParts= url.parse(req.url, true);
    if (urlParts.pathname=="/createToken") {
	var token = generateCode(8);
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end(token);
	log('createToken '+ token +' '+ urlParts.query.myid);
    }
    else if (req.url.match(/^\/completeDonation\/.*/)) {
	var request= req.url.match(/^\/completeDonation\/(.*)/)[1];
	saveFile("donation_"+generateCode(10), request, function(err) {
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
}).listen(port);

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

function saveFile(filename, data, callback) {
    console.log(data);
    fs.writeFile(filename, data+'\n', callback);
}

function log(message) {
    var logMessage= timeStamp()+': '+message;
    var stream= fs.createWriteStream('log.txt', {flags: 'a', encoding:'utf-8'});
    stream.end(logMessage+'\n');
    console.log(logMessage);
}

function timeStamp() {
    var now= new Date();
    return now.getFullYear()+'-'+
	(now.getMonth()+1)+'-'+
	now.getDate()+'T'+
	now.getHours()+':'+
	now.getMinutes()+':'+
	now.getSeconds();
};
