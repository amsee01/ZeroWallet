var crypto = require('crypto');

var BigInteger = require('bigi'); //npm install --save bigi@1.1.0
var ecurve = require('ecurve'); //npm install --save ecurve@1.0.0
var cs = require('coinstring'); //npm install --save coinstring@2.0.0
var ecparams = ecurve.getCurveByName('secp256k1',"",""); //remember to remove 2nd and 3rd param from names.js
//var Buffer = require('buffer/').Buffer;

exports.ECInverse = function (key) {
  var privateKey = new Buffer(key, 'hex')
  var privst1 = BigInteger.fromBuffer(privateKey);
  var privateKeyInv = privst1.modInverse(ecparams.n) ;

  return privateKeyInv;
}

exports.HashtoPoint = function (gx){

  var xpt = new Buffer(String(gx), 'hex')
  var pt = ecparams.pointFromX(true,BigInteger.fromBuffer(xpt));

  return [String(pt.affineX), String(pt.affineY)];

}

exports.ECExponent = function (gx, expo){

  var exponent = BigInteger(String(expo));
  var xpt = BigInteger(String(gx));
  var pt = ecparams.pointFromX(true,xpt);
  var curvePt = pt.multiply(exponent);

  return [String(curvePt.affineX), String(curvePt.affineY)];

}
