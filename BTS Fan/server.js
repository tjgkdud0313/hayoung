var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var check = require('./check');
var app = express();

// 데이터 베이스 
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;

// 처음 연결되었을 때 메시지 뜨게 DB연결 확인 
db.once('open', function(){
  console.log('DB 연결되었습니다');
});



app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash());
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true}));
// passport 초기화
app.use(passport.initialize());
// passport session과 연결 
app.use(passport.session());


app.use(function(req,res,next){
  //req.isAuthenticated() : passport에서 제공하는 함수
  // 로그인이 되어있는지 아닌지를true,false로 return
  // 요 함수 이용해서 로그인 여부 판단 
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
});

// 페이지 경로 >> user,posts(router 모듈)
app.use('/posts', check.getPostQueryString, require('./routes/posts'));
app.use('/users', require('./routes/users'));




//passport : user authentication(사용자 인증)을 위한 패키지 
// strategy package와 함께 사용

var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/User');

// serialize : session을 DB에 어떻게 저장할 것이냐 
// DB에 id만 저장 
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// serialize : session에서 어떻게 object 만들지 
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});


// local strategy
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true},

      //로그인 시 호출 함수 
    function(req, username, password, done) {
      User.findOne({username:username})
        .select({password:1})
        .exec(function(err, user) {
          if (err) return done(err);

          //입력받은 password와 읽어온 해당 user의 password hash를 비교하는 함수
          if (user && user.authenticate(password)){
            return done(null, user);}
          else {
            req.flash('username', username);
            return done(null, false);
    } });})); 
module.exports = passport;





 // 페이지 경로 >> Home
 app.get('/', function(req, res){
  res.render('home/welcome');
});
//프로필 창으로 
app.get('/profile', function(req, res){
  res.render('home/profile');
});
// 로그인 창으로 
app.get('/login', function (req,res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    username:username, errors:errors
  });
});
// 로그인 정보 post로 보내기 
app.post('/login',
  function(req,res,next){
    var errors = {};
    var isValid = true;
    // isvalid true면 실행 
    if(isValid){
      next();}},
      passport.authenticate('local-login', {
        successRedirect : '/posts',
        failureRedirect : '/login'}));
// 로그아웃 
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});



// 페이지 경로 >> Profile 
app.get('/members/jin',function(req,res){
  res.render('members/jin');
})
app.get('/members/jimin',function(req,res){
  res.render('members/jimin');
})
app.get('/members/suga',function(req,res){
  res.render('members/suga');
})
app.get('/members/jhope',function(req,res){
  res.render('members/jhope');
})
app.get('/members/jungguk',function(req,res){
  res.render('members/jungguk');
})
app.get('/members/RM',function(req,res){
  res.render('members/RM');
})
app.get('/members/V',function(req,res){
  res.render('members/V');
})




// 8080 포트 실행 
var port = 8080;
app.listen(port, function(){
  console.log('BTS 서버에 연결합니다');
});
