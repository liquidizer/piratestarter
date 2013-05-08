pshistory=[];

$(function() {
    var urlParamZweck= location.search.match('[?&]zweck=([^&]*)');
    if (urlParamZweck) {
	$('#zweck').val(urlParamZweck[1]);
    }
    var urlParamBetrag= location.search.match('[?&]betrag=([^&]*)');
    if (urlParamBetrag) {
	$('#betrag').val(urlParamBetrag[1]);
    }
    showPage("page1", "init");
    $('.nextButton').click(function(evt) { 
	showPage($(evt.target).attr('to'), "left", "right"); 
    });
    $('.backButton').click(function() {
	pshistory.pop();
	showPage(pshistory.pop(), "right", "left");
    });
});

function showPage(pageid, dir1, dir2) {
    pshistory.push(pageid);
    var mypage= $("#"+pageid);
    if (dir1=="init") {
	 $(".page").hide();
	mypage.show();
    }
    else {
	$(".page:visible").hide("slide", {direction: dir1}, 500);
	mypage.show("slide", {direction: dir2}, 600)
    }
    $(':focus').blur();
    initPage(mypage);
 }

function initPage(mypage) {
    mypage.find("span").each(function() {
       var name=$(this).attr("name");
       var type=$(this).attr("type");
       var value="";
       if (type=="select") {
	   value= $("select[name="+name+"] option").filter(":selected").text();
       } 
       else if (type=="input") {
	   value= $("input[name="+name+"]").val();
       }
       else if (type=="code") {
	   value="XY78";
       }
       $(this).text(value);
    });
}

function betragMehr(factor) {
    $('#betrag').val((parseFloat($('#betrag').val())*factor).toFixed(2));
}
