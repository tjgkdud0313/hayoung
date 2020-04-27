// practice10 서버 이름 server2.js입니다 
// 이게 practice10 서버입니다!! 다른 서버들은 무시해주세요

let moment = require('moment');
const express = require('express');

const app = express();


app.use(express.urlencoded({extended:true}));
app.set("views",__dirname + "/views");
app.set("view engine","ejs");

app.use(express.static('static'));



// 여기가 입장룸이고 
// 여기서 input으로 Nick넣어주면 chat으로 넘어감 



//*****************과제 1******************/
app.get("/",(request, response)=>{

  response.render("index",{ time: moment().format("YYYY/MM/DD HH:mm:ss") });
 // response.render("index",{ time: new Date().toString() });
  // response.send(moment().format("YYYY/MM/DD HH:mm:ss"));
 
});


// 여기가 넘어가는 chat 화면
app.post("/",(request, response)=>{
  //name을 전달받는다
  console.log(request.body);
  response.render("chat",{nick: request.body.nick})
});



app.listen(8080);
console.log("practice10 서버입니다 : hello world");



//app.get("/test",(request, response)=>{
 // response.send("Hello World");
// response.render("index",{text:null})

//request.body하면 form(?)에서 전송시킨 바디를 받을 수 있다 
 // 터미널에 전달받은 내용 뜸 

 //요거를 그대로 넣어줌(넘겨줌)





