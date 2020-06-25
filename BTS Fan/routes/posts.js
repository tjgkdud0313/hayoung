var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var check = require('../check');


// 전체 게시판 화면
router.get('/', async function(req, res){
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));
  page = !isNaN(page)?page:1;
  // 30개로 갯수 설정하기 
  limit = !isNaN(limit)?limit:30;

  var posts = await Post.find({})
    .populate('author')
    // 나중에 온 DB가 위로 가도록 정렬
    .sort('-createdAt')
    .limit(limit)
    .exec();

    
  res.render('posts/index', {
    posts:posts,
    limit:limit
  });
});



// isLoggedin으로 로그인 접근제한 
router.get('/new', check.isLoggedin, function(req, res){
  var post = req.flash('post')[0] || {};
   var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors });
});


// 새로운 게시글 
router.post('/', check.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Post.create(req.body, function(err, post){
    res.redirect('/posts'+res.locals.getPostQueryString(false, {page:1}));
  });
});

// 게시물 자세히 
router.get('/:id', function(req, res){
  Post.findOne({_id:req.params.id})
    .populate('author')
    .exec(function(err, post){
      res.render('posts/show', {post:post});
    });
});


// 게시물 삭제하기
router.delete('/:id', check.isLoggedin, checkPermission, function(req, res){
  // 데이터 베이스에서 삭제
  Post.deleteOne({_id:req.params.id}, function(err){
    res.redirect('/posts'+res.locals.getPostQueryString());
  });
});


module.exports = router;

// 확인
function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(post.author != req.user.id) return check.noPermission(req, res);
    next();
  });
}
