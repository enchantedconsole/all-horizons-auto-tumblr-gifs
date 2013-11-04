var phantom = require('phantom'),
  fs = require('fs'),
  exec= require('child_process').exec,
  Tumblr = require('tumblrwks'),
  server = require('node-static'),
  config = require('./config.js');

var tumblr = new Tumblr({
      consumerKey: config.key.consumerKey,
      consumerSecret: config.key.consumerSecret,
      accessToken: config.key.accessToken,
      accessSecret: config.key.accessSecret
    }, config.key.blog);



var generating;

var fileServer = new server.Server();

var image=0;
var app = require('http').createServer(function (req, res) {
  req.addListener('end', function () {
    fileServer.serve(req, res);
  }).resume();
  if (req.method == 'POST') {
      console.log("POST");
      var body = '';
      req.on('data', function (data) {
          body+=data;
      });
      req.on('end', function () {
          console.log('done: '+image);
          console.log(body.slice(0,20));
          require("fs").writeFile("tmp_img/"+image+"_out.png", body, 'base64', function(err) {
             if(err) throw err;
           });
           image++;
      });
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('post received');
  }


}).listen(8081);


function run_ph(){
  phantom.create(function(ph){
    ph.createPage(function(page){
      page.set('onConsoleMessage', function (msg) {
        console.log(msg);
      });
      page.open('http://localhost:8081', function (status) {
        console.log("status: "+status);
        console.log('open page');
        var start = Date.now();
        generating = setInterval(function(){
          t = Date.now()-start;
          console.log("generating... " + Math.floor(t/1000) + " seconds");
        },1000);
        });
    });
  });
}


run_ph();

function makeGif(){
    var id = new Date().getTime();
    var filename = 'gifs/' + id +"_anim.gif";
    var child = exec('./make_gifs.sh '+filename, function(err, stdout, stderr){
        if(err) throw err;
        var removetmp = exec('rm tmp_img/*out.png', function(err, stdout, stderr){
            if(err) throw err;
            console.log('gif animation complete');
          //  postGif(filename);
        });
    });
    console.log(id);
}

function getRandomElement(arr){
  return arr[Math.floor(arr.length*Math.random())]
}

function postGif(filename){
  var photo = fs.readFile(filename, function(err,photo){
    if (err) throw err;

    //tags
    var tag_choices= ['lines', 'minimal', 'processing', 'colors',
      'animation', 'horizon', 'geometry', 'calm'];
    var random_tag = getRandomElement(tag_choices);
    console.log("random tag: "+random_tag);
    tumblr.post('/post', {
      type: 'photo',
      data: [photo],
      tags: 'gif, '+ random_tag
    }, function(err, json){
      console.log(json, err);
      if (err) throw err;
      console.log("posted on tumblr");
      var removegif = exec('rm '+filename, function(err, stdout, stderr){
        if (err) throw err;
        console.log('deleted gif from hd');
        process.exit();
      });
    });
  });
}
