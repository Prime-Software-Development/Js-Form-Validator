/**
 * Created by trunk on 18/01/16.
 */
requirejs.config({
	baseUrl: 'examples/js',
	paths: {
		jquery: '/lib/jquery-2.2.0',
		validator: '/src/js/validator',
		methods: '/src/js/additional-methods',

		home: '/examples/js/home'
	}
});

requirejs( [ 'jquery', 'validator', 'home' ], function ( $, validator, home ) {
	/*$(document ).ready(function(){
		home.init();
	});*/
});