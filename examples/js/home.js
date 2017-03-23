/**
 * Created by trunk on 18/01/16.
 */
define(['jquery' ,'validator' ], function( $ ) {

	var home = {
		init: function() {


			$(document).on('invalid.ts.validator', function(e){
				var validator = $(e.target).validator();

				//console.log("event", validator.getErrors());
				console.log("event invalid", validator);
			});

			$(document).on('valid.ts.validator', function(e){
				var validator = $(e.target).validator();

				console.log("event valid", validator);
			});


			$('.validate').on('click', function(event) {
				var $button = $( this );

				var validator = $button.closest('form').validator();



				$('.form-errors').text( validator.validate().hasErrors() +"" );

				var errors = validator.getErrors();
				if(errors.length) {

					$(errors[0].el).focus();
				}


			});

		}
	};

	home.init();

	return home;
});