var pshistory=[];
var token= undefined;
var myid= undefined;

$(function() {
    initPsas();
    var width= window.innerWidth;
    var height= window.innerHeight;
    if (width > height) {
       $('body').addClass('wide').removeClass('high');
 	$('.ifhigh').remove();
    } else {
        $('.ifwide').remove();
    }
    $('#background').attr('width',width).attr('height',height);   

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
    showPage("page1", "init");
});

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
    $('#betrag').val((parseFloat($('#betrag').val())*factor).toFixed(0));
}

function init_page1() {
    token= undefined;
}

function init_page2() {
    if (!token)
	$.get('/createToken?myid='+myid, function(msg) { token= msg; });
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
    $.get('/completeDonation/createLastschrift?token='+token +
	  '&name='+encodeURI($('#spender').val()) +
	  '&mnr='+encodeURI($('#ls_mid').val()) +
	  '&betrag='+encodeURI($('#betrag').val()), 
	  '&inhaber='+encodeURI($('#inhaber').val()) +
	  '&kto='+encodeURI($('#konto').val()) +
	  '&blz='+encodeURI($('#blz').val()) +
	  '&zweck='+encodeURI($('#zweck').val()) +
	  '&adresse='+encodeURI($('#ls_adresse').val()) +
	  '&bescheinigung='+encodeURI($('#ls_quittung').val()), 
	  function(response) {
	      if (response!="OK") alert('Fehlgeschlagen');
	  });
}

function init_ueberweisen_danke() {
    $.get('/completeDonation/createUeberweisung?token='+token +
	  '&mnr='+encodeURI($('#uw_mid').val()) +
	  '&mail='+encodeURI($('#uw_email').val()) +
	  '&zweck='+encodeURI($('#zweck').val()) +
	  '&betrag='+encodeURI($('#betrag').val()) +
	  '&name='+encodeURI($('#uw_spender').val()) +
	  '&adresse='+encodeURI($('#uw_adresse').val()) +
	  '&bescheinigung='+encodeURI($('#uw_quittung').val()),
	  function(response) {
	      if (response!="OK") alert('Fehlgeschlagen');
	  });
}

function initPsas() {
    $.get('/psas/getStatus', function(response) {
	var m=response.match('<Spenden>(.*)</Spenden>')[1];
	m= m.replace(/(\d\d\d)\./,'.$1,');
	$('#sumDonations').text(m);
	m= response.match('<Zusagen>(.*)</Zusagen>')[1];
	m= m.replace(/\./,',');
	$('.standDatum').text('Offene Zusagen: '+m);
    });
}
