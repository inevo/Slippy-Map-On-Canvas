<?php

/* proxy for gazetteer */

error_reporting(0);

$find = $_REQUEST['q'];
$max = $_REQUEST['maxRows'];
$fuzzy = $_REQUEST['fuzzy'];

$url = 'http://ws.geonames.org/searchJSON?q='.urlencode($find).'&maxRows='.$max; 
if($fuzzy) $url .= '&fuzzy='.$fuzzy;


$ch = curl_init(); 
curl_setopt($ch, CURLOPT_ENCODING , 'deflate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/4.0");
curl_setopt($ch, CURLOPT_URL, $url); 
$body = curl_exec($ch); 
$content_type = curl_getinfo( $ch, CURLINFO_CONTENT_TYPE );

header("Content-Type: ".$content_type);

print $body;

curl_close($ch); 
