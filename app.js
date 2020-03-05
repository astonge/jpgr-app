var express = require('express');
var fileUpload = require('express-fileupload');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var dospaces = require('aws-sdk');
var moment = require('moment');
var auth = require('./auth');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');



// dospaces.config.update({
//     accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
//     secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY
// });
dospaces.config.loadFromPath('./do_config.json');
console.log("Loaded DO Config Keys...");
var jpgrBucket = 'jpgr-wtf';
var spacesEndpoint = new dospaces.Endpoint('nyc3.digitaloceanspaces.com');
var s3 = new dospaces.S3({endpoint:spacesEndpoint});

var imgdb;
MongoClient.connect('mongodb://localhost:27017/jpgr', (err, database) => {
	if (err) {
		return console.log("ERROR MONGO DATABASE: NO CONNECTION");
	}
	imgdb = database;
});

// var db = require('./db');

// passport.use(new Strategy(
// 	function(username, password, cb) {
// 		db.users.findByUsername(username, function(err, user) {
// 			if (err) { return cb(err); }
// 			if (!user) { return cb(null, false); }
// 			if (user.password != password) { return cb(null, false); }
// 			return cb(null, user);
// 		});
// 	}));

// 	passport.serializeUser(function(user, cb) {
// 		cb(null, user.id);
// 	});

// 	passport.deserializeUser(function(id, cb) {
// 	  db.users.findById(id, function (err, user) {
// 	    if (err) { return cb(err); }
// 	    cb(null, user);
// 	  });
// 	});


var app = express();
app.locals.moment = moment;
app.locals.shortDateFormat = "ddd @ h:mmA";

auth(passport);
app.use(passport.initialize());

app.set('title','jpgr');
app.use(express.static('public'));
app.set('views',__dirname + '/views');
app.set('view engine','ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.

app.use(cookieSession({
	name: 'session',
	keys: ['123']
}));

app.use(require('cookie-parser')());
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb', extended: true}));
var jsonParser = bodyParser.json();
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(fileUpload());



app.use(passport.initialize());
app.use(passport.session());

	// var objid = new ObjectID();
	// console.log(objid.toHexString());

// render the index page
app.get('/', function(req,res) {
	imgdb.collection('jpgr').find().sort({file:-1}).toArray(function(err, results) {
		if(req.session.token) {
			console.log('Token is set.');
			res.cookie('token',req.session.token);
			res.render('index', { user: req.user.profile, images:results });
		} else {
			res.cookie('token','');
			res.render('index', { user: 0, images:results });
		}
		
	});
});

app.get('/auth/google', passport.authenticate('google', {
	scope: ['https://www.googleapis.com/auth/userinfo.profile']
}));

app.get('/auth/google/callback', passport.authenticate('google', {
		failureRedirect: '/'
	}),
	(req, res) => {
		req.session.token = req.user.token;
		console.log('Token is set.');
		res.redirect('/');
	}
);

app.get('/view/:id',function(req, res) {
	imgdb.collection('jpgr').find({_id:req.params["id"]}).toArray(function(err, result) {
		if(err) {
			console.log("ERROR!? "+err);
		}
		res.render('view', { user: req.user.profile, images:result});
	});
});

// render the login page
app.get('/login',
  function(req, res){
    res.render('login', {user: req.user});
});
// handle the login page POST requests
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
		res.redirect('/');
});

app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
		console.log(req.user.profile);
    res.render('profile', { user: req.user.profile });
});

app.post('/upload', require('connect-ensure-login').ensureLoggedIn(), function(req,res) {
	if(!req.body.filename)
		return res.status(400).send('No Files');

	// console.log(req.files.upl.name);
	// var fileKey = Date.now()+"_"+req.files.upl.name;
	var fileKey = Date.now()+"_"+req.body.filename;
	console.log("Filename: "+fileKey);
  console.log("User: "+req.user.id);
	// var params = {Bucket: jpgrBucket, Key: fileKey, Body: req.body.imagedata, ACL:'public-read' };

	// Upload to DO Spaces
	var fileHash;
	// console.log(params);
	buf = new Buffer(req.body.imagedata.replace(/^data:image\/\w+;base64,/,""),'base64');
	var params = {
		Bucket: jpgrBucket,
		Key: fileKey,
		Body: buf,
		ACL:'public-read',
		// ContentEncoding: 'base64',
		ContentType: 'image/jpeg'
	};
	res.status(200).send("THANKS");
	s3.putObject(params, function(err, data) {
		if (err)
			console.log(err);
		else
			console.log("UPLOADED TO "+jpgrBucket+"/"+fileKey);
			fileHash = data['ETag'].replace(/["]+/g,'');
			console.log('ETag: '+fileHash);
			var objid = new ObjectID();
			console.log(objid.toHexString());
			// Save info to Database.
			imgdb.collection('jpgr').save( 
					{
						_id:objid.toHexString(),
						file:fileKey,
						title:"IMAGETITLE",desc:"IMAGEDESC",
						user_id:req.user.profile.id,
						date:Date.now()
					}, function(err, result) {
				if (err) return console.log(err);
				console.log('Saved to database..');
			});
	});
});

app.post('/edit', jsonParser, require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
	
	var objId = new ObjectID.createFromHexString(req.body.id);
	imgdb.collection('jpgr').update({_id:objId.toHexString()}, {$set: {title: req.body.title, desc:req.body.desc}}, false, function(err, result) {
			if (err) return console.log(err);
			console.log("image updated");
		});
});

app.post('/delete', jsonParser, require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
	// console.log(req.body.id);
	// console.log("/delete/"+req.body.id);
	var objId = new ObjectID.createFromHexString(req.body.id);
	imgdb.collection('jpgr').deleteOne({_id:objId.toHexString()}, function(err,result) {
		if (err) {
			console.log("Unable to delete image.");
			return console.log(err);
		}
		console.log(result+". image ("+req.body.id+") removed");
	});
	res.redirect('/');
});

app.listen(5000);
console.log('STARTING SERVER http://127.0.0.1:5000');
