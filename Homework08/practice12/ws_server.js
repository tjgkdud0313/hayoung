
const moment = require('moment');
const express = require('express');
var WebsocketServer = require('websocket').server;
const app = express();
const http = require('http');
const mysql = require("mysql");
const redis = require("redis");

// 웹소켓 서버 따로 만들었으니 원래 서버에서는 웹소켓 지워버려도 괜찮음 


var connection = mysql.createConnection({
  host    :  'localhost',
  user    :  'root',
  password:  'test',
  database:  'test'
});




const client = redis.createClient();
const httpServer = http.createServer();
const client = redis.createClient();


const wsServer = new WebsocketServer({
  httpServer:httpServer,
  autoAcceptConnections: false
});


//이제 이거 대신에 
//const allMessages = {};

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set("views",__dirname + "/views");
app.set("view engine","ejs");

app.use(express.static('static'));

app.post("/api/send", (req, res)=>{
  console.log("api test",req.body.room,req.body.nick, req.body.message);
  var messages = allMessages[req.body.room]
  if(messages ==null){
    messages =[];

    //이렇게 하면 모든 배열을 다 검사할 필요하 없으므로 더 효율적 
    allMessages[req.body.room] = messages;
  }


  //messages.push({
  //   date: new Date().getTime(),
  //   room:req.body.nick,
  //   nick:req.body.nick,
  //   message:req.body.message

  // });
  connection.query("INSERT INTO messages(nick,room,message,'date')VALUES(?, ?, ?, ?)",
  [req,body.nick,req.body.room, req.body.message, new Date().getTime()], ()=>{
    res.json({});
    wsServer.connections.forEach(c=>c.send("check"));
  })



  //서로 한쪽에서 메시지 쏘고 한쪽에서 메시지 쏘면 일케 모듈에 알려줌
  // 체크해보라고 
  wsServer.connections.forEach(c=>c.send("check"));
});


app.post("/api/messages",(req,res)=>{


connection.query("SELECCT * FROM messages WHERE room = ? ORDER BY id ASC", [req.body.room],(err,rows)=>{
    res.json(rows);
})
})

app.post("/api/pull",(req,res)=>{
 

connection.query("SELECCT * FROM messages WHERE room = ? AND 'date' > ? ORDER BY id ASC", [req.body.room],(err,rows)=>{
    res.json(rows);
})
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

httpServer.listen(8888);
client.subscribe("MESSAGE",()=>{
    
})
console.log("practice12 서버입니다 : hello world");












