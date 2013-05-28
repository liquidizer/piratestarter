var pshistory=[];
var token= undefined;
var myid= undefined;

$(function() {
    initPsas();
    initLayout();
    processUrlParameters();
    $('.nextButton').click(function(evt) { 
	var to= $(evt.target).attr('to');
	if (to.match(/\(\)$/)) to= eval(to);
	showPage(to, "left", "right"); 
    });
    $('.backButton').click(function() {
	pshistory.pop();
	showPage(pshistory.pop(), "right", "left");
    });
    $('html').keyup(validatePage);
    $('html').click(validatePage);
    $('#currency').change(function() {
	$('#betrag').val(($(this).val()=="eur") ? '25' : localizeDecimal(0.25, 6));
    });
    showPage("page1", "init");
});

function initLayout() {
    var width= window.innerWidth;
    var height= window.innerHeight;
    if (width > height) {
       $('body').addClass('wide').removeClass('high');
 	$('.ifhigh').remove();
    } else {
        $('.ifwide').remove();
    }
    $('#background').attr('width',width).attr('height',height);   
}

function processUrlParameters() {
    var urlId= location.search.match('[?&]myid=([^&]*)');
    if (urlId) {
	myid= urlId[1];
    }
    var urlParamZweck= location.search.match('[?&]zwecke=([^&]*)');
    if (urlParamZweck) {
	var zwecke= decodeURI(urlParamZweck[1]).split(",");
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
	$('#betrag').val(urlParamBetrag[1]);
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
	$('#betrag').val(localizeDecimal(newVal,6));
}

function init_page1() {
    token= undefined;
}

function init_page2() {
    if (!token)
	$.get('/createToken?myid='+myid, function(msg) { token= msg; });
}

function page3orBtc() {
    return ($('#currency').val()=="eur") ? "page3" : "bitcoin1";
}

function init_lastschrift2() {
    var spender= $('#spender');
    if (spender.val()=="")
	spender.val($('#inhaber').val());
}

function ueberweisen2or3() {
    return $('#uw_mid').val()!="" ? "ueberweisen_danke" : "ueberweisen2";
}

function lastschrift3or4() {
    console.log($('#ls_mid').val()!="" ? "lastschrift3" : "lastschrift2a");
    return $('#ls_mid').val()!="" ? "lastschrift3" : "lastschrift2a";
}

function init_lastschrift_danke() {
    $.post('createLastschrift','token='+token +
	   '&name='+encodeURI($('#spender').val()) +
	   '&mnr='+encodeURI($('#ls_mid').val() || 0) +
	   '&mail=' +
	   '&betrag='+encodeURI(myFloat($('#betrag').val()))+
	   '&inhaber='+encodeURI($('#inhaber').val()) +
	   '&kto='+encodeURI($('#konto').val()) +
	   '&blz='+encodeURI($('#blz').val()) +
	   '&zweck='+encodeURI($('#zweck').val()) +
	   '&adresse='+encodeURI($('#ls_adresse').val()) +
	   '&bescheinigung='+encodeURI($('#ls_quittung').is(':checked')), 
	   function(response) {
	       if (response!="OK") alert('Fehlgeschlagen');
	   });
}

function init_ueberweisen_danke() {
    $.post('/createUeberweisung','token='+token +
	   '&mnr='+encodeURI($('#uw_mid').val() || 0) +
	   '&mail='+encodeURI($('#uw_email').val()) +
	   '&zweck='+encodeURI($('#zweck').val()) +
	   '&betrag='+encodeURI(myFloat($('#betrag').val())) +
	   '&name='+encodeURI($('#uw_spender').val()) +
	   '&adresse='+encodeURI($('#uw_adresse').val()) +
	   '&bescheinigung='+encodeURI($('#uw_quittung').is(':checked')),
	   function(response) {
	       if (response!="OK") alert('Fehlgeschlagen');
	   });
}

function initPsas() {
    $.get('/psas/getStatus', function(response) {
	$('#sumDonations').text(localizeDecimal(getParam(response,'Spenden')));
	$('#sumPromised').text(localizeDecimal(getParam(response,'Zusagen')));
    });
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
