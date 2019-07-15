var crypto = require('crypto');

var BigInteger = require('bigi'); //npm install --save bigi@1.1.0
var ecurve = require('ecurve'); //npm install --save ecurve@1.0.0
var cs = require('coinstring'); //npm install --save coinstring@2.0.0
var ecparams = ecurve.getCurveByName('secp256k1',"",""); //remember to remove 2nd and 3rd param from names.js
var Hash = require('./build/forge-sha256.min.js');
//var Buffer = require('buffer/').Buffer;


window.ECExponent = function (gx, expo){

  var exponent = new Buffer(expo, 'hex');
  var xpt = new Buffer(gx, 'hex')
  var pt = ecparams.pointFromX(true,BigInteger.fromBuffer(xpt));
  var curvePt = pt.multiply(BigInteger.fromBuffer(exponent));

  return [String(curvePt.affineX), String(curvePt.affineY)];
}

window.ECInverse = function (key) {
  var privateKey = BigInteger(String(key));
  var privateKeyInv = privateKey.modInverse(ecparams.n) ;

  return privateKeyInv.toString();
}

window.HashtoPoint = function (gx){

  var xpt = BigInteger(String(gx));
  var bufxpt = Buffer(forge_sha256(String(gx)),'hex');;
  var pt = ecparams.pointFromX(true,xpt);
  while(ecparams.isOnCurve(pt)==false)
  {
    bufxpt = Buffer(forge_sha256(Buffer.toString()),'hex');
    pt = ecparams.pointFromX(true,BigInteger.fromBuffer(bufxpt));
    console.log(String(bufxpt)+" pt: "+String(pt.affineX));
  }
  return [String(pt.affineX), String(pt.affineY)]
}

window.ECModExponent = function (gx, expo){

  var exponent = BigInteger(String(expo));
  var xpt = BigInteger(String(gx));
  var pt = ecparams.pointFromX(true,xpt);
  var curvePt = pt.multiply(exponent);

  return [String(curvePt.affineX), String(curvePt.affineY)];
}
