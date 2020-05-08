
const http = require('http');
const app = express();
const moment = require('moment');
const express = require('express');
// 실시간으로 할 수 있도록 도와주는 websocket
var WebsocketServer = require('websocket').server;


// 이건 웹소켓 함수
// 리퀘스트 왔을때 바로 메시지 넣어주는
//리퀘스트 접속이 들어왔을때 
wsServer.on('request', function(request){

  console.log('on Request');
  // accept 규격 잘 맞춰야함-null로 맞추기 (소켓이 규격이 다양하게 있음)
  var connection = request.accept(null,request.origin);
  // 해당 커넥션에 요청 들어오면 function 

  // 그런데 서버에서는 접속이 들어오면 준비만 해놓고 
  connection.on('message',function(message){
    console.log(message);
  
  });
   // emit으로 한번 체크해봐라 알려줌 데이터 보냄 
  connection.emit("check");
});




// 일케 먼저 httpServer 지정해주고 
const httpServer = http.createServer(app);
const wsServer = new WebsocketServer({
  httpServer:httpServer,
  autoAcceptConnections: false
});

// 임의로 데이터베이스 만듦(빈 배열)
const messages = [];

app.use(express.json());
app.use(express.urlencoded({extended:true}));
//이건 서버가 폼?된 거만 받겠다는 
app.set("views",__dirname + "/views");
app.set("view engine","ejs");
app.use(express.static('static'));

//서버에서 한일이라곤 (크게 2개)
//메시지를 받고 메시지 보관작업을 하고 
// 그 메시지를 요청했을때 (api/messages로)
// 그 메시지를 응답해주는것 
//res.json(messages);
// 이게 api-- 화면에 관계없이 데이터(문자)만 계발함
// 이런 api활용하면 하나만 계발해도 여러 플랫폼에 사용할 수 있음 
app.post("/api/send", (req, res)=>{
  console.log("api test",req.body.nick, req.body.message);

  messages.push({

     // 객체들을 각각 지정해줌
    // 이게 제이슨 문법
    date: new Date().getTime(),
    nick:req.body.nick,
    message:req.body.message

  });

  res.json({});

  //접속중인 모든 connection에다가 일일이 send하는것
  // forEach는 모든~~에 일일이 해주는거

  //서로 한쪽에서 메시지 쏘고 한쪽에서 메시지 쏘면 이렇게 모듈에 알려준느것 
  // 체크해보라고 
  wsServer.connections.forEach(c=>c.send("check"));
});


app.get("/api/messages",(req,res)=>{
  // 서버에 넣어둔 메시지가 페이지 리프레쉬할때마다 날아가버리니까
  // 전부 가져오는게 필요
  //자꾸 메시지 날아가는거를 막기 위함 

  //이 api는 서버에 요청하면 
  // 단순히 서버에 있는 모든 메시지를 전달해주는거 

  res.json(messages);
})







//받는 기능을 구현하기 위해서 
app.post("/api/pull",(req,res)=>{
  // 지금 필터를 걸어준것 (load메시지 실행하면 이전에 썼던 메시지 불러오긴 하는데 중복되는게 많아서)
  // 받는 메시지가 지금까지 한거 이후이면 받아와라
  // req에 넣어주는 데이터가 가장 최근 메시지라고 할떄 
  console.log("api test", req.body.nick, req.body.message);
  
  //메시지 배열(데이터)에 필터를 걸어주는데 
  // data.date가 지금 현재 req.body.date보다 늦으면(뒤면, 더 최근 메시지)
  // 그거를 newmessage로 해라 
  // 그 다음에 jason으로 해서 보내줌(응답)
  var newMessages = messages.filter(data =>data.date>req.body.date);
  res.json(messages);
})

app.get("/",(request, response)=>{

  response.render("index",{ time: moment().format("YYYY/MM/DD HH:mm:ss") });
 
});


//app.listen(8080); 웹소켓 쓸때는 앱으로 직접 실행시키지 않고 
// 처음에 웹서버할때 썼던 http사용함 
// 웹소켓이랑 연동시키려면 app에서 직접하지 않고 http를 통해 해야함 
httpServer.listen(8080);
console.log("practice11 서버입니다 : hello world");


// 여기서 서버가 한일이라곤 메시지를 받고 메시지를 보관하는 보관 작업을 하고
//메시지를 요청했을때 이렇게 요청하는(응답을 해주고)
// 이런걸 api라고 함 화면과 관계없이 순수 데이터만 전달해주는











