
const moment = require('moment');
const express = require('express');
var WebsocketServer = require('websocket').server;
const app = express();
const http = require('http');

const httpServer = http.createServer(app);


const wsServer = new WebsocketServer({
  httpServer:httpServer,
  autoAcceptConnections: false
});



const messages = [];

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set("views",__dirname + "/views");
app.set("view engine","ejs");

app.use(express.static('static'));

app.post("/api/send", (req, res)=>{
  console.log("api test",req.body.nick, req.body.message);

  messages.push({
    date: new Date().getTime(),
    nick:req.body.nick,
    message:req.body.message

  });

  res.json({});

  //서로 한쪽에서 메시지 쏘고 한쪽에서 메시지 쏘면 일케 모듈에 알려줌
  // 체크해보라고 
  wsServer.connections.forEach(c=>c.send("check"));
});


app.get("/api/messages",(req,res)=>{

  //자꾸 메시지 날아가는거를 막기 위함 
  res.json(messages);
})

app.post("/api/pull",(req,res)=>{
  // 지금 필터를 걸어준것 (load메시지 실행하면 이전에 썼던 메시지 불러오긴 하는데 중복되는게 많아서)
  // 받는 메시지가 지금까지 한거 이후이면 받아와라
  var newMessages = messages.filter(data =>data.date>req.body.date);
  res.json(messages);
})

app.get("/",(request, response)=>{

  response.render("index",{ time: moment().format("YYYY/MM/DD HH:mm:ss") });
 
});


// 이건 웹소켓 함수
// 리퀘스트 왔을때 바로 메시지 넣어주는 
wsServer.on('request', function(request){
  console.log('on Request');
  var connection = request.accept(null,request.origin);
  // 해당 커넥션에 요청 들어오면 function 

  // 그런데 서버에서는 접속이 들어오면 준비만 해놓고 
  connection.on('message',function(message){
    console.log(message);
  
  });
   
  connection.emit("check");
});

httpServer.listen(8080);
console.log("practice11 서버입니다 : hello world");












