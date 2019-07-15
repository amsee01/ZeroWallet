<?php
require __DIR__ . '/vendor/autoload.php';
use Brick\Math\BigInteger;
use Brick\Math\RoundingMode;
/*

echo BigInteger::of($_REQUEST ["Alpha"])->power(144893278842057865448939);
$_POST['a']

echo BigInteger::of$tech)->power('144893278842057865448939');
*/

$tech = BigInteger::of($_POST['a']);

echo hash('sha256',$tech->power(1234));

/*
echo $_POST['a'],'h';
echo 'hello';
*/
 ?>
