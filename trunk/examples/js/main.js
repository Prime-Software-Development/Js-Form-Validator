/**
 * Created by trunk on 18/01/16.
 */
requirejs.config({
	baseUrl: 'examples/js',
	paths: {
		jquery: '/lib/jquery-2.2.0',
		bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',

		home: '/examples/js/home'
	},
	packages: [
		{
			name    : "validator",
			location: '/src/js',
			//location: '/dist',
			main    : 'validator'
		}
	]
});

requirejs( [ 'jquery', 'home', 'bootstrap' ], function ( $ ) {
	/*$(document ).ready(function(){
		home.init();
	});*/
});