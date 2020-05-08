
import { response } from "express";

$(document).ready(()=>{
  $(".input-message input[type=text]").on("keydown",(e)=>{
      if(e.keyCode==13){ 


        // 메시지 넣었을때의 함수로 
          onEnterMessage();
      }
  });
  // ready에서 읽은담에 첨에 입력한거를 넣어줌 
  addMessage(nick,0);
});




function onEnterMessage(){

  var message=$(".input-message input[type=text]").val();
  $(".input-message input[type=text]").val("");

  if(message=="/clear"){
    deleteMessage();
  }
  else{
      //addMessage(message,1);
      sendMessage(message);
  }
}







function addMessage(nick, message, date, messageType = 1){
  // 입력창에 문자를 아무것도 입력 안했을때는 그냥 무시 / chat-box에 아무것도 안뜨게 
  if(message ==null || message.trim() =="")return ;
  var chatBox=$(".chat-box");
  var newMessage=$(".chat-box .message.template").clone();
  newMessage.removeClass("template");

  if(messageType=0) newMessage.addClass("system");
  if(messageType=1) newMessage.addClass("self");

  chatBox.append(newMessage);
  newMessage.attr("date",date);
  // ?는 뒤에 text랑 합치겠다 이런 의미 
  // 보낸 사람 상대방의 닉네임을 이미지에 넣어줌 
    newMessage.find("img").arrt("src","text = http://via.placeholder.com/100x100.png?text="+nick);
    newMessage.find(".text").text(message);
    // 숫자를 moment에 고대로 넣어주면 인식해서 ~
    newMessage.find(".time").text(moment(date).format("YYYY/MM/DD HH:mm:ss"));
    var element =chatBox[0];
    element.scrollTop=element.scrollHeight-element.clientHeight;
}








function deleteMessage(){
  
  $(".chat-box .message:not(.template)").remove;
}








var nick = null;
function onEnterNick(){

  // 엔터 누르면 서버에 이 함수 실행하도록 해서 
  // console창이 실행됨 

  // 일단 클라이언트에서 닉네임을 눌러서 입장을 하면 
  // 아래의 connectWebsocket을 통해서 접속을 한다 
  // connectwebsocket 함수 하는일은 
  // 접속해주고 끊어지면 다시 연결하고 새메시지 오면 달라고 요청하고 

  // 그럼 서버에서는 weServer.on()여기서는 
 // 접속이 들어왔을때 준비를 하고
 // 바로 확인해봐라 send를 해준다  
  nick = $("[name = 'nick']").val();
  console.log("on Enter",nick);

 // 엔터 치면 처음 입력폼이 사라지고 (hide)
 // 채팅방으로 넘어감
  $("#enter").hide();
  $("#chat-window").show();
  //입장할 때 입력한 닉네임이 채팅방 내용으로 들어감  
  // 지금 시간(gettime)주고 
  addMessage(null, nick,new Date().getTime(),0);
  // 일일이 치기 어려우니까 enter누를때마다 호출하도록

  // 지금 pull한거 없이 접속만
  // 웹소켓 연결을 여기서 해줌(엔터 눌렀을때)
  connectWebsocket();
  //pullMessages();
  //pullmessaage로 고정 
  //loadMessages()
}










function sendMessage(message){
  // 펫치라는 api사용함 
  fetch("/api/send",{
    // post로 쏜것 
      method:"POST",
      headers:{
        // 이게 제이슨 문법을 써논거다 알려주는거
        //컨테츠 타입이 이거다 
        'Content-Type': 'application/jason',
      },

      // stringify 객체를 문서화해주는 
      body:JASON.stringify({

        // 객체 여러개면 쉼표로 구분함 
        nick:nick,
        message:message
      })
     
  }).then((res)=>{
      console.log(res);
      // sendmessage후에 pull하도록 (갱신해라)
      // 보냈으니까 갱신해라 
      pullMessages();

  });
}











// 이전에 썼던 채팅 내용까지 다 출력되도록 하는
//모든 메시지를 불러오게 해주는 함수

function loadMessages() {

  //데이터를 불러와라
  fetch("/api/messages",{
    // 이번에는 get으로 쐈으니까 get 
    method:"GET",
    // 보낼게 없으니까 바디는 필요없음 
    headers:{
      // 이게 제이슨 문법을 써논거다 알려주는거
      'Content-Type': 'application/jason'
    }
  }) //위에서 불러온 데이터를 json으로 파씽해라
  .then(response => response.json())
  .then(messages=>{
    // messages 상에는 이미 데이터가 있는 상태 
    messages.forEach(data=>{
      // type이 이거면 내가 쓴거(같은 닉네임을 쓴거만)로 보고 아니면 남이 쓴거로 봄 
      // data.nick이 내가 설정한 nock이랑 같으면 자신으로 보고 
      // 아니면 남으로 보는 
      
      let type = data.nick == nick?1:2;
      // 이때 시간은 받은 시간을 써줘야하니까 data.date
      // getTime은 현재 시간
      addMessage(data.nick, data.message, data.date,type)}); }); 
    }












//pull이 땡겨주는거라고 생각 
// pull은 내가 보내면 상대방꺼에 뜨게 해주는 함수 
// 이걸 실시간처럼 왔다갔다 하게 보이려면 
// websocket이 필요함 
function pullMessages(){
  // 그 전에 가장 마지막에 받은 메시지가 뭔지를 알아야함 
  var messages = $(".messages:not(.system)[date]");
  //만약 메시지창에 아무것도 없으면 전부 불러오도록 
  // 만약 메시지에 아예 들어온게 없으면 전부 불러옴 
  if(messages.length==0)return loadMessages();

  // j쿼리로 씌워주기 
  var lastMessage = messages.last();
  concole.log(lastMessage);
  var date = lastMessage.attr("date");


  fetch("/api/pull",{
    method:"POST",
    headers:{
      // 이게 제이슨 문법을 써논거다 알려주는거
      'Content-Type': 'application/jason'
    },
    //이번엔 바디가 필요함 
    // jason에다가 아까 date
    body: JASON.stringify({
      date:date}) })

.then(response => response.json())
.then(messages=>{
    messages.forEach(data=>{

      let type = data.nick == nick?1:2;
      addMessage(data.nick, data.message, data.date,type) }); }); 
    }








//이젠 서버에서 보내는게 필요함 
var ws = null;
// 웹소켓에 연결해주는 함수 하나 만들고
// 이 함수를 호출하면 websocket이랑 연결되는거 
function connectWebsocket(){
  if(ws != null){
    try{
      ws.close();
    }catch(e){}
  }

  //웹소켓에 접속했을때(connectWebsocket함수를 실행했을때) 
  // 웹소켓을 만들어서 붙히고 
  ws = new WebSocket("ws:http://127.0.0.1:8080/");

  //끊어졌을때 재접속을 시도한다 
  ws.onclose=()=>{

    // 이경우는 만약에 접속하다가 끊어졌을떄 
    // 1초 뒤에 자동으로 접속할 수 있음 
    setTimeout(connectWebsocket,1000);
  };

  // 메시지를 받았을떄 쓰던 메시지를 받도록 요청을 하는것 
  // 접속하면 메시지 왔을때만 pullmessage하도록 
  ws.onmessage = (message) =>{
    pullMessages();
  };

}

