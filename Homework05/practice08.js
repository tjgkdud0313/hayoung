$(document).ready(()=>{
    $(".input-message input[type=text]").on("keydown",(e)=>{
        if(e.keyCode==13){ //keyCode==13이라는건 
                           //키보드로 엔터를 눌렀다는것 
            onEnterMessage();
        }
    });
});


//메시지를 엔터했을때 
function onEnterMessage(){

     // 메세지를 꺼내고
     //{val()함수가 그 문서객체(태그)의 값을 반환해주는거}
    var message=$(".input-message input[type=text]").val();
    //(쓰는 창)에 쓴 그 메시지는 지워주고 >> 다시 쓸 수 있게 하려고
    $(".input-message input[type=text]").val("");


    // 채팅창에 추가하기 전에 clear여부 검사 
    if(message=="/clear"){

       // $(".template").removeClass("time");
      // alert("종료합니다");
      // $(".message.template .text").removeClass("text");
     //  $(".message").removeClass("text");
      // $(".chat-box").removeClass("message");

      $(".chat-box .message .text").empty("").append("삭제된 메시지입니다");
      $(".chat-box .message .time").empty("");

    }


    //clear가 아니면 
    //받은 메시지를 채팅창에 추가
    else{addMessage(message);}

}

//보낸 메시지를 채팅창에 넣어주는 함수 
function addMessage(message){
    var chatBox=$(".chat-box");

    // 여기서 뉴메시지 변수를 선언한 이유는 
    // 아래에서도 뉴메시지 변수를 쓰기때문 
    // .chat-box하고 띄어야함
    // chat-box 클래스가 지정된 엘리먼트안에서
    //클래스에 message와 template 둘다 선언된 엘리먼트를 찾은 다음 복제 한다는 의미
    //복제할때 내부에 있는 다른 엘리먼트도 전부 복제
    //(이때는 message와 template클래스 태그부터 복제되는것)
    // 즉 clone은 말그대로 태그(코드로 쓴) 그거를 전부 복제하는거
    var newMessage=$(".chat-box .message.template").clone();
    newMessage.removeClass("template");



    //채팅박스 전체 창에 메세지 하나 추가
    // 이거는 아직 형식만 추가한거 
    //clone을 했다고 해도 다 같은곳으로 이동하는게 아니므로 이렇게 첨가해줘야함 
    chatBox.append(newMessage);
    // 그때 코드 계속 복붙해서 여러개 채팅 만들었던거랑 똑같
   


    //추가된 메세지 창에 메세지 내용을 넣어준다 
    // 넣어줄 내용은 메시지 내용과 날짜
    // text클래스에 message를 넣어줌 
    newMessage.find(".text").text(message);
    
    //일케 하면 이쁘게 날짜 안나옴 
    //newMessage.find(".time").text(new Date().toString());
    // moment 추가해서 
    newMessage.find(".time").text(moment().format("YYYY/MM/DD HH:mm:ss"));
    var element =chatBox[0];
    element.scrollTop=element.scrollHeight-element.clientHeight;
}

/*function deleteMessage(){

}*/

  /*  $(".input-message input[type=text]").val("").on("propertychange change keyup paste input", function() {
                
        // 현재 변경된 데이터 셋팅
        newValue = $(this).val();
        
        // 현재 실시간 데이터 표츌
        alert("텍스트 :: " + newValue);
     });*/

