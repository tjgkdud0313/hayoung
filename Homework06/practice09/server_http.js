// http라이브러리로 웹서버 구현한 경우 

const http=require("http");   //http 라이브러리 불러와서 객체로 지정 

// app이라는 이름의 객체에 서버를 생성함 
var app =http.createServer((request, response)=>{

    //http일떄는 경로 정보 분기별로 

    //console.log는 터미널 창에 써달라는 요청 
    // url 경로로 서버 웹페이지 하나씩 요청할때마다 터미널에 call이라고 뜸 
    console.log("Call");
    if(request.url =="/index.html"){
        // 만약 url정보가 저거면 응답객체에서 아래와 같이 응답해달라 
        response.writeHead(200);
        //만약 500을 넣으면 서버 작동하지 않음
        // 500은 에러라는 의미

        //200이면 이렇게 실행해달라 
        response.end("<html><body style='color:red'>hello world</body></html>");
        return;
    }

    else if(request.url =="/test"){
        // url정보로 이거 입력했으면 

        response.writeHead(200);
        response.end("<html><body>hello Test</body></html>");
        return;
    }

    //if랑 else if 둘다 아닌 경우 >> else에 해당하는 경우 
    response.writeHead(200);
    response.end("<html><body style='color:red'>hello world</body></html>");

});

// listen이라는 명령어 통해서 app이라는 이름의 웹서버를 실행시킨다 
//이거 listen을 걸어놔서 프로그램 끄기 전까지는 꺼지지 않음 
app.listen(8080);



