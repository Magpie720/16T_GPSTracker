const http = require('http');
const express = require('express');
const crypto = require('crypto');
const socketIO = require('socket.io');
const key = require('./api/key.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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
  getData();
  server.listen(8080, function() {
    console.log('listening on 8080 -> 80')
  })
})

let coord01, coord02, coord03
function getData() {
  db.collection('coordinate_01').find().toArray(function(err, result){
    coord01 = result
    db.collection('coordinate_02').find().toArray(function(err, result){
      coord02 = result
      db.collection('coordinate_03').find().toArray(function(err, result){
        coord03 = result
      })
    })
  })
  return {coord01, coord02, coord03};
}

function getColor(a) {
  if (a == "1") {
    return "#800000"
  }else if (a == "2") {
    return "#800080"
  }else if (a == "3") {
    return "#008080"
  }
}

io.on('connection', (socket) => {
  console.log('socket connected');

  socket.on('message', (data) => {
    let m = data;
    if (["coord01", "coord02", "coord03"].includes(data)) {
      let coord = getData()[m];
      data = coord[coord.length - 1];
      socket.emit("response", data.lat + "," + data.lon);
    }
  });
});

app.get('/', function(req, res) { 
  res.sendFile(__dirname +'/index.html')
})

app.get('/write', function(req, res) { 
  res.sendFile(__dirname +'/write.html')
})

app.get('/main', function(req, res) { 
  res.sendFile(__dirname +'/Main_page.html')
})

app.get('/map_line', function(req, res) { 
  let machineQ = req.query.machine || "1";
  // let dateQ = req.query.date || undefined;
  let startDateValue = req.query["start_date"] || undefined;
  let endDateValue = req.query["end_date"] || undefined;
  let coords = getData();
  let machines = [];
  let machine;
  let lastCoords = [];

  function convertCoordDateTime(coord) {
    let temDate = "20" + coord.date.match(/.{1,2}/g).reverse().join('-');
    let temTime = ("000000" + coord.time).slice(-8).match(/.{1,2}/g).join(':').substring(0, 8) + '.000';

    const newDateTime = new Date(new Date(temDate + "T" + temTime).getTime() + (9 * 60 * 60 * 1000));
    // console.log(newDateTime + ", " + new Date(temDate + "T" + temTime));
    return newDateTime;
  }

  let startDate = new Date(startDateValue);
  let endDate = new Date(endDateValue);

  if (["1", "2", "3"].includes(machineQ)) 
  {
    machine = machineQ;
  }else {
    machine = ["1", "2", "3"];
  }

  function divideArrayByTimeDifference(arr) {
    let dividedArrays = [];
    let currentArray = [arr[0]];

    for (let i = 1; i < arr.length; i++) {
      let timeDifference = convertCoordDateTime(arr[i]) - convertCoordDateTime(arr[i - 1]);

      if (timeDifference > 10 * 60 * 1000) {   // 나누는 기준을 10 분으로 설정
        dividedArrays.push(currentArray);
        currentArray = [];
      }

      currentArray.push(arr[i]);
    }

    dividedArrays.push(currentArray);

    return dividedArrays;
  }

  for (const Coord of machine) {
    var coord = coords["coord0" + Coord];
    if (startDateValue) {
      coord = coord.filter(coord => (convertCoordDateTime(coord) >= startDate));
    }
    if (endDateValue) {
      coord = coord.filter(coord => (convertCoordDateTime(coord) <= endDate));
    }

    lastCoords.push({coord: coord[coord.length - 1], color: getColor(Coord)});
    coord = divideArrayByTimeDifference(coord);

    for (const c of coord) {
      machines.push({coord:c, color: getColor(Coord)});
      // console.log(coord.length);
    }
  }
  
  res.render("map_line.ejs", {machineQ, dateValue: [startDateValue, endDateValue], machines, lastCoords});
})

app.get('/map_setting', function(req, res) { 
  let machineQ = req.query.machine || "1";
  let coord = getData()["coord0" + machineQ];
  let data = coord[coord.length - 1];
  res.render("map_setting.ejs", {machineQ, data, color: getColor(machineQ)});
})

app.get('/list', function(req, res) {
  res.render("list.ejs", getData());
})
  
app.post('/add', function(req, res){
  let inPW = crypto.createHash('sha512').update(req.body.password).digest('base64');
  db.collection('config').findOne({name: 'password'}, function(err, result){
      if(result.value == inPW) {
        db.collection('config').findOne({name: 'count'}, function(err, result){
          var mycount = result.value;
          if(mycount >= 100) {res.render('alert', {msg: '등록된 데이터가 너무 많습니다.'}); return;}
          db.collection('coordinate_01').insertOne( { lat : parseFloat(req.body.lat).toFixed(15), lon : parseFloat(req.body.lon).toFixed(15) } , function(){
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
        db.collection('coordinate_01').deleteOne({_id: new mongodb.ObjectID(req.body.coordinate)}, function(err, result){
          db.collection('config').updateOne({name: 'count'},{ $inc: {value: -1} });
          console.log("_id: " + req.body.coordinate + " deleted");
          res.render('alert', {msg: req.body.coordinate + " 데이터를 삭제하였습니다."});
        });
      }
      else {res.render('alert', {msg: '잘못된 비밀번호입니다.'});}
  })
});

function addData(collName, req, res) {
  db.collection(collName).insertOne( 
    { lat : parseFloat(req.body.lat).toFixed(6), lon : parseFloat(req.body.lon).toFixed(6), date : req.body.date, time : req.body.time, speed : req.body.speed, course : req.body.course, alt : req.body.alt },
    function(){
      //db.collection('config').updateOne({name: 'count'},{ $inc: {value: 1} });
      //console.log(req.body.lat+', '+req.body.lon+" added");
      prevLat = req.body.lat;
      prevLon = req.body.lon;
      res.status(201).send();
    });
}

app.post('/update', function(req, res){
  db.collection('config').findOne({name: 'password'}, function(err, result){
    if(result.value == req.body.key) {
      //db.collection('config').findOne({name: 'count'}, function(err, result){
        //var mycount = result.value;
        //if(mycount >= 100) {res.status(401).send(); return;}});
      if(prevLat == req.body.lat && prevLon == req.body.lon) {res.status(200).send(); return;}
      switch(req.body.id) {
        case "1": 
          addData("coordinate_01", req, res);
          break;
        case "2":
          addData("coordinate_02", req, res);
          break;
        case "3":
          addData("coordinate_03", req, res);
          break;
        default:
          console.log("wrong id");
          res.status(401).send();
      }
    }
    else {
      console.log("wrong pw");
      res.status(401).send();
    }
  })
});
