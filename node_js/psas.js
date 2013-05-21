var http= require('http');

function callPsas(serviceName, callback) {
    var options= {
	host: 'psas.piratenpartei-bayern.de',
	path: '/PirateStarterDB.asmx/'+serviceName,
	method: 'POST'
    };
    var data='';
    var req= http.request(options, function(red) {
	//red.setEncoding('utf8');
	red.on('data', function (chunk) {
	    data += chunk;
	});
	red.on('end', function() {
	    callback(data);
	});
    });
    req.on('error', function(e) {
	console.log('error:', e.message);
	callback();
    });
    req.end();
}
exports.callPsas= callPsas;

