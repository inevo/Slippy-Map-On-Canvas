<?php

/* proxy for gazetteer */

$find = $_REQUEST['find'];

$url = 'http://gazetteer.openstreetmap.org/namefinder/search.xml?find='.urlencode($find).'&max=1&any=1';


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
