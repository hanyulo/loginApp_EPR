var express = require('express');
var router = express.Router();
// http://passportjs.org/docs/configure
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var userHandler = require('../models/UserHandler')
var User = require('../models/User')

// Register  // cilck register and go to register page
router.get('/register', function(req, res){
	res.render('register');
});

// Login //go to Login page
router.get('/login', function(req, res){
	res.render('login');
});

// when use submit register form
router.post('/register', function(req, res){
	// prerequisite: BodyParser Middleware in app.js
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// form content validation system
	// prerequisite: Express Validator in app.js
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	var errors = req.validationErrors();
	if(errors) {
		// pass local variable errors to views page
		// the variable name is errors
		// according the express validator the errors object contain three properties
		// param, msg. value. in this case we only have two properties
		// param and msg
		// https://expressjs.com/en/api.html#res.locals
		res.render('register',{
			errors:errors
		});
	}else {
		console.log('you are good')
		var newUser = new User(name,email,username,password);

    userHandler.createUser(newUser, function(err, user){
			if(err) throw err;
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});

// local strategy get username during the req cycle
// https://github.com/jaredhanson/passport-local
passport.use(new LocalStrategy({
    usernameField: 'email',
  },
  function(email, password, done) {
    userHandler.getUserByEmail(email, function(err, user){
      if(err) throw err;
     	if(!user){
     		return done(null, false, {message: 'Unknown email'});
     	}

     	userHandler.comparePassword(password, user.password, function(err, isMatch){
     		if(err) throw err;
     		if(isMatch){
     			return done(null, user);
     		} else {
     			return done(null, false, {message: 'Invalid password'});
     		}
     	});
    });
  }));

// https://github.com/Automattic/mongoose/issues/548#issuecomment-2245903
// http://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
// after user login, passport need to serialize user instance to token
// store it into the browser cookie for keeping user in login state
passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
  userHandler.getUserById(email, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });


router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});


module.exports = router;
