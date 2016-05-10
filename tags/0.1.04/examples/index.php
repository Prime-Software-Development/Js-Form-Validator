<?php

$page = isset($_GET['page']) ? $_GET['page'] : 'index';
$template = 'index.html';
if( file_exists( $page.'.html' ) ) {
	$template = $page.".html";
}

echo file_get_contents('top.html');
echo file_get_contents('navigation.html');

echo file_get_contents($template);


echo file_get_contents('bottom.html');