$(function() {
    repaint();
    showCode();
    $('select,input,textarea').change(repaint);
    $('#codeoption').change(showCode);
});

function repaint() {
    $('#zweck_input').toggle($('#hasPurpose').val()=='yes');
    $('#code').text(getHtmlCode());
    $('#dci').text(getDciCode());
    $('#uri').text(getSrc());
    $('#iframe1').html(getHtmlCode(true));
    $('#iframe2').html(getHtmlCode(true,'page2'));
}

function getHtmlCode(isLocal, startPage) {
    var html='<iframe src="'+getSrc(isLocal, startPage)+'"';

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

function getSrc(isLocal, startPage) {
    var src= 'starter.html';
    if (!isLocal)
	src= 'https://stuke9.piratenpartei-bayern.de/'+src;
    if (startPage) {
	src= addParam(src, 'start='+startPage);
    }
    var kennung= $('#kennung').val();
    if (isLocal) kennung= 'builder-' + (kennung || 'undefined');
    if (kennung) {
	src= addParam(src, 'myid='+kennung);
    }
    if ($('#bg').val()!='blue') {
	src= addParam(src,'bg='+$('#bg').val());
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

function showCode() {
    $('div.codeoption').hide();
    var option= $('#codeoption').val();
    $('#'+option).show();
}
