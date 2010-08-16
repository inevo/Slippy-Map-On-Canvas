<?php

/* proxy */

$cachbase = "cache";

error_reporting(0);

$url = $_REQUEST['url'];
$resource = parse_url($url);

$host = $resource['host'];
$directory = dirname($resource['path']);
$filename = basename($resource['path']);

$cachdir = implode("/",array($cachbase, $host, trim($directory,"/")));
$cachfile = implode("/",array($cachdir, $filename));
$cachfile_header = $cachfile.".header";

if(is_file($cachfile) && is_file($cachfile_header)){
	foreach(file($cachfile_header) as $header){
			header($header);
	}
	readfile($cachfile);
}  else {
	mkdir($cachdir, 0777, true);
	if(is_dir($cachdir)){
		$ch = curl_init(); 
		curl_setopt($ch, CURLOPT_ENCODING , 'deflate');
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
		curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/4.0");
		curl_setopt($ch, CURLOPT_URL, $url); 
		$data = curl_exec($ch); 
		$content_type = curl_getinfo( $ch, CURLINFO_CONTENT_TYPE );
		header("Content-Type: ".$content_type);
		print $data;
		curl_close($ch); 
		if($data){
			@file_put_contents($cachfile, $data);
			@chmod($cachfile, 0666);
			@file_put_contents($cachfile_header, "Content-Type: ".$content_type);
			@chmod($cachfile_header, 0666);
		}
	} else {
		die("cound not create ".$cachdir);
	}
}