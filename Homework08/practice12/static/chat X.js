
 import { response } from "express";

 $(document).ready(()=>{
   $(".input-message input[type=text]").on("keydown",(e)=>{
       if(e.keyCode==13){ 
 
           onEnterMessage();} });
   addMessage(nick,0);
 });
 
 
 function onEnterMessage(){
   var message=$(".input-message input[type=text]").val();
   $(".input-message input[type=text]").val("");
 
   if(message=="/clear"){
     deleteMessage();
   }
   else{
       sendMessage(message);} }
 
 function addMessage(data){

  var message = data.message;
  var messageType = 2;// 기본 타입은 2로 하고
  if(data.nick==nick) messageType = 1; //만약 닉네임이 동일하면 self로 지정 
  var date = pastInt(data.date,10);
  
   if(message ==null || message.trim() =="")return ;
   var chatBox=$(".chat-box");
   var newMessage=$(".chat-box .message.template").clone();
   newMessage.removeClass("template");
 
   if(messageType=0) newMessage.addClass("system");
   if(messageType=1) newMessage.addClass("self");
 
   chatBox.append(newMessage);
     
     newMessage.attr("date",date);
     newMessage.find("img").arrt("src","text = http://via.placeholder.com/60x60.png Hello_world"+data.nick);
     newMessage.find(".text").text(message);
     newMessage.find(".time").text(moment(date).format("YYYY/MM/DD HH:mm:ss"));
     var element =chatBox[0];
     element.scrollTop=element.scrollHeight-element.clientHeight;
 }
 
 function deleteMessage(){
   
   $(".chat-box .message:not(.template)").remove;
 }
 
 var nick = null, room = null;
 
 function onEnterRoom(){
   nick = $("[name = 'nick']").val();
   room = $("[name='room]'").val();
   if(nick==null || nick=="")return alert("Enter Nick");
   if(room==null || room=="")return alert("Enter Room");
   console.log("on Enter",nick,room);
 
   $("#enter").hide();
   $("#chat-window").show();
   //addMessage(null, nick,new Date().getTime(),0);

   connectWebsocket();}
 
 function sendMessage(message){ 
   fetch("/api/send",{
       method:"POST",
       headers:{
         'Content-Type': 'application/jason',
       },
       body:JASON.stringify({ 
         nick:nick,
         room:room,
         message:message
       })
      
   }).then((res)=>{
       console.log(res);
      // pullMessages();
    });}
 

       //여기 바디 빠진거 보완 
 function loadMessages() {
 
   fetch("/api/messages",{
     method:"POST",
     headers:{
       'Content-Type': 'application/jason'},
      body:JSON.stringify({
        room:room
      })})
 
 .then(response => response.json())
 .then(messages=>{
     messages.forEach(data=>{
       // let type = data.nick == nick?1:2;
       addMessage(data)}); }); }
 
 function pullMessages(){ 
   var messages = $(".messages:not(.system)[date]"); 
   if(messages.length==0)return loadMessages();
 
   var lastMessage = messages.last();
   concole.log(lastMessage);
   var date = lastMessage.attr("date");
 
 
   fetch("/api/pull",{
     method:"POST",
     headers:{
       'Content-Type': 'application/jason'},
     body: JASON.stringify({
       date:date,
      room:room}) })
 
 .then(response => response.json())
 .then(messages=>{
     messages.forEach(data=>{
 
      // let type = data.nick == nick?1:2;
       addMessage(data) }); }); }
 
 httpServer.listen(8080);
 console.log("practice10 서버입니다 : hello world");
 
 var ws = null;
 function connectWebsocket(){
   if(ws != null){
     try{
       ws.close();
     }catch(e){}
   }
 
   ws = new WebSocket("ws:http://127.0.0.1:8080/");
   ws.onclose=()=>{ 
     setTimeout(connectWebsocket,1000);
   };
   ws.onmessage = (message) =>{
     pullMessages();
   };
 
 }
 
 