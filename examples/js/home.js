/**
 * Created by trunk on 18/01/16.
 */
define(['jquery' ,'validator' ], function( $ ) {

	var home = {
		init: function(){

			$('.validate').on('click',function(event) {
				var $button = $( this );

				var validator = $button.closest('form').validator({ framework: "plain" });

				$('.form-errors').text( validator.validate().hasErrors() +"" );
			});

			console.log( "hello click" );

		}
	};

	home.init();

	return home;
});