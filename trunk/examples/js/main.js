/**
 * Created by trunk on 18/01/16.
 */
requirejs.config({
	baseUrl: 'examples/js',
	paths: {
		jquery: '/lib/jquery-2.2.0',

		home: '/examples/js/home'
	},
	packages: [
		{
			name: "validator",
			location: '/src/js/',
			main: 'validator'
		}
	]
});

requirejs( [ 'jquery', 'home' ], function ( $ ) {
	/*$(document ).ready(function(){
		home.init();
	});*/
});