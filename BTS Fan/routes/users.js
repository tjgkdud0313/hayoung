var express = require('express');
var router = express.Router();
var User = require('../models/User');
var check = require('../check');


router.get('/new', function(req, res){
  var user = req.flash('user')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors});
});


// 회원가입 유저 생성 
router.post('/', function(req, res){
  // User model에 create하기 
  User.create(req.body, function(err, user){
    if(err){
      req.flash('user', req.body);
      return res.redirect('/users/new');
    }
    res.redirect('/');
  });
});


// 내 정보 보여주기 
router.get('/:username', check.isLoggedin, checkPermission, function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    res.render('users/show', {user:user});
  });
});



module.exports = router;


function checkPermission(req, res, next){
  User.findOne({username:req.params.username}, function(err, user){
    if(user.id != req.user.id) return check.noPermission(req, res);

    next();
  });
}