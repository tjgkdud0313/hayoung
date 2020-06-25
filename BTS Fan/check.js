var check = {};
// 로그인 접근제한 
// 로그인 되었을때만 다음으로 넘어갈 수 있도록  
check.isLoggedin = function(req, res, next){
  if(req.isAuthenticated()){
    next();
  }
}

// 입장 안되면 로그아웃 되면서 다시 로그인 창으로 
check.noPermission = function(req, res){
  req.logout();
  res.redirect('/login');
}

check.getPostQueryString = function(req, res, next){
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){    
    var queryString = '';
    var queryArray = [];

    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&');
    return queryString;
  }
  next();
}


module.exports = check;