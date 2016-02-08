/**
 * Created by trunk on 18/01/16.
 */
define(['jquery' ,'validator', 'methods' ], function( $ ) {

	var home = {
		init: function(){

			$('.validate').on('click',function(event) {
				var $button = $( this );

				var validator = $button.closest('form' ).validator({ framework: "plain" });

				$('.form-errors').text( validator.validate().hasErrors() +"" );
			});

		}
	};

	home.init();

	return home;
});