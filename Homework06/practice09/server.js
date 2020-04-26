

//설치한 라이브러리 선언 
let moment = require('moment');
const express = require('express');

const app = express();


app.set("views",__dirname + "/views");
app.set("view engine","ejs");



//*********과제 1**********/
app.get("/",(request, response)=>{

   response.send( moment().format("YYYY/MM/DD HH:mm:ss"));
   
});


app.get("/test",(request, response)=>{

   response.render("index",{text:null})
});

app.listen(8080);
console.log("hello world");