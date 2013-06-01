$(function() {
    repaint();
    $('select,input,textarea').change(repaint);
});

function repaint() {
    var html= getHtmlCode();
    $('#zweck_input').toggle($('#hasPurpose').val()=='yes');
    $('#code').text(html);
    $('#dci').text(getDciCode);
    if ($('#iframe').html()!=html)
	$('#iframe').html(html);
}

function getHtmlCode() {
    var html='<iframe src="'+getSrc()+'"';

    if ($('#format').val()=='high') {
	html+=' width="280" height="400"';
    } else {
	html+=' width="640" height="200"';
    }
    html+=' scrolling="no" frameborder="0"></iframe>';
    return html;
}

function getDciCode() {
    var code= '[dciframe]'+getSrc();
    if ($('#format').val()=='high') {
	code+=',280,400';
    } else {
	code+=',640,200';
    }
    code+=',0,no[/dciframe]';
    return code;
};

function getSrc() {
    src='https://stuke9.piratenpartei-bayern.de/starter.html';
    if ($('#kennung').val()) {
	src= addParam(src, 'myid='+$('#kennung').val());
    }
    if ($('#bg').val()=='orange') {
	src= addParam(src,'bg=orange');
    }
    if ($('#hasPurpose').val()=='yes') {
	var zwecke= $('#zwecke').val()
	    .split('\n')
	    .map(function(x) { return x.replace(/^\s+|\s*$/g,''); })
	    .filter(function(x) { return x.length>0; })
	    .join('|');
	if (zwecke.length>0)
	    src= addParam(src, 'zwecke='+encodeURI(zwecke));
    }
    if (parseFloat($('#betrag').val())!=25) {
	src= addParam(src, 'betrag='+$('#betrag').val());
    }
    return src;
}

function addParam(html, param) {
    return html + (html.match(/\?/) ? '&' : '?') +param;
}