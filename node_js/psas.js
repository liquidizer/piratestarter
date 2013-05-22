var http= require('http');

function callPsas(serviceName, sendData, callback) {
    var data='';
    var options= {
	host: 'psas.piratenpartei-bayern.de',
	path: '/PirateStarterDB.asmx/'+serviceName,
	method: 'POST',
	headers : {
	    'Content-Type': 'application/x-www-form-urlencoded',
	    'Content-Length': sendData.length
	}
    };
    var req= http.request(options, function(red) {
	//red.setEncoding('utf8');
	red.on('data', function (chunk) {
	    data += chunk;
	});
	red.on('end', function() {
	    if (red.statusCode==200) {
		callback(data);
	    } else {
		console.log('ERROR:', data);
		callback();
	    }
	});
    });
    req.on('error', function(e) {
	console.log('ERROR:', e.message);
	callback();
    });
    req.write(sendData);
    req.end();
}
exports.callPsas= callPsas;

