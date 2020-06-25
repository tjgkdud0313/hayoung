// post 게시일 위한 함수 

$(function(){
  function get2digits (num){
    return ('0' + num).slice(-2);
  }
  // convertDate랑 convertDateTime안에서 호출 
  function getDate(dateObj){
    if(dateObj instanceof Date)
      return dateObj.getFullYear() + '-' + get2digits(dateObj.getMonth()+1)+ '-' + get2digits(dateObj.getDate());
  }
  function getTime(dateObj){
    if(dateObj instanceof Date)
      return get2digits(dateObj.getHours()) + ':' + get2digits(dateObj.getMinutes())+ ':' + get2digits(dateObj.getSeconds());
  }


  

  // jquery로 data-date를 찾고 그걸 년-월-일로 변환 
  function convertDate(){
    $('[data-date]').each(function(index,element){
      var dateString = $(element).data('date');
      if(dateString){
        var date = new Date(dateString);
        $(element).html(getDate(date));
      }
    });
  }


  // 몇시 몇분 몇초 형식으로 바꿔주는 
  function convertDateTime(){
    $('[data-date-time]').each(function(index,element){
      var dateString = $(element).data('date-time');
      if(dateString){
        var date = new Date(dateString);
        $(element).html(getDate(date)+' '+getTime(date));
      }
    });
  }
  convertDate();
  convertDateTime();
});
