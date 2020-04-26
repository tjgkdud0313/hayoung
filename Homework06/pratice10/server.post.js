



let moment = require('moment');
const express = require("express");
const app = express();


app.use(express.urlencoded({extended:true}));
// 뷰엔진은 이거로 쓰고
app.set("views",__dirname + "/views");
app.set("view engine","ejs");



//처음에 이거 입력하라 뜨고
app.get("/",(request, response)=>{
  //response.render("index",{time:new Date().toString() });
  response.send( moment().format("YYYY/MM/DD HH:mm:ss"));
  
});

//포스트 함수를 사용하는 경우 
//nick입력해주면 chat1.ejs에 입력해둔 내용 뜬다 
app.post("/",(request, response)=>{
  response.render("chat",{text:null});
})


//포스트 함수를 사용하는 경우 
//app.post("/",(request, response)=>{
  //response.render("chat",{text:null});
//});


app.listen(8080);
console.log("post 확인입니다 hello world");


