<?php
	// SECRET DUNGEON EMOTES
	// Write JSON emote list with base64 data for the images

	// (Run this file in the project root dir in order to generate the new JSON file)

	define('IMAGES_DIR', 'images');
	define('JSON_FILENAME', 'dungeonemotes.json');
	define('JSONP_FILENAME', 'dungeonemotes-prefixed.json');
	define('JSONP_METHOD_NAME', 'sde_jsonp_static');

	$pwd = realpath('.');
	$imagesDir = $pwd . DIRECTORY_SEPARATOR . IMAGES_DIR;
	$jsonFilename = $pwd . DIRECTORY_SEPARATOR . JSON_FILENAME;
	$jsonpFilename = $pwd . DIRECTORY_SEPARATOR . JSONP_FILENAME;
	$output = array();

	echo "SECRET DUNGEON EMOTES JSON GENERATOR\n";

	foreach(scandir($imagesDir) as $filename){

		// Only image files that support transparency
		if(preg_match('/\.(png|gif)$/', $filename)){

			// Full path to this image file
			$path = $imagesDir . DIRECTORY_SEPARATOR . $filename;

			// Getting data about image
			$imgData = getimagesize($path);
			$width   = $imgData[0];
			$height  = $imgData[1];
			$mime    = $imgData['mime'];

			// Getting emoticon name
			$segs    = explode('.', $filename, 2);
			$name    = $segs[0];

			// Skip resolution copies for now
			if(preg_match('/@[2-9]x$/', $name)){
				continue;
			}

			// Rot13'd name
			if($name[0] == '_'){
				$name = str_rot13(substr($name, 1));
			}

			// This one is special (case-insensitive file system)
			if($name == 'ZElecTriKapp'){
				$name = 'ElecTriKapp';
			}

			echo 'Getting data for ' . $name . '...';

			// Output
			$output[] = array(
				'name'   => $name,
				'width'  => $width,
				'height' => $height,
				'url'    => 'data:' . $mime . ';base64,' .
				            urlencode(base64_encode(file_get_contents($path)))
			);

			echo "Done!\n";
		}
	}

	echo 'Writing to file...';

	// Write to the files!

	file_put_contents(
		$jsonFilename,
		json_encode($output)
	);
	file_put_contents(
		$jsonpFilename,
		JSONP_METHOD_NAME . '(' .
			json_encode($output) .
		')'
	);

	echo "Done!\n";
