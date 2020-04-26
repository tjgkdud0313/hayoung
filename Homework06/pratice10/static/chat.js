
$(document).ready(()=>{
    $(".input-message input[type=text]").on("keydown",(e)=>{
        if(e.keyCode==13){ 

            onEnterMessage();
        }
    });
    // ready에서 읽은담에 첨에 입력한거를 넣어줌 
    addMessage(nick,true, true);
});
 

function onEnterMessage(){

    var message=$(".input-message input[type=text]").val();
    $(".input-message input[type=text]").val("");

    if(message=="/clear"){
      deleteMessage();
    }
    else{addMessage(message);}
}

function addMessage(message, isSystem = false, isSelf = false){
    var chatBox=$(".chat-box");
    var newMessage=$(".chat-box .message.template").clone();
    newMessage.removeClass("template");

    if(isSystem) newMessage.addClass("system");
    if(isSelf) newMessage.addClass("self");

    // isSystem일 경우에만 이렇게 추가하기
    // system일 경우에는 css에서 이미지 보이지 않게 설정해둠

 
    chatBox.append(newMessage);
    newMessage.find(".text").text(message);
    newMessage.find(".time").text(moment().format("YYYY/MM/DD HH:mm:ss"));
    var element =chatBox[0];
    element.scrollTop=element.scrollHeight-element.clientHeight;
}

function deleteMessage(){
  $(".chat-box .message:not(.template)").remove;
}

  //delete두가지 방법 있음
  //1. 템플릿 따로 떼서 다른거 다 날린담에 템플릿을 다시 넣어주거나
  //2. 템플릿을 뺸거만 날려주거나 


