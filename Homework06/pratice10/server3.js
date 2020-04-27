let moment = require('moment');
const express = require('express');

const app = express();


app.use(express.urlencoded({extended:true}));
app.set("views",__dirname + "/views");
app.set("view engine","ejs");

app.use(express.static('static'));



//*********과제 1**********/
app.get("/",(request, response)=>{

   response.render("index",{ time: new Date().toString() });
   
});


app.post("/",(request, response)=>{
    response.render("chat.post",{text:null});

});

// 여기가 넘어가는 chat 화면

// app.post("/",(request, response)=>{
//     //name을 전달받는다
//     console.log(request.body);
//     response.render("chat",{nick: request.body.nick})
//    });


app.listen(8080);
console.log("hello world");