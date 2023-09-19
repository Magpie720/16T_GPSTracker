const express = require('express');
const crypto = require('crypto');
const key = require('./api/key.js');
const app = express();
app.use(express.json());
app.use(express.urlencoded( {extended : false } ));
app.use(express.static("api"));
const mongodb = require('mongodb');
app.set('view engine', 'ejs');
var db, prevLat=null, prevLon=null;
mongodb.MongoClient.connect(key.mongo, function(err, client){
  if (err) return console.log(err)
  db = client.db('GPS');
  console.log('DB connected')
  app.listen(8080, function() {
    console.log('listening on 8080 -> 80')
  })
})


app.get('/', function(req, res) { 
  res.sendFile(__dirname +'/index.html')
})

app.get('/write', function(req, res) { 
    res.sendFile(__dirname +'/write.html')
})

app.get('/map', function(req, res) { 
  db.collection('coordinate').find().toArray(function(err, result){
    res.render('map.ejs', {coords : result})
  })
})

app.get('/list', function(req, res) {
  db.collection('coordinate').find().toArray(function(err, result){
    res.render('list.ejs', {coords : result})
  })
})
  
app.post('/add', function(req, res){
  let inPW = crypto.createHash('sha512').update(req.body.password).digest('base64');
  db.collection('config').findOne({name: 'password'}, function(err, result){
      if(result.value == inPW) {
        db.collection('config').findOne({name: 'count'}, function(err, result){
          var mycount = result.value;
          if(mycount >= 100) {res.render('alert', {msg: '등록된 데이터가 너무 많습니다.'}); return;}
          db.collection('coordinate').insertOne( { lat : parseFloat(req.body.lat).toFixed(15), lon : parseFloat(req.body.lon).toFixed(15) } , function(){
            db.collection('config').updateOne({name: 'count'},{ $inc: {value: 1} })
            console.log("_id: " + (parseInt(mycount)+1) + " added")
            res.render('alert', {msg: (parseInt(mycount)+1) + "번 데이터를 추가하였습니다."});
          });
        });
      }
      else {res.render('alert', {msg: '잘못된 비밀번호입니다.'});}
  })
});

app.post('/delete', function(req, res){
  let inPW = crypto.createHash('sha512').update(req.body.password).digest('base64');
  db.collection('config').findOne({name: 'password'}, function(err, result){
      if(result.value == inPW) {
        db.collection('coordinate').deleteOne({_id: new mongodb.ObjectID(req.body.coordinate)}, function(err, result){
          db.collection('config').updateOne({name: 'count'},{ $inc: {value: -1} });
          console.log("_id: " + req.body.coordinate + " deleted");
          res.render('alert', {msg: req.body.coordinate + " 데이터를 삭제하였습니다."});
        });
      }
      else {res.render('alert', {msg: '잘못된 비밀번호입니다.'});}
  })
});

app.post('/update', function(req, res){
  db.collection('config').findOne({name: 'password'}, function(err, result){
      if(result.value == req.body.key) {
        //db.collection('config').findOne({name: 'count'}, function(err, result){
          //var mycount = result.value;
          //if(mycount >= 100) {res.status(401).send(); return;}
          if(prevLat == req.body.lat && prevLon == req.body.lon) {res.status(200).send(); return;}
          db.collection('coordinate').insertOne( { lat : parseFloat(req.body.lat).toFixed(6), lon : parseFloat(req.body.lon).toFixed(6) } , function(){
            db.collection('config').updateOne({name: 'count'},{ $inc: {value: 1} });
            console.log(req.body.lat+', '+req.body.lon+" added");
            prevLat = req.body.lat;
            prevLon = req.body.lon;
            res.status(201).send();
          });
        //});
      }
      else {
        console.log("wrong pw");
        res.status(401).send();
      }
  })
});