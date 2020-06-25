
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// 유저 모델 스키마 설정 
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'아이디를 입력해주세요'],
    //정규표현식 
    match:[/^.{4,12}$/,'4-12자의 소문자여야 합니다'],
    trim:true,
    unique:true
    
  },
  password:{
    type:String,
    required:[true,'비밀번호를 입력해주세요'],
    // 비밀번호 조건은 아래에 
    select:false

  },
  name:{
    type:String,
    required:[true,'이름을 입력해주세요'],
    //정규표현식
    match:[/^.{3,12}$/,'3-12자여야 합니다'],
    trim:true
  },
 
},{
  toObject:{virtuals:true}
});


// virtuals
// 데이터 베이스에 저장 안되는 정보들 처리
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });


// password 조건 
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = '소문자와 숫자를 포함한 8자 이상이어야 합니다';


// 비밀번호 확인 
userSchema.path('password').validate(function(v) {
  var user = this;
  if(user.isNew){
    if(!user.passwordConfirmation){
      user.invalidate('passwordConfirmation', '비밀번호를 확인해주세요');
    }
    if(!passwordRegex.test(user.password)){
      user.invalidate('password', passwordRegexErrorMessage);
    }
  }
});

// 비밀번호 암호화해서 저장 
userSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')){
    return next();
  }
  else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});


userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// 모델 생성, 다른 파일에서 쓸 수 있게 export
var User = mongoose.model('user',userSchema);
module.exports = User;













