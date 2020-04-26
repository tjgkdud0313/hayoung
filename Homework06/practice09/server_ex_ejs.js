
// const express = require("express");
// express 라이브러리로 웹서버 구현한 경우
// 이전에 npm으로 express라이브러리 install했어야함 
// express랑 ejs랑 연결해서 사용 
// ejs가 편한점은 서버가 따로 필요없다 

const express = require('express');
const app = express();

app.set("views",__dirname + "/views");
// 뷰엔진을 ejs형식으로 지정함 
app.set("view engine","ejs");



app.get("/",(request, response)=>{


   // ejs에서 불러와야하므로 render사용함 
   response.render("index",{
      //text: "hello web" 이렇게 하면 글자 그대로
      // 여기서는 text에 어떤 상태줘서 index의 분기로 들어가게 하지 않고 
      // 그냥 text를 시간(문자로 바꾼)으로 출력하게끔 
       text: new Date().toString() //이거는 현재 시간을 string으로 
    });
   
});

app.get("/test",(request, response)=>{

    // ejs에서 불러와야하므로 render사용함 
   // text상태를 지정해줌 (ejs에서 텍스트 상태에 따라 분기처리)
   response.render("index",{text:null})
   // no text가 출력되야함 
});

app.listen(8080);
console.log("hello world");