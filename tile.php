<?php

/**
 * tileMaker 0.01
 *
 * Copyright 2010 Gerhard Koch
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Gerhard Koch <gerhard.koch AT ymail.com>
 *
 * WHAT IT DOES:
 *
 * cuts tiles from images on demand - uses a lot of resources (!)
 * uses cache dir if available and writable.
 * reads images from directory "images" 
 * delivers "images/black.gif" for off boundary x,y parameters
 *
 * USAGE: 
 *
 *  tile.php?src=IMAGEPATH&x=X&y=Y&z=Z&format=FORMAT
 *
 */ 

error_reporting(0);
ini_set('display_errors','off');

/* some constants/ default */
$cache_dir = "cache"; // must be 0777
$tileSize = 256;
$srcImgCreateFunctions = array(
	IMAGETYPE_GIF => 'imagecreatefromgif',
	IMAGETYPE_JPEG => 'imagecreatefromjpeg',
	IMAGETYPE_PNG => 'imagecreatefrompng',
);
$tileImgCreateFunctions = array(
	'gif' => 'imagegif',
	'jpg' => 'imagejpeg',
	'jpeg' => 'imagejpeg',
	'png' => 'imagepng'
);

$tileImgMimeTypes = array(
	'gif' => 'image/gif',
	'jpg' => 'image/jpeg',
	'jpeg' => 'image/jpeg',
	'png' => 'image/png'
);

$tileImgExtension = array(
	'gif' => 'gif',
	'jpg' => 'jpg',
	'jpeg' => 'jpg',
	'png' => 'png'
);


/* process parameter */
$srcImgFilename = basename($_REQUEST["src"]);
$srcImgPath = "images/".$srcImgFilename;
$cacheName = array_shift(explode(".",$srcImgFilename));

$tileImgFormat = isset($_REQUEST["format"])?$_REQUEST["format"]:'';
if(!in_array($tileImgFormat, array("gif","jpg","jpeg","png"))){
	$tileImgFormat = 'jpg';
}
$tileX = isset($_REQUEST["x"])?intval($_REQUEST["x"]):0;
$tileY = isset($_REQUEST["y"])?intval($_REQUEST["y"]):0;
$tileZ = isset($_REQUEST["z"])?intval($_REQUEST["z"]):0;


if($tileZ<0) die("z must be >= 0");

$tileNumber = pow(2,$tileZ);

if($tileX<0 || $tileY<0 || $tileX>$tileNumber || $tileY>$tileNumber){
	header('Content-type: image/gif');
	readfile("images/black.gif");
	exit();
}

$cacheImgPath = $cache_dir."/".$cacheName."/".$tileZ."/".$tileX."/".$tileY.".".$tileImgExtension[$tileImgFormat];

if(@file_exists($cacheImgPath)){
	header('Content-type: '.$tileImgMimeTypes[$tileImgFormat]);
	readfile($cacheImgPath);
	exit();
}


/* load src */
if(!@file_exists($srcImgPath)) die('src not found');
$srcImgInfo = @getimagesize($srcImgPath);
if(!$srcImgInfo) die('cannot get image info');


if(!$srcImgCreateFunctions[$srcImgInfo[2]]) die('cannot get image type');
if(!function_exists($srcImgCreateFunctions[$srcImgInfo[2]])) die('unknown image type');
$srcImgResource = $srcImgCreateFunctions[$srcImgInfo[2]]($srcImgPath);

/* create tile */
$tileImgResource = imagecreatetruecolor($tileSize, $tileSize);

$srcClipping = (($srcImgInfo[0]>$srcImgInfo[1])?$srcImgInfo[0]:$srcImgInfo[1])/$tileNumber;

$srcXmin = round(($tileX)*$srcClipping);
$srcYmin = round(($tileY)*$srcClipping);

imagecopyresampled(	$tileImgResource, $srcImgResource, 
					0, 0, 
					$srcXmin, $srcYmin, 
					$tileSize, $tileSize, 
					$srcClipping, $srcClipping
);
/* please... tidy! */
if(is_dir($cache_dir)){
	@mkdir($cache_dir."/".$cacheName);
	@chmod($cache_dir."/".$cacheName,0777);
	if(is_dir($cache_dir."/".$cacheName)){
		@mkdir($cache_dir."/".$cacheName."/".$tileZ);
		@chmod($cache_dir."/".$cacheName."/".$tileZ, 0777);
		if(is_dir($cache_dir."/".$cacheName."/".$tileZ)){
			@mkdir($cache_dir."/".$cacheName."/".$tileZ."/".$tileX);
			@chmod($cache_dir."/".$cacheName."/".$tileZ."/".$tileX, 0777);
			if(is_dir($cache_dir."/".$cacheName."/".$tileZ."/".$tileX)){
				$tileImgCreateFunctions[$tileImgFormat]($tileImgResource,
					$cache_dir."/".$cacheName."/".$tileZ."/".$tileX."/".$tileY.".".
					$tileImgExtension[$tileImgFormat]
				);
				chmod($cache_dir."/".$cacheName."/".$tileZ."/".$tileX."/".$tileY.".".
					$tileImgExtension[$tileImgFormat]
				,0666);
			}
		}
	}
}

header('Content-type: '.$tileImgMimeTypes[$tileImgFormat]);
print $tileImgCreateFunctions[$tileImgFormat]($tileImgResource);
