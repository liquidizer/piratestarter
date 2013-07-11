var pshistory=[];
var token= undefined;
var myid= undefined;
var amount= 25;

$(function() {
    initLayout();
    processUrlParameters();
    $('.nextButton').click(function(evt) { 
	var to= $(evt.target).attr('to');
	if (to.match(/\(\)$/)) to= eval(to);
	showPage(to, "left", "right"); 
    });
    $('.backButton').click(function() {
	pshistory.pop();
	showPage(pshistory.pop() || "page1_plain", "right", "left");
    });
    $('html').keyup(validatePage);
    $('html').click(validatePage);
    $('#currency').change(function() {
	$('#betrag').val(($(this).val()=="eur") ? amount : localizeDecimal(amount/100, 4));
    });
});

function initLayout() {
    var width= window.innerWidth;
    var height= window.innerHeight;
    if (width > height) {
	$('body').addClass('wide');
 	$('.ifhigh').remove();
	$('#header-img').attr('src','img/header-wide.png');
    } else {
	$('body').addClass('high');
        $('.ifwide').remove();
	$('#header-img').attr('src','img/header-high.png');
    }
    $('[data-replace]').each(function(index, elt) {
	$(elt).append($('#'+$(elt).attr('data-replace')));
    });
    $('#background').attr('width',width).attr('height',height);   
    initCheckBoxes();
}

function initCheckBoxes() {
    $('input.janein + label')
	.click(function() {$(this).prev().click();})
	.hover(function() {$(this).prev().addClass('hover');},
	      function() {$(this).prev().removeClass('hover');});
    $('#anonym').change(function() {
	if ($('#anonym')[0].checked) {
	    $('#mitsteuer')[0].checked= false;
	    $('#mitbotschaft')[0].checked= false;
	}
    });
    $('#mitbotschaft,#mitsteuer').change(function() {
	if ($('#mitbotschaft')[0].checked || $('#mitsteuer')[0].checked) {
	    $('#anonym')[0].checked= false;
	}
    });
}

function processUrlParameters() {
    var urlId= location.search.match('[?&]myid=([^&]*)');
    if (urlId) {
	myid= urlId[1];
    }
    var urlParamZweck= location.search.match('[?&]zwecke=([^&]*)');
    if (urlParamZweck) {
	var zwecke= decodeURI(urlParamZweck[1]).split(/,|\|/);
	zwecke.forEach(function (zweck) {
	    $('#zweck').append("<option value='"+zweck+"'>"+zweck+"</option>");
	});
	$('#zweck').val(zwecke[0]);
    } else {
	$('#zweck').hide()
	$('#zweck').after("Wahlkampf Bayern");
    }
    var urlParamBetrag= location.search.match('[?&]betrag=([^&]*)');
    if (urlParamBetrag) {
	amount= parseFloat(urlParamBetrag[1]);
	$('#betrag').val(urlParamBetrag[1]);
    }
    $('#background').attr('src', function() {
	var urlParamBG= location.search.match('[?&]bg=([^&]*)');
	if (urlParamBG) {
	    if (urlParamBG[1].match(/^o/))
		return 'img/bg-wide-orange.png';
	    else if (urlParamBG[1].match(/^w/))
		return '';
	    else
		return 'img/bg-wide-blue.png';

	} else {
	    if (myid=="PS-Homepage")
		return 'img/bg-wide-orange.png';
	    else 
		return 'img/bg-wide-blue.png';
	}
    }());
    var urlParamStartPage= location.search.match('[?&]start=([^&]*)');
    if (urlParamStartPage) {
	showPage(urlParamStartPage[1], "init");
    } else {
	if (Math.random()<0.5)
	    showPage("page1_plain", "init");
	else
	    showPage("page1_twitter", "init");
    }
}

function showPage(pageid, dir1, dir2) {
    pshistory.push(pageid);
    var mypage= $("#"+pageid);
    if (mypage.length==0)
	console.log('page not found: ', pageid);
    if (dir1=="init") {
	$(".page").hide();
	mypage.fadeIn(500);
    }
    else {
	$(".page:visible").hide("slide", {direction: dir1}, 300);
	mypage.show("slide", {direction: dir2}, 400);
    }
    $(':focus').blur();
    initPage(mypage);
    if (window['init_'+pageid]) {
	window['init_'+pageid]();
    }
 }

function initPage(mypage) {
    mypage.find("span").each(function() {
       var name=$(this).attr("name");
       var type=$(this).attr("type");
       var value=0;
       if (type=="select") {
	   value= $("select[name="+name+"] option").filter(":selected").text();
       } 
       else if (type=="input") {
	   value= $("input[name="+name+"]").val();
       }
       else if (type=="token") {
	   value= token;
       } 
	if (value!==0)
	    $(this).text(value);
    });
}

function validatePage() {
    var pageid= $('.page:visible').attr('id');
    var valid= true;
    $('#'+pageid+' *[data-required]').each(function (i,elt) {
	valid= valid && ($(elt).val()!="")
    });
    $('#'+pageid).toggleClass("valid", valid);
    $('#'+pageid).toggleClass("invalid", !valid);
}

function betragMehr(factor) {
    var newVal= (myFloat($('#betrag').val())*factor);
    if ($('#currency').val()=="eur")
	$('#betrag').val(newVal.toFixed(0));
    else
	$('#betrag').val(localizeDecimal(newVal,4));
}

function init_page1_twitter() {
    initStatus(false);

    $.get('/getBotschaft', function(msg) {
	var twitter= getParam(msg, 'TwitterName').replace(/^@/,'');
	var text= getParam(msg, 'Spruch');
	$('#spruch').text('@'+twitter+': '+text);
	$('#follow').attr('href','https://twitter.com/'+twitter);
	$('#twtlink').attr('href','https://twitter.com/'+twitter);
	// twitter include code
	!function(d,s,id){
	    var js,fjs=d.getElementsByTagName(s)[0],
	    p=/^http:/.test(d.location)?'http':'https';
	    if(!d.getElementById(id)){
		js=d.createElement(s);
		js.id=id;js.src=p+'://platform.twitter.com/widgets.js';
		fjs.parentNode.insertBefore(js,fjs);
	    }
	}
	(document, 'script', 'twitter-wjs');
	$.get('/getTwitterImg?name='+twitter, function(msg) {
	    $('#twtimg').attr('src', msg);
	});
    });
}

function init_page1_plain() {
    initStatus(true);
}

function init_page2() {
    if (!token)
	$.get('/createToken?myid='+myid, function(msg) { token= msg; });
}

function init_page3() {
    $('.ifeur').toggle($('#currency').val()=="eur");
}

function pageTransferOrBtc() {
    if ($('#anonym').is(':checked'))
	return ($('#currency').val()=="eur") ? "ueberweisen" : "bitcoin4";
    else
	return "page4";
}

function init_lastschrift2() {
    var spender= $('#spender');
    if (spender.val()=="")
	spender.val($('#inhaber').val());
}

function page5or4a() {
    console.log($('#mid').val());
    return $('#mid').val()=="" ? "page4a" : page5orBtc();
}
function page5orBtc() {
    return ($('#currency').val()=="eur") ? "page5" : 
	($('#mitsteuer').is(':checked') ? "bitcoin3" : "bitcoin4");
}

function init_lastschrift_danke() {
    $.post('createLastschrift','token='+token +
	   '&name='+encodeURI($('#spender').val()) +
	   '&mnr='+encodeURI($('#mid').val() || 0) +
	   '&mail='+encodeURI($('#email').val()) +
	   '&betrag='+encodeURI(myFloat($('#betrag').val()))+
	   '&inhaber='+encodeURI($('#inhaber').val()) +
	   '&kto='+encodeURI($('#konto').val()) +
	   '&blz='+encodeURI($('#blz').val()) +
	   '&zweck='+encodeURI($('#zweck').val()) +
	   '&adresse='+encodeURI($('#adresse').val()) +
	   '&bescheinigung='+encodeURI($('#mitsteuer').is(':checked')), 
	   function(response) {
	       if (response!="OK") alert('Fehlgeschlagen');
	   });
}

function init_ueberweisen() {
    console.log('ueberweisen');
    $.post('/createUeberweisung','token='+token +
	   '&mnr='+encodeURI($('#mid').val() || 0) +
	   '&mail='+encodeURI($('#email').val()) +
	   '&zweck='+encodeURI($('#zweck').val()) +
	   '&betrag='+encodeURI(myFloat($('#betrag').val())) +
	   '&name='+encodeURI($('#spender').val()) +
	   '&adresse='+encodeURI($('#adresse').val()) +
	   '&bescheinigung='+encodeURI($('#mitsteuer').is(':checked')),
	   function(response) {
	       if (response!="OK") alert('Fehlgeschlagen');
	   });
}

function init_bitcoin4() {
    $.post('/createBitcoinSpende','token='+token +
	   '&mnr='+encodeURI($('#mid').val() || 0) +
	   '&zweck='+ encodeURI($('#zweck').val()) +
	   '&betrag='+encodeURI(myFloat($('#betrag').val())) +
	   '&name='+encodeURI($('#spender').val()) +
	   '&adresse='+encodeURI($('#adresse').val()) +
	   '&bescheinigung='+encodeURI($('#mitsteuer').is(':checked')) +
	   '&btcfrom=' + encodeURI($('#btc_identity').val()),
	   function(response) {
	       if (response!="OK") alert('Fehlgeschlagen');
	   });
}

function init_bitcoin1() {
    var betrag= myFloat($('#betrag').val());
    var bc= $('#bitcoinuri');
    bc.attr('href',bc.attr('href').replace(/amount=.*/,'amount='+betrag+'X8'));
}

function init_paypal3() {
    var betrag= myFloat($('#betrag').val());
    var zweck= $('#zweck option').filter(':selected').text();
    $('#pp_icon_amount').val(betrag);
    $('#pp_icon_item_name').val('www.piratestarter.de '+token+' '+zweck);
    var commission= betrag*0.012 + 0.35;
    $('#paypalcom').text(localizeDecimal(commission));

    $.post('/createPaypal','token='+token +
	   '&mnr='+encodeURI($('#mid').val() || 0) +
	   '&mail='+encodeURI($('#email').val()) +
	   '&zweck='+encodeURI($('#zweck').val()) +
	   '&betrag='+encodeURI(betrag) +
	   '&name='+encodeURI($('#spender').val()) +
	   '&adresse='+encodeURI($('#adresse').val()) +
	   '&bescheinigung='+encodeURI($('#mitsteuer').is(':checked')),
	   function(response) {
	       if (response!="OK") alert('Fehlgeschlagen');
	   });
}

function initStatus(doBitcoins) {
    token= undefined;
    $.get('/psas/getStatus', function(response) {
	$('.sumDonations').text(localizeDecimal(getParam(response,'Spenden')));
	$('.sumPromised').text(localizeDecimal(getParam(response,'Zusagen')));
    });
    if (doBitcoins) {
	$.get('/getBitcoinStatus', function(response) {
	    var btc= parseFloat(response)/1e8;
	    $('.sumBitcoins').text(localizeDecimal(btc,4));
	});
    }
}

function localizeDecimal(x, digits) {
    x= parseFloat(x).toFixed(digits || 2);
    x= x.replace('\.',',');
    x= x.replace(/(\d)(\d\d\d),/,'$1.$2,');
    return x;
}

function myFloat(x) {
    if (x.match(/,([0-9]*)$/)) {
	x= x.replace(/\./,'');
	x= x.replace(/,([0-9]*)$/,'.$1');
    }
    return parseFloat(x);
}

function getParam(response, name) {
    var m=response.match('<'+name+'>(.*)</'+name+'>');
    return m ? m[1] : undefined;
}
