var crypto = require('crypto')

var BigInteger = require('bigi') //npm install --save bigi@1.1.0
var ecurve = require('ecurve') //npm install --save ecurve@1.0.0
var cs = require('coinstring') //npm install --save coinstring@2.0.0

var privateKey = new Buffer("1184cd2cdd640ca42cfc3a091c51d549b2f016d454b2774019c2b2d2e08529fd", 'hex')
var ecparams = ecurve.getCurveByName('secp256k1','5983457393445793454353453','675438259837873')
var curvePt = ecparams.G.multiply(BigInteger.fromBuffer(privateKey))

var xpt = new Buffer("5983457393445793454353453", 'hex')
var pt = ecparams.pointFromX(true,BigInteger.fromBuffer(xpt));

var privst1 = BigInteger.fromBuffer(privateKey);
var privateKeyInv = privst1.modInverse(ecparams.n) ;

var generator = curvePt.multiply(privateKeyInv);

var x = curvePt.affineX.toBuffer(32)
var y = curvePt.affineY.toBuffer(32)

var publicKey = Buffer.concat([new Buffer([0x04]), x, y])
console.log(publicKey.toString('hex'))
// => 04d0988bfa799f7d7ef9ab3de97ef481cd0f75d2367ad456607647edde665d6f6fbdd594388756a7beaf73b4822bc22d36e9bda7db82df2b8b623673eefc0b7495

//alternatively
publicKey = curvePt.getEncoded(false) //false forces uncompressed public key
console.log(publicKey.toString('hex'))
// => 04d0988bfa799f7d7ef9ab3de97ef481cd0f75d2367ad456607647edde665d6f6fbdd594388756a7beaf73b4822bc22d36e9bda7db82df2b8b623673eefc0b7495

//want compressed?
publicKey = curvePt.getEncoded(true) //true forces compressed public key
console.log(publicKey.toString('hex'))
// => 03d0988bfa799f7d7ef9ab3de97ef481cd0f75d2367ad456607647edde665d6f6f

var sha = crypto.createHash('sha256').update(publicKey).digest()
var pubkeyHash = crypto.createHash('rmd160').update(sha).digest()

// pubkeyHash of compressed public key
console.log(pubkeyHash.toString('hex'))
// => a1c2f92a9dacbd2991c3897724a93f338e44bdc1s

// address of compressed public key
//document.getElementById('response').innerHTML = (cs.encode(pubkeyHash, 0x0))  //<-- 0x0 is for public addresses
// => 1FkKMsKNJqWSDvTvETqcCeHcUQQ64kSC6s

document.getElementById('response').innerHTML = String(pt.affineX);

console.log(cs.encode(privateKey, 0x80)) //<--- 0x80 is for private addresses
// => 5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD

console.log(cs.encode(Buffer.concat([privateKey, new Buffer([0])]), 0x80)) // <-- compressed private address
// => KwomKti1X3tYJUUMb1TGSM2mrZk1wb1aHisUNHCQXTZq5aqzCxDY
