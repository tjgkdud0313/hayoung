var mongoose = require('mongoose');


// NOSQL 테이블 정의되어있지 않으므로 스키마로 오류 방지 
// post DB에 제목, 내용, 작성자, 게시일  
var postSchema = mongoose.Schema({
  title:{type:String, required:[true,'Title is required!']},
  body:{type:String, required:[true,'Body is required!']},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  createdAt:{type:Date, default:Date.now},
});


// 모델 생성, 다른 파일에서 쓰도록 export하기 
var Post = mongoose.model('post', postSchema);
module.exports = Post;