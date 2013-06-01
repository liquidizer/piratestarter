$(function() {
    repaint();
    $('select,input,textarea').change(repaint);
});

function repaint() {
    var html= getCode();
    $('#zweck_input').toggle($('#hasPurpose').val()=='yes');
    $('#code').text(html);
    if ($('#iframe').html()!=html)
	$('#iframe').html(html);
}

function getCode() {
    var html='<iframe src="https://stuke9.piratenpartei-bayern.de/starter.html';
    if ($('#kennung').val()) {
	html= addParam(html, 'myid='+$('#kennung').val());
    }
    if ($('#bg').val()=='orange') {
	html= addParam(html,'bg=orange');
    }
    if ($('#hasPurpose').val()=='yes') {
	var zwecke= $('#zwecke').val()
	    .split('\n')
	    .map(function(x) { return x.replace(/^\s+|\s*$/g,''); })
	    .filter(function(x) { return x.length>0; })
	    .join('|');
	if (zwecke.length>0)
	    html= addParam(html, 'zwecke='+encodeURI(zwecke));
    }
    html+='"';

    if ($('#format').val()=='high') {
	html+=' width="280" height="400"';
    } else {
	html+=' width="650" height="200"';
    }
    html+=' scrolling="no" frameborder="0"></iframe>';
    return html;
}

function addParam(html, param) {
    return html + (html.match(/\?/) ? '&' : '?') +param;
}