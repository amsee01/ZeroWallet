# ZeroWallet
ZeroWallet is a protocol that uses Zero Knowledge Proofs to secure private keys with low-entropy passwords. It provides the convenience of brain wallets with a security guarantee comparable to third party multi-sig setups.

## Table of Contents

- [ZeroWallet](#zerowallet)
  * [Rationale Behind ZeroWallet](#rationale-behind-zerowallet)
    + [Plain Wallets and Brain Wallets](#plain-wallets-and-brain-wallets)
    + [Multi-Sig Protocols](#multi-sig-protocols)
    + [Threshold Multi-Sig Protocols](#threshold-multi-sig-protocols)
    + [ZeroWallet - A Threshold Multi-Sig Protocol with Privacy](#zerowallet---a-threshold-multi-sig-protocol-with-privacy)
  * [Protocol Overview](#protocol-overview)
  * [Public Demo](#public-demo)
  * [How it Works](#how-it-works)
    + [Cryptographic Building Blocks](#cryptographic-building-blocks)
      - [Oblivious Pseudo-Random Functions (OPRFs)](#oblivious-pseudo-random-functions--oprfs-)
      - [Shamir Secret Sharing](#shamir-secret-sharing)
    + [Real-life Operation](#real-life-operation)
      - [Step 1: Client-side hashing and OPRF initialisation](#step-1--client-side-hashing-and-oprf-initialisation)
      - [Step 2: Server-side OPRF](#step-2--server-side-oprf)
      - [Step 3: Client-side Calculation and Completion](#step-3--client-side-calculation-and-completion)
  * [Implementation](#implementation)
    + [Libraries Used](#libraries-used)
    + [ECCLib Custom JavaScript Tool Box](#ecclib-custom-javascript-tool-box)
    + [Client End HTML](#client-end-html)
    + [Client End JavaScript Application](#client-end-javascript-application)
      - [Libraries Used](#libraries-used-1)
      - [App Code](#app-code)
    + [Server-side Code](#server-side-code)
  * [Conclusion and Future Possibilities](#conclusion-and-future-possibilities)
  * [Acknowledgements](#acknowledgements)
  * [Contact](#contact)

## Rationale Behind ZeroWallet

To understand why ZeroWallet is different from other services, it is important to consider the strengths and drawbacks of popular wallet recovery protocols. These are discussed below briefly.

### Plain Wallets and Brain Wallets
Plain wallets refer to ordinary wallets that use full entropy private keys. These include ones that use a random 256 bit string as a private key, or those that use a random combination of 12 seed phrases to secure a wallet. While such wallets have a good resistance to brute force attacks, they can be extremely difficult to remember (unless you're endowed with a photographic memory or are willing to patiently commit seemingly useless information to memory).

Brain wallets refer to those where the private key is generated from a relatively short seed phrase (like a password) which can be easily remembered and recalled. But brute forcing such wallets is especially easy, making them a hard sell even for hot wallets.

### Multi-Sig Protocols

Over the past few years, multi-sig wallets have gained popularity as the industry standard for security as far as crypto wallets are concerned. Most multi-sig setups are based on a 2/3 signing scheme i.e. there exist three private keys, of which any two can be used to sign transactions.

With typical services like [BitGo](http://bitgo.com "BitGo") or [Green Address](https://greenaddress.it/ "Green Address"), one key is held readily by the user, another by the server, and a third ‘backup’ key is stored safely by the user. When a transaction needs to be sent, the user signs the transaction with their private key, before requesting the service to complete the multisig with their server key. The service typically has a scanning algorithm in place that uses a set of parameters to check whether the transaction is legitimate (low value, transfer to known addresses etc.) before signing the transaction and completing the multisig process. In cases like these, the user depends on the service to check whether a transaction is fraudulent. This gives rise to two limitations: (a) the user must make use of the service every time they send a transaction, which exposes them to privacy risks; (b) if the private key is password derived (for easy remembrance), there is a risk of brute force attacks either by a malicious service or any adversary who views the transaction from a password derived wallet to a multi-sig smart contract on the public blockchain.

### Threshold Multi-Sig Protocols

To avoid the risk of public brute force (as is the case with password derived multi-sig protocols), threshold multi-sig protocols make use of secret sharing schemes that allow for the recovery of a private key using a threshold number of secret shares.

The [ZenGo](https://zengo.com/ "ZenGo") wallet is one such example; although it claims to be 'keyless', it uses a 2/3 secret sharing scheme to secure your private key. While this does prevent public brute force protection, a password based user key does not protect against a malicious server and continues to expose the user to privacy risks.

### ZeroWallet - A Threshold Multi-Sig Protocol with Privacy
As an alternative to these services, I created a protocol — named Zero Wallet — which uses a similar 2/3 secret sharing setup as threshold multi-sig protocols without the need to authenticate with the server each time a transaction needs to be signed. I was particularly fascinated by the [OPAQUE](https://eprint.iacr.org/2018/163.pdf "OPAQUE") Password Authenticated Key Exchange (PAKE) protocol, which has been adapted to a cryptocurrency setting in this project. This approach avoids any censorship potential on the part of the third party whilst providing a convenient way for users to recover a private key using only passwords. It should be noted that the low entropy of passwords means that a server brute force attack is still possible, but a public one isn't. The comparison of ZeroWallet with other wallet recovery protocols is as below:

![Comparison with Existing Protocols](http://zerowallet.me/zerowalletcompare.png "Comparison with Existing Protocols")

## Protocol Overview
![](https://miro.medium.com/max/1050/1*mKc2lbcQR-Iyzx8sa3tAqg.png)
Your private key is split into three shares (see fig. above). You always hold two shares (one of your passwords and a backup share). The server holds no share but retains a secret key which can transform your second password into another share. So, with this protocol, you can generate two shares and use them to retrieve your private key on the go.

We make use of Zero-knowledge Proofs to ensure that the server never learns the output of share 2. Share 1 and share 3 are computed client end without server interaction. It should also be noted that the server's secret key is computed randomly and independently from share 2, making it impossible to derive the share from only the secret key. The protocol is designed such that even though the same username and password combinations result in the same decrypted private key each time, the data transmitted to the server is indistinguishable from random. This means that the server learns nothing even if it collects multiple interactions with the user.

We recognize that storing the private key is risky; instead, the user stores the 'backup share'. This, in conjunction with their fist password, can be used to recover the private key without the need of the server. However, the private share alone (without the password) reveals no meaningful information about the private key.

## Public Demo
Visit the project website [here](http://zerowallet.me "here").

![](https://miro.medium.com/max/2627/1*w2wwr-WCL3AfpIRTIParqw.png)

The public demo can be found at [app.zerowallet.me](http://app.zerowallet.me "app.zerowallet.me").

## How it Works

### Cryptographic Building Blocks
This protocol presents a practical implementation of the OPAQUE protocol for password authenticated key exchange (PAKE). We repurpose parts of the OPAQUE protocol to provide secure access to private keys.

#### Oblivious Pseudo-Random Functions (OPRFs)
At the core of this solution lies the construction of an Oblivious Pseudo-Random Function (OPRF).

A regular PRF has uses two inputs: a key and some data. The output of a PRF is a string that is indistinguishable from random. Oblivious PRFs work much the same way as regular PRFs, except that the key for the OPRF is supplied by one party and the data input by another. The interesting point to capture is that neither party sees the other’s inputs and only one of the two parties learns the result.

The following OPRF implementation is drawn from the OPAQUE protocol and makes use of elliptic curve cryptography:

1. First, users pick a random value r and a password pw.
2. They calculate H(pw), where H represents a one-way hash function
3. They use H(pw) to calculate a point P on the elliptic curve. This point serves as the generator for an exponentiation function.
4. They calculate ∝ = (P)ʳ and send ∝ to the server.
5. The server then calculates β = ∝ᴷˢ where Ks is a random, private value held by the server for each registered user. Ks is the only information stored by the server for each user and is generated upon registration.
6. β is then sent back to the user. The user first calculates m = ModInv(r)and then rw = βᵐ.
7. H(pw, βᵐ) is the randomized output of the OPRF.

A few points that highlight the qualities of this OPRF:

- The password is low entropy, and hence brute-forcing H(pw) would be relatively easy for the server. This is why the hash of the password serves only as a generator point which is multiplied by a large scalar r. Deriving the generator point from the output without knowing the random scalar r is a hard problem.
- Similarly, for the user to calculate the value of Ks from β and the generator point ∝ is hard as well.
- m is the modulo inverse of the random scalar r, which the user can easily compute knowing r. This makes calculating rw easy for the user.
- As rw=H(pw)ᴷˢ and H(pw, βᵐ) is the output of the OPRF, for the same pw, Ks pair, the output of the OPRF is always the same despite the application of a random, different r each time the OPRF is run.

#### Shamir Secret Sharing

> In a secret sharing scheme there is one dealer and n players. The dealer gives a secret to the players, but only when specific conditions are fulfilled. The dealer accomplishes this by giving each player a share in such a way that any group of t (for threshold) or more players can together reconstruct the secret but no group of less than t players can. Such a system is called a (t,n)-threshold scheme.

Shamir's Secret Sharing Scheme is one such (t,n)-threshold scheme. The scheme relies on the Polynomial Interpolation property that an n degree polynomial can be reconstructed from (n+1) points on the curve of the polynomial.

This (t,n)-threshold scheme is implemented by constructing a polynomial of degree (t-1) and choosing n points on the polynomial as shares to distribute to players.

### Real-life Operation
The operation of this protocol can be broken into three steps.

#### Step 1: Client-side hashing and OPRF initialisation
1. The user types in their user name (usr), 1st password (pw1) and 2nd password (pw2).
2. pw1, pw2 and usr are hashed. ∝ is calculated based on H(pw1) and a random 256-bit string r.
3. H(usr) and ∝ are transmitted to the server as a POST request.

#### Step 2: Server-side OPRF
1. The server uses H(usr) to retrieve the random Ks associated with the user attempting to login from a MySQL database. If no such user exists, a random Ks is generated and inserted into the MySQL database.
2. The server uses the Ks to calculate β and send it back as a response to the POST request.

#### Step 3: Client-side Calculation and Completion
1. The client uses the obtained β from the server to first calculate m = ModInv(r)and then rw = βᵐ. H(pw1, rw) is the final output of the OPRF.
2. It uses H(pw2) and H(pw1, rw) as two shares for a (2, 3) Shamir’s Secret Sharing Scheme. It generates the secret based on these two shares and hashes it to make it a valid 256-bit Ethereum private key.
3. It uses this secret to generate a third secret share.
4. Both the private key and secret share are output, along with corresponding bar codes for easy scanning.
5. The user can then proceed to unlock their wallet with the private ket and store the secret share safely in case the server ever goes offline and their unique Ks is lost.

## Implementation
### Libraries Used
This protocol makes use of the cryptocoinjs library for most of its functionality. Specifically, it uses the [ecurve](http://cryptocoinjs.com/modules/crypto/ecurve/?source=post_page--------------------------- "ecurve") module to carry out operations on elliptic curves. Although this library is designed for Node.js, it works well with [Browserify](https://scotch.io/tutorials/getting-started-with-browserify?source=post_page--------------------------- "Browserify"), a tool that allows many common node libraries to be used on the browser as well.

I also made use of the [Forge SHA-256 library](https://github.com/brillout/forge-sha256?source=post_page--------------------------- "Forge SHA-256 library") for easy hashing and the [PDF417](https://github.com/bkuzmic/pdf417-js?source=post_page--------------------------- "PDF417") library to generate barcodes. The [Decimal](https://github.com/MikeMcl/decimal.js/?source=post_page--------------------------- "Decimal") library was used to handle variables of arbitrary length (like BigIntegers) and [Secrets](https://github.com/grempe/secrets.js?source=post_page--------------------------- "Secrets") library for Shamir's Secret Sharing Scheme.

### ECCLib Custom JavaScript Tool Box
To simplify the use of elliptic curve operations, I designed a custom Javascript file called `ECCLib.js` with all the functions needed for this protocol.

```javascript
var crypto = require('crypto');
var BigInteger = require('bigi');
var ecurve = require('ecurve');
var cs = require('coinstring');
var Hash = require('./build/forge-sha256.min.js');

var ecparams = ecurve.getCurveByName('secp256k1'); //ecurve library constructor
```
This file has three functions which form the tool base needed for this protocol:

**ECExponent:** This function takes in two inputs `gx` and `expo`, which represent the x coordinate of the generator point and the exponent respectively. With `gx` it first creates a point object (line 5) using the `pointFromX()` function of the ecurve library. It then multiplies `gx` with the scalar `expo` to create a new curve point (line 6). It returns the x and the y coordinates of the newly calculated point as strings in an array (line 8).

```javascript
window.ECExponent = function (gx, expo){

  var exponent = BigInteger(String(expo));
  var xpt = BigInteger(String(gx));
  var pt = ecparams.pointFromX(true,xpt);
  var curvePt = pt.multiply(exponent);

  return [String(curvePt.affineX), String(curvePt.affineY)];
}
```
**ECInverse:** This function takes in only one input — `key` and returns the modulo inverse (line 5). To do so, it uses the `modInverse()` function from the BigInteger class, with `ecparams.n` as a parameter which represents the order of the elliptic curve used, in this case, that of the secp256k1 curve.

```javascript
window.ECInverse = function (key) {
  var privateKey = BigInteger(String(key));
  var privateKeyInv = privateKey.modInverse(ecparams.n) ;

  return privateKeyInv.toString();
}
```

**HashtoPoint:** This function takes in an input `gx` , the decimal representation of a hash, and returns the x and y coordinate of the point that corresponds to that hash. Although one would expect this operation to be fairly straightforward — perhaps using the `pointFromX()` function discussed earlier — this is not the case.

In the case of the secp256k1 curve, the order of the curve (number of points in the elliptic curve) is very close to 2²⁵⁶ (more precisely, it is fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141). All except one x-coordinates on the elliptic curve have exactly two corresponding y-coordinates. This means, that there are a little fewer than 2²⁵⁵ valid x-coordinates that have a corresponding point on the elliptic curve.

The digest of an ordinary SHA256 hash function has 2²⁵⁶ possible combinations, which means that only around half of them can generate valid points on the elliptic curve. Which is why for half of the SHA256 digests, the point returned by ecurve's `pointFromX()` function will not in fact be a valid point.

This is where I made use of ecurve's `isOnCurve()` function to check whether the point is, in fact, on the elliptic curve. If not, the program runs a loop (line 6–11), recursively calculating a new hash from the input hash until one of them finally yields a valid point on the elliptic curve. This workaround works because with every new hash, there is around a 50% probability that a valid point can be found. With the same input `gx` the while loop will run an equal number of times for each round, returning the same point each time.

```javascript
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
```
### Client End HTML
While the demo makes use of a modified HTML/CSS template, the basis for it is a simple form with three fields — user name, password 1 and password 2. The simplified version of the demo can be found as `index_standard.html`.

For the sake of simplicity, and to avoid confusion due to the custom CSS, below is a simplified version of the form that should be self-explanatory.

```html
<form id="login" action="" method="post">
  Username: <input type="text" id="username"><br>
  Password 1: <input type="password" id="pw1"><br>
  Password 2: <input type="password" id="pw2"> <br>
  <input type="submit" value="Submit">
</form>
```

### Client End JavaScript Application

#### Libraries Used

I ran Browserify on the `ECCLib.js` file to generate bundle.js

Here is the complete list of imports for index.html:

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script src="ECCLib.js"></script>
<script src="bundle.js"></script>
<script src='build/forge-sha256.min.js'></script>
<script src="bcmath-min.js" type="text/javascript"></script>
<script src="pdf417-min.js" type="text/javascript"></script>
<script src='decimal.js'></script>
<script src='secrets.min.js'></script>
```
The first import should indicate that this project makes use of JQuery. JQuery is a framework that makes use of Ajax, a javascript technology that allows this page to function asynchronously. In practical terms, what this means is that the web app functions without the need for any reloading.

To ensure that scripts only start working after the page and finished loading, I used the `$(document).ready(){}` function (line 2). Line 3 sets up a listener that executes our program code when the `login` form is submitted.

```html
<script>
$(document).ready(function(){
  $("#login").submit(function(event){
  //Code goes here
  }
}
</script>
```

With the listener set up, I introduce two functions:

`h2d(s)` takes a hexadecimal string `s` as input, and outputs a decimal. This is needed because all our `ECCLib.js` functions accept decimals as input. I won't go into the details of its working — the StackOverflow page of the function can be found [here](https://stackoverflow.com/questions/12532871/how-to-convert-a-very-large-hex-number-to-decimal-in-javascript?source=post_page--------------------------- "here").

```javascript
function h2d(s) {

    function add(x, y) {
        var c = 0, r = [];
        var x = x.split('').map(Number);
        var y = y.split('').map(Number);
        while(x.length || y.length) {
            var s = (x.pop() || 0) + (y.pop() || 0) + c;
            r.unshift(s < 10 ? s : s - 10);
            c = s < 10 ? 0 : 1;
        }
        if(c) r.unshift(c);
        return r.join('');
    }

    var dec = '0';
    s.split('').forEach(function(chr) {
        var n = parseInt(chr, 16);
        for(var t = 8; t; t >>= 1) {
            dec = add(dec, dec);
            if(n & t) dec = add(dec, '1');
        }
    });
    return dec;
  }
```

`generateBarCode(barcodeVal, element)` generates a PDF417 barcode using an input string `barcodeVal` and outputs it on a canvas in the HTML div with the id element. This code makes use of the PDF417 library to work.

```javascript
function generateBarCode(barcodeVal,element){

    PDF417.init(barcodeVal);
    var barcode = PDF417.getBarcodeArray();
    // block sizes (width and height) in pixels
    var bw = 2;
    var bh = 2;
    var canvas = document.createElement('canvas');
    canvas.width = bw * barcode['num_cols'];
    canvas.height = bh * barcode['num_rows'];

    document.getElementById(element).appendChild(canvas);
    var ctx = canvas.getContext('2d');
    // graph barcode elements
    var y = 0;
    // for each row
      for (var r = 0; r < barcode['num_rows']; ++r) {
          var x = 0;
              // for each column
              for (var c = 0; c < barcode['num_cols']; ++c) {
                  if (barcode['bcode'][r][c] == 1) {
                      ctx.fillRect(x, y, bw, bh);
                  }
                  x += bw;
              }
              y += bh;
          }
  }
  ```

#### App Code
The actual application code starts from this point on. First, we fetch the form values and store them in variables. The two passwords are directly hashed as the cleartext passwords are not needed at any point.

```javascript
var usr = $("#username").val();
var hashpw1 = forge_sha256($("#pw1").val());
var hashpw2 = forge_sha256($("#pw2").val());
```

The next step is to generate the random value r that will be used to compute ∝. This is done by first creating a `Uint32Array()` of size 8 (8 x 32 = 256) and then running the `window.crypto.getRandomValues()` function with the array as an input. This function fills in the array with random integers. We then parse the array values into one long 256-bit integer string `r` that serves as r. We also calculate rinv as the modulo inverse of `r` using the ECInverse() function of `ECCLib.js` .

```javascript
var randarray = new Uint32Array(8);
window.crypto.getRandomValues(randarray);
r=String(randarray[0]).concat(String(randarray[1]),String(randarray[2]),String(randarray[3]),String(randarray[4]),String(randarray[5]),String(randarray[6]),String(randarray[7]));
rinv = String(ECInverse(r));
```

With `r` prepared, we now generate the coordinates of ∝ using the `ECEcponent()` function.

```javascript
temp = ECExponent(xpw1,r);
var AlphaX = temp[0];
var AlphaY = temp[1];
```

The next step in the functioning of the OPRF is to send the ∝ value to the server and receive the corresponding β value. To do this, we make URL-encoded POST request as follows, with the parameters `a` and `u` representing the ∝ value and Hash of the user name respectively. The `data` value records the server response (β). Notice that we only send the x coordinate of Alpha, because the server can calculate y easily.

```javascript
$.post("URL","a=".concat(String(AlphaX),"&u=",String(forge_sha256(usr))))
    .done(function(data) {
    //DO SOMETHING WITH RESPONSE
});
```
*rw* is calculated by first multiplying the received data with `rinv` and then using this as an input to a hash function along with the hash of the password.

```javascript
var Beta = ECExponent(data, rinv);
rw = forge_sha256(String(hashpw1).concat(String(Beta[0])));
```

Finally, the array `shares` is initialised, and `rw` along with `hashpw2` are stored as shares. Note that `801` is appended to the first share. Here, `8` represents the number of bits used for the Galois field, and `01` is the ID of the share as required by the library.

A third `privshare` is calculated from the first two shares. The secret private key is generated in line 3.

```javascript
var shares = [String('801').concat(String(hashpw2)),String('802').concat(String(rw))];
var privshare = secrets.newShare("03",shares);
var secret = secrets.combine(shares);
```

That's it for the client-side. The remaining code simply prints out the secret share, the private key and corresponding bar codes.

### Server-side Code

The server makes use of the express framework to operate. It uses a slightly modified `ECCLibServer.js`, which is only different from `ECCLib.js` in that instead of `window.function()`, it uses `exports.function()` in order to expose its public API.

Below are the imports for `Server.js`:

```javascript
var http = require('http');
var ECC = require('./ECCLibServer');
var express=require('express');
var bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4');
const cryptoS = require('crypto');
var cors = require('cors');
```

We initialise the Express framework as follows, making use of two modules — CORS and bodyParser. The former is used in order to ensure that our client end application can make Ajax requests to the server despite the two not being hosted on the same domain. The latter allows express to use the URL Encoded POST variables as ordinary ones later in the code.


```javascript
var app=express();
app.use(cors());
var urlencodedParser = bodyParser.urlencoded({ extended: false })
```

Next, we establish a connection with a MySQL server that stores user names and corresponding OPRF keys.


```javascript
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'MY SQL HOST',
  user     : 'USER',
  password : 'PASSWORD',
  database : 'DB'
});

connection.connect();
```

Now, we listen for POST requests, and when one finally arrives, we make a MySQL select command to check whether the user is registered with the service. The `results` of the MySQL query are saved in the results object.

```javascript
app.post('/', urlencodedParser, function(req,res){
  connection.query("SELECT * FROM Store WHERE user = '".concat(String(req.body.u),"';"), function(error, results, fields){
  //DO SOMETHING
  });
});
```

In line 1, `typeof results[0] === 'undefined'` represents the case where the result of the MySQL query is nothing, thereby leading to the lack of any data in `results[0]`. If this is the case, a new key is created for the user (line 2), and Beta is calculated accordingly (line 5). This key is then inserted into the MySQL table (table 5) so that it can be used for login. `res.send(Beta[0])` sends the x coordinate of Beta back to the user as a response.

```javascript
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
    }
```

If however, the user does exist (i.e. the result set in not empty), the server simply retrieves the key and uses it to calculate Beta.


```javascript
else {

      var key = cryptoS.createHash('sha256').update(String(results[0].store));
      key = key.digest('hex');
      console.log (key);
      var Beta = ECC.ECExponent(String(req.body.a), String(key));
      res.send(Beta[0]);
    }
```

That's it for the actual implementation! There is one more piece of code in `Server.js` that serves to run the server. As the demo is hosted on Heroku, `process.env.PORT` is used as the listening port, if available.


```javascript
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

var server = app.listen(port, function(){
  //Listen for requests on the mandated port
});
```

## Conclusion and Future Possibilities
Hopefully, this tutorial was able to demonstrate the construction and working of a mechanism to use low entropy passwords to secure private keys. As the code demonstrates, the server stores no information that can be used to derive the private key — and in the absence of the user’s passwords, a malicious server would have a very difficult time cracking the two passwords needed to unlock the account.

There are a few aspects of this protocol I feel could be improved. In this tutorial, I used SHA-256 hashes, which are now brute-forced easily with the help of Hardware ASICs. Instead, a slower hashing algorithm like BCrypt should be used to slow down the attacker's brute force.

The protocol, in its current implementation, does not take care of multiple users with the same user name. One idea to overcome this is the use of email-based authentication during the registration process to ensure that multiple people cannot use the service with the same user name/email address.

Rekeying is an interesting avenue to explore. Currently, the user has no way to alter the private key attached to their account without changing their passwords. The service could benefit from the ability to be able to rekey the private key associated with a particular username-password combination.

The reason for two passwords is to improve security; it adds extra entropy to work with. If there was a way to eliminate the second password by somehow limiting the ability of the server to simulate client interactions, the system’s user-friendliness would be increased significantly.

## Acknowledgements
This protocol would not have been possible without the kind support of [Andrew Miller](https://github.com/amiller "Andrew Miller"), Asst. Professor at University of Illinois, Urbana Champaign. Thank you for helping me expore ZKPs and Zk-SNARKs. Most of all, thank you for allowing me to research under you in the summer of 2019.

Much of the inspiration for this protocol came from the [OPAQUE protocol](https://eprint.iacr.org/2018/163.pdf "OPAQUE protocol"). I think it is one of the most powerful yet ignored protocols for password authentication. Kudos to the author for the thought put in to the design of this protocol.

Thanks to [Ye Zhang of Peking University](https://github.com/SilverPoker "Ye Zhang of Peking University") for simplifying SNARKs for me, and helping me out with the Elliptic Curve Cryptography.

## Contact
If you have any questions regarding this protocol, you can reach me at amanladia1@gmail.com. Would appreciate if you visited [amanladia.com](http://amanladia.com "amanladia.com"), and emailed me any projects/opportunities that could benefit from my support!
