var http = require('http');
var ECC = require('./ECCLibServer');
var express=require('express');
var bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4');
const cryptoS = require('crypto');
var cors = require('cors');

var app=express();
app.use(cors());
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'HOST',
  user     : 'USER',
  password : 'PASSWORD',
  database : 'DB'
});

connection.connect();

app.post('/', urlencodedParser, function(req,res){
  connection.query("SELECT * FROM Store WHERE user = '".concat(String(req.body.u),"';"), function(error, results, fields){

    if (typeof results[0] === 'undefined') {
      var key = cryptoS.createHash('sha256').update(String(uuidv4()).concat(String(uuidv4())));
      key = key.digest('hex');
      console.log (key);
      var Beta = ECC.ECExponent(String(req.body.a), String(key));

      connection.query("INSERT INTO `Store` (`user`, `store`) VALUES ('".concat(String(req.body.u),"', '",String(key),"');"), function(error, results, fields){
          if(error){
            console.log(error);
          }
      });

      res.send(Beta[0]);
    }else {

      var key = cryptoS.createHash('sha256').update(String(results[0].store));
      key = key.digest('hex');
      console.log (key);
      var Beta = ECC.ECExponent(String(req.body.a), String(key));
      res.send(Beta[0]);
    }
  });

});

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

var server = app.listen(port, function(){

});
