

let moment = require('moment');
const express = require("express");
const app = express();


app.use(express.urlencoded({extended:true}));
app.set("views",__dirname + "/views");
app.set("view engine","ejs");

app.use(express.static('static'));
// 뷰엔진은 이거로 쓰고
// 정적파일은 sttic을 사용해라
// css랑 js파일이 문제여서 그거를 static 폴더에 넣어줌 
// css랑 js는 view에 넣어줄 수가 없으므로 static 폴더에 넣음
// static 폴더에 넣은거를 불러오는 코드 



// 여기가 입장룸이고 
// 여기서 input으로 Nick넣어주면 chat으로 넘어감 




//*****************과제 1******************/
app.get("/",(request, response)=>{
   //response.render("index",{ time: new Date().toString() });
    response.send( moment().format("YYYY/MM/DD HH:mm:ss"));
  
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
  







