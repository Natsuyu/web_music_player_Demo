var express = require('express');
var router = express.Router();
var path = require('path');
var media = path.join(__dirname, '../public/music');
/* GET home page. */
router.get('/', function(req, res, next) {
	var fs = require('fs');
	fs.readdir(media, function(err, names){
		res.render('index', { title: 'Natsuyu Music', music: names, path: media});
	})
});

module.exports = router;
