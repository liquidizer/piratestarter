process.chdir("/var/www/piratestarter/node_js");
var http = require('http');
var https = require('https');
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
var twtCache={};

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
    else if (urlParts.pathname=="/paypalcommit") {
	log('paypalcommit called');
	if (req.method=='POST') {
  	    getPostData(req, function(data) {
	    	log('Paypal commit');
	    	saveEncryptedFile("paypal_"+generateCode(10), data, function() {});
		res.end();
		var params= url.parse('x?'+unescape(data), true).query;
		var psasData=
		    'item_name='+params.item_name+
		    '&transaction_subject='+params.transaction_subject+
		    '&payment_status='+params.payment_status+
		    '&payer_email='+params.payer_email+
		    '&first_name='+params.first_name+
		    '&last_name='+params.last_name+
		    '&mc_gross='+params.mc_gross+
		    '&mc_fee='+params.mc_fee+
		    '&mc_currency='+params.mc_currency+
		    '&address_street='+params.address_street+
		    '&address_country='+params.address_country+
		    '&address_zip='+params.address_zip+
		    '&address_city='+params.address_city+
		    '&address_name='+params.address_name+
		    '&address_status='+params.address_status;
		callPsas('commitPayPal', encodeURI(psasData), function () {});
	    });
	} else {
	    res.end();
	}
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
    else if (urlParts.pathname=="/getBotschaft") {
	callPsas('getBotschaft', '', function (data) {
	    res.end(data);
	});
    }
    else if (urlParts.pathname=="/getTwitterImg") {
	var name= urlParts.query['name'];
	if (twtCache[name]) {
	    res.end(twtCache[name]);
	} else {
	    var options= {
		host: 'twitter.com',
		path: '/'+name
	    };
	    var con=https.request(options, function(red) {
		var data='';
		red.on('data', function(chunk) { data+=chunk.toString(); });
		red.on('end', function() {
		    var imgMatch= data.match(/src=\"(https:\/\/si0.twimg.com\/profile_images\/[^\"]*)/);
		    var img='';
		    if (imgMatch)
			img= imgMatch[1];
		    else
			log('invalid twitter image for '+name);
		    twtCache[name]=img;
		    res.end(img);
		});
	    }).on('error', function(e) { res.end(e); });
	    con.end();
	}
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
	    callPsas('createLastschrift', data, function (psas) {
		var link= getXMLParam(psas, 'Link');
		sendConfirmationMail('create?'+data, link, 'mail2.txt');
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
	    callPsas('createUeberweisung', data, function (psas) {
		var link= getXMLParam(psas, 'Link');
		sendConfirmationMail('create?'+data, link, 'mail1.txt');
	    });
	    saveEncryptedFile("donation_"+generateCode(10), 
			      timeStamp()+' createUeberweisung?'+data, 
			      function(err) {
				  if (err) denyAccess("Error"); else res.end('OK');
			      });
	});
    }
    else if (urlParts.pathname=="/createPaypal") {
	getPostData(req, function(data) {
	    callPsas('createPayPal', data, function (psas) {
		var link= getXMLParam(psas, 'Link');
		sendConfirmationMail('create?'+data, link, 'mail3.txt');
	    });
	    saveEncryptedFile("donation_"+generateCode(10), 
			      timeStamp()+' createPayPal?'+data, 
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
	    res.writeHead(200, { 
		'Content-Type': mime,
		'Cache-Control': 'max-age=300'
	    });
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

function sendConfirmationMail(data, link, mailfile) {
    var query= url.parse(data, true).query;
    if (query.mail) {
	fs.readFile(mailfile, function(err, body) {
	    if (body) {
		var data= body.toString();
		data= data.replace(/\${NAME}/g, query.name);
		data= data.replace(/\${TOKEN}/g, query.token);
		data= data.replace(/\${BETRAG}/g, query.betrag);
		data= data.replace(/\${MESSAGETOKEN}/g, link);

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
    log('Confirmed.');
}

// Parse an xml parameter
function getXMLParam(response, name) {
    var m=response.match('<'+name+'>(.*)</'+name+'>');
    return m ? m[1] : undefined;
}
