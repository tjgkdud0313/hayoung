
// const express = require("express");
// express 라이브러리로 웹서버 구현한 경우
// 이전에 npm으로 express라이브러리 install했어야함 


const express = require('express');
const app = express();

app.get("/",(request, response)=>{

   response.send("Wow!!! Hello World");
  // response.render("index",{
       //text: "hello web" 이렇게 하면 글자 그대로
     //  text: new Date().toString() //이거는 현재 시간을 string으로 
   // });
   
});


app.get("/test",(request, response)=>{

   response.send("It's Test : Hello World");
  //  response.render("index",{text:null})
});

app.listen(8080);

//실행하면 무조건 터미널에 hello world 출력되도록 
console.log("hello world");