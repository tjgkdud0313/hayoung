
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
 
 function addMessage(nick, message, date, messageType = 1){
   if(message ==null || message.trim() =="")return ;
   var chatBox=$(".chat-box");
   var newMessage=$(".chat-box .message.template").clone();
   newMessage.removeClass("template");
 
   if(messageType=0) newMessage.addClass("system");
   if(messageType=1) newMessage.addClass("self");
 
   chatBox.append(newMessage);
     
     newMessage.attr("date",date);
     newMessage.find("img").arrt("src","text = http://via.placeholder.com/60x60.png Hello_world"+nick);
     newMessage.find(".text").text(message);
     newMessage.find(".time").text(moment(date).format("YYYY/MM/DD HH:mm:ss"));
     var element =chatBox[0];
     element.scrollTop=element.scrollHeight-element.clientHeight;
 }
 
 function deleteMessage(){
   
   $(".chat-box .message:not(.template)").remove;
 }
 
 var nick = null;
 
 function onEnterNick(){
   nick = $("[name = 'nick']").val();
   console.log("on Enter",nick);
 
   $("#enter").hide();
   $("#chat-window").show();
   addMessage(null, nick,new Date().getTime(),0);

   connectWebsocket();}
 
 function sendMessage(message){ 
   fetch("/api/send",{
       method:"POST",
       headers:{
         'Content-Type': 'application/jason',
       },
       body:JASON.stringify({ 
         nick:nick,
         message:message
       })
      
   }).then((res)=>{
       console.log(res);
       pullMessages();});}
 
 function loadMessages() {
 
   fetch("/api/messages",{
     method:"GET",
     headers:{
       'Content-Type': 'application/jason'}})
 
 .then(response => response.json())
 .then(messages=>{
     messages.forEach(data=>{
        let type = data.nick == nick?1:2;
       addMessage(data.nick, data.message, data.date,type)}); }); }
 
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
       date}) })
 
 .then(response => response.json())
 .then(messages=>{
     messages.forEach(data=>{
 
       let type = data.nick == nick?1:2;
       addMessage(data.nick, data.message, data.date,type) }); }); }
 
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
 
 