define([],function(){

	var Event = {
		INVALID: 'invalid.ts.validator',
		VALID: 'valid.ts.validator'
	};

	/**
	 * Validator plugin definition
	 * @param option
	 * @returns {*}
	 */
	$.fn.validator = function ( options ) {
		var validator = $.fn.validator;

		this.each( function () {
			var form  = this;
			var $form = $( this );

			// No validator
			if ( !$.data( form, validator.settings.validator ) ) {
				// Do a deep copy of the options - http://api.jquery.com/jQuery.extend/
				var settings           = $.extend( true, {}, validator.defaults, $.data( form ), options );
				var framework_settings = settings.framework;

				// init framework options from data- tags
				// WARNING: data tag options have priority
				$.each( validator.settings.framework, function ( index, tag_name ) {
					var value = $form.data( tag_name );
					if ( undefined !== value ) {
						framework_settings[ index ] = value;
					}
				} );

				// get framework object
				var framework = $.extend( {}, default_frameworks[ settings.framework.id ] );
				// set framework settings
				$.extend( framework.settings, framework_settings );
				settings.framework = framework;

				// Also save the instance so it can be accessed later to use methods/properties etc
				$.data( form, validator.settings.validator, new Validator( form, settings ) );
			}

		} );

		if ( this.length === 1 )
			return $.data( this[ 0 ], $.fn.validator.settings.validator );

		return this;
	};

	$.fn.validator.getAttributes = function getAttributes( element ) {
		var attributes = {};

		$.each( Array.prototype.slice.call(element.attributes), function() {

			if( this.specified ) {
				attributes[ this.name ] = this.name === 'required' ? true : this.value;
			}
		});

		return attributes;
	};

	// http://jqueryvalidation.org/jQuery.validator.format/
	$.fn.validator.format = function format( source, params ) {
		if ( arguments.length === 1 ) {
			return function() {
				var args = $.makeArray( arguments );
				args.unshift( source );
				return $.fn.validator.format.apply( this, args );
			};
		}
		if ( arguments.length > 2 && params.constructor !== Array  ) {
			params = $.makeArray( arguments ).slice( 1 );
		}
		if ( params.constructor !== Array ) {
			params = [ params ];
		}
		$.each( params, function( i, n ) {
			source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
				return n;
			});
		});
		return source;
	};

	$.fn.validator.addClassRules = function addClassRules( className, rules ) {
		if ( className.constructor === String ) {
			$.fn.validator.rules.class[ className ] = rules;
		} else {
			$.extend( $.fn.validator.rules.class, className );
		}
	};

	$.fn.validator.addAttributeRules = function addAttributeRules( attributeName, rules ) {
		if ( attributeName.constructor === String ) {
			$.fn.validator.rules.attr[ attributeName ] = rules;
		} else {
			$.extend( $.fn.validator.rules.attr, attributeName );
		}
	};

	$.fn.validator.addDataRules = function addDataRules( dataName, rules ) {
		if ( dataName.constructor === String ) {
			$.fn.validator.rules.data[ dataName ] = rules;
		} else {
			$.extend( $.fn.validator.rules.data, dataName );
		}
	};
	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	$.fn.validator.normalizeRule = function normalizeRule( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each( data.split( /\s/ ), function() {
				transformed[ this ] = true;
			});
			data = transformed;
		}
		return data;
	};

	$.fn.validator.addMethod = function addMethod( options, method, message ) {
		var name = options, is_class_rule = method.length < 3,
		    is_attribute_rule = false, is_data_rule = false;

		if( typeof options === 'object' ) {
			name = options.method_name;
			is_class_rule = options.is_class_rule === true;
			is_attribute_rule = options.is_attribute_rule === true;
			is_data_rule = options.is_data_rule === true;
		}

		$.fn.validator.methods[ name ] = method;
		$.fn.validator.messages[ name ] = message !== undefined ? message : $.fn.validator.messages[ name ];

		if ( is_class_rule ) {
			$.fn.validator.addClassRules( name, $.fn.validator.normalizeRule( name ) );
		}

		if ( is_attribute_rule ) {
			$.fn.validator.addAttributeRules( name, $.fn.validator.normalizeRule( name ) );
		}

		if ( is_data_rule ) {
			$.fn.validator.addDataRules( name, $.fn.validator.normalizeRule( name ) );
		}
	};

	$.fn.validator.getOption = function( name ) {
		if( undefined === name )
			return $.fn.validator.settings;

	};

	// Expose defaults and Constructor (allowing overriding of prototype methods for example)
	$.fn.validator.settings = {
		// data selector
		validator: "trunk.validator",
		framework: {
			id: "framework",
			hidden_containers: "hidden-containers"
		}
	};
	$.fn.validator.defaults = {
		framework: {
			id: 'bootstrap'
		},
		// Form element selectors
		selectors: {
			// select these elements for validation
			elements    : [ 'input', 'select', 'textarea', 'button' ],
			// ignore these elements when validating
			ignore      : [ '[name=""]', '[type=submit]', '[type=hidden]', '[type=button]', 'button', '.novalidate' ],
			// exclude all elements within these container elements
			exclude     : ['.novalidate'],
			// select only visible
			visible     : [':visible'],
			// select only enabled
			enabled     : [':enabled'],
			// filter elements matching this selector $( selection ).not( ':hidden' )
			hidden      : [':hidden']
		},
		// Error messages by element name
		messages: {},
		// Data attribute names
		attribute_names: {
			errors: "trunk.validator.errors"
		}
	};
	$.fn.validator.methods = {

		// http://jqueryvalidation.org/required-method/
		required: function( value, element, param ) {

			if ( element.nodeName.toLowerCase() === "select" ) {

				// could be an array for select-multiple or a string, both are fine this way
				var val = $( element ).val();
				return val && val.length > 0;
			}
			if ( this.isCheckable( element ) ) {
				return this.getLength( value, element ) > 0;
			}
			return value.length > 0;
		},

		// http://jqueryvalidation.org/email-method/
		email: function( value, element ) {
			// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
			// Retrieved 2014-01-14
			// If you have a problem with this implementation, report a bug against the above spec
			// Or use custom methods to implement your own email validation
			return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
		},

		// http://jqueryvalidation.org/url-method/
		url: function( value, element ) {

			// Copyright (c) 2010-2013 Diego Perini, MIT licensed
			// https://gist.github.com/dperini/729294
			// see also https://mathiasbynens.be/demo/url-regex
			// modified to allow protocol-relative URLs
			return this.optional( element ) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
		},

		// http://jqueryvalidation.org/date-method/
		date: function( value, element ) {
			return this.optional( element ) || !/Invalid|NaN/.test( new Date( value ).toString() );
		},

		// http://jqueryvalidation.org/dateISO-method/
		dateISO: function( value, element ) {
			return this.optional( element ) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
		},

		// http://jqueryvalidation.org/number-method/
		number: function( value, element ) {
			return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
		},

		// http://jqueryvalidation.org/digits-method/
		digits: function( value, element ) {
			return this.optional( element ) || /^\d+$/.test( value );
		},

		// http://jqueryvalidation.org/minlength-method/
		minlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length >= param;
		},

		// http://jqueryvalidation.org/maxlength-method/
		maxlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length <= param;
		},

		// http://jqueryvalidation.org/rangelength-method/
		rangelength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || ( length >= param[ 0 ] && length <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/min-method/
		min: function( value, element, param ) {
			return this.optional( element ) || value >= param;
		},

		// http://jqueryvalidation.org/max-method/
		max: function( value, element, param ) {
			return this.optional( element ) || value <= param;
		},

		// http://jqueryvalidation.org/range-method/
		range: function( value, element, param ) {
			return this.optional( element ) || ( value >= param[ 0 ] && value <= param[ 1 ] );
		},

		min_length: function( element, value, options ) {
			var $element = $( element );
			var min_length = parseInt( options );

			if( this.getNodeName( element ) === 'select' ) {
				return (value = $element.val()) && value.length >= min_length;
			}

			if ( _this.isCheckable( element ) ) {
				return this.getLength( value, element ) >= min_length;
			}
			return value.length >= min_length;
		},

		typeahead_required: function( value, element, options ) {
			var $element = $( element );
			return typeof $element.data( 'selected_id' ) !== 'undefined';
		},
	};

	$.fn.validator.rules = {
		class: {
			required: { required: true },
			email   : { email: true },
			date    : { date: true },
			dateISO : { dateISO: true },
			url     : { url: true },
			number  : { number: true },
			integer : { integer: true },
			mobileUK: { mobileUK: true },
			time    : { time: true },
			digits  : { digits: true },
			typeahead_required: { typeahead_required: true },
		},
		// <input type="email", required min="10"/>
		// input type will be checked against these names as well
		attr : {
			required: { required: true },
			email   : { email: true },
			date    : { date: true },
			url     : { url: true },
			min     : { min: true },
			max     : { max: true },
			number  : { number: true },
			time    : { time: true },
			minlength: { minlength: true },
			maxlength: { maxlength: true }
		},
		// data-rule-{name}
		data : {
			required: { required: true },
			email   : { email: true },
			date    : { date: true },
			dateISO : { dateISO: true },
			min     : { min: true },
			max     : { max: true },
			number  : { number: true },
			integer : { integer: true },
			mobileUK: { mobileUK: true },
			time    : { time: true },
			digits  : { digits: true },
			minlength: { minlength: true },
			maxlength: { maxlength: true }
		}
	};
	$.fn.validator.messages = {
		required   : "This field is required.",
		email      : "Please enter a valid email address.",
		url        : "Please enter a valid URL.",
		date       : "Please enter a valid date.",
		dateISO    : "Please enter a valid date ( ISO ).",
		number     : "Please enter a valid number.",
		digits     : "Please enter only digits.",
		equalTo    : "Please enter the same value again.",
		maxlength  : $.fn.validator.format( "Please enter no more than {0} characters." ),
		minlength  : $.fn.validator.format( "Please enter at least {0} characters." ),
		rangelength: $.fn.validator.format( "Please enter a value between {0} and {1} characters long." ),
		range      : $.fn.validator.format( "Please enter a value between {0} and {1}." ),
		max        : $.fn.validator.format( "Please enter a value less than or equal to {0}." ),
		min        : $.fn.validator.format( "Please enter a value greater than or equal to {0}." ),
		typeahead_required  : "Please select an option from the drop down.",
	};

	/* END plugin */

	/* Validator */

	var default_frameworks = {
		bootstrap: {
			settings: {
				// Hidden form controls will be validated for the given containers
				hidden_containers: [".tab-pane"],
				selectors: {
					group: '.form-group',
					error_block: '.help-block.with-errors',
					feedback: '.form-control-feedback'
				},
				feedback: {
					success: 'glyphicon-ok',
					error: 'glyphicon-remove'
				},
				attribute_names: {
					error_block: 'trunk.validator.originalContent'
				}
			},

			showFieldErrors: function( element, errors ) {
				var _this = this, $element = $( element),
				    selector = _this.settings.selectors,
				    attributes = _this.settings.attribute_names;

				var $group          = $element.closest( selector.group );
				var $error_block    = $group.find( selector.error_block );
				var $feedback       = $group.find( selector.feedback );

				if (!errors) return;

				errors = $('<ul/>')
					.addClass('list-unstyled')
					.append($.map(errors, function (error) {
						return $('<li/>').text(error);
					}));

				if( $error_block.data( attributes.error_block ) === undefined )
					$error_block.data( attributes.error_block, $error_block.html());
				$error_block.empty().append(errors);
				$group.addClass('has-error');

				if($feedback.length) {
					$feedback.removeClass( this.settings.feedback.success );
					$feedback.addClass( this.settings.feedback.error );
					$group.removeClass( 'has-success' );
				}
			},

			clearFieldErrors: function( element ) {
				var _this = this, $element = $( element),
				    selector = _this.settings.selectors,
				    feedback = _this.settings.feedback,
				    attributes = _this.settings.attribute_names;

				var $group          = $element.closest( selector.group );
				var $error_block    = $group.find( selector.error_block );
				var $feedback       = $group.find( selector.feedback );

				$error_block.html($error_block.data( attributes.error_block ));
				$group.removeClass('has-error');

				$error_block.removeData( attributes.error_block );

				if( $feedback.length ) {
					$feedback.removeClass( feedback.error );
					$feedback.addClass( feedback.success );
					$group.addClass( 'has-success' );
				}
			},

			onFormInvalid: function(validator, errors) {
				var form = validator.getForm(), Event = this.settings.events;
			},

			getName: function() {
				return 'bootstrap';
			}
		},
		plain: {
			settings: { hidden_containers: [] },
			showFieldErrors: function( element, errors ) {
				var _this = this, $element = $( element ),
				    $errors = $element.next('.errors');

				if( $errors.length === 0 )
					$errors = $( "<div/>" ).addClass('errors');
				$errors.empty();

				$errors.append( $.map( errors, function ( error ) {
					return $( '<div/>' ).text( error );
				} ) );

				$element.addClass('error');
				$element.after( $errors );
			},

			clearFieldErrors: function( element ) {
				var _this = this, $element = $( element ),
				    $errors = $element.next('.errors');

				if( $errors.length > 0 )
					$errors.empty();

				$element.removeClass('error');
			},

			getName: function() {
				return 'default';
			}
		}
	};

	// Constructor, initialise everything you need here
	function Validator(element, options) {
		this.form                = element;
		this.settings            = options;
		this.framework           = null;
		this.initialized         = false;
		// Full Form validation has not been run yet
		this.is_first_validation = true;

		this.framework = options.framework;

		this.init();
	}

	// Plugin methods and shared properties
	Validator.prototype = {
		// Reset constructor - http://goo.gl/EcWdiy
		constructor: Validator,

		destroy: function () {

			this.resetForm();

			this.$form
				.off( '.tn.validate' )
				.removeAttr( 'novalidate' )
				.removeData( $.fn.validator.settings.validator );

			this.getElements( this.$form )
				.removeData( [ this.settings.attribute_names.errors ] );

		},

		init: function () {
			var _this = this;

			if ( this.initialized ) return;

			this.$form = $( this.form );

			// disable automatic native HTML5 validation
			this.$form.attr( 'novalidate', true );

			// Add aria-required to any Static/Data/Class required fields before first validation
			// Screen readers require this attribute to be present before the initial submission http://www.w3.org/TR/WCAG-TECHS/ARIA2.html
			$( this.$form ).find( "[required], [data-rule-required], .required" ).attr( "aria-required", "true" );

			// Field modified event
			this.$form
				.on( "focusin.tn.validate focusout.tn.validate keyup.tn.validate",
					":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
					"[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
					"[type='radio'], [type='checkbox']", $.proxy( this.onValidateField, this ) )
				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on( "click.tn.validate", "select, option, [type='radio'], [type='checkbox']", $.proxy( this.onValidateField, this ) );

			// Form submit event
			this.$form.on( 'submit.tn.validator', $.proxy( this.onSubmit, this ) );

			this.initialized = true;
		},

		validate: function() {
			var _this = this, form_errors = [];
			var form_controls = _this.getElements( _this.$form );

			$.each( form_controls, function( index , element ) {
				var error_messages;
				if( (error_messages = _this.validateField( element ) ) ) {
					form_errors.push( error_messages );
				}
			});

			// First full form validation has been run
			_this.is_first_validation = false;

			var is_valid = form_errors.length === 0;
			// trigger form invalid event
			var form = _this.getForm();

			if(!is_valid) {
				// run framework specific onFormInvalid
				if(_this.framework.onFormInvalid) {
					_this.framework.onFormInvalid(_this, form_errors);
				}
			}

			$(form).trigger(is_valid ? Event.VALID : Event.INVALID);

			return this;
		},

		/**
		 * Get array of invalid elements and errors messages
		 * @returns {Array}
		 */
		getErrors: function() {
			var _this = this, attributes = _this.settings.attribute_names;

			var $elements = _this.getInvalidElements();
			var errors = [];

			$elements.each(function(i, el){
				var errs = $(el).data( attributes.errors );

				errors.push({
					el: el,
					errors: errs
				});
			});

			return errors;
		},

		hasErrors: function() {
			var _this = this, attributes = _this.settings.attribute_names;

			return _this.getInvalidElements().length;
		},

		resetForm: function() {
			var _this = this;
			var selector = _this.settings.selectors;
			var $elements = _this.$form.find( selector.elements.join(',') ).not('button');

			$elements.each(function(){
				_this.framework.clearFieldErrors( this );
			});
		},

		getForm: function() {
			return this.form;
		},

		validateField: function( element ) {
			var _this = this, failed_rules;

			if( (failed_rules = _this.isElementInvalid( element )) ) {
				var messages = _this.getErrorMessages( element, failed_rules );

				// Attach the error messages to the element
				_this.setElementErrors( element, messages );

				_this.showElementErrors( element );

				return {
					element: element,
					messages: messages,
					rules: failed_rules
				};

			}

			// Clear invalid status
			_this.clearElementErrors( element );
			return false;
		},

		// Check wether the element is required
		optional: function( element ) {
			var val = this.getElementValue( element );
			return !$.fn.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
		},

		onValidateField: function( event ){
			var _this = this;

			// DO not validate if form has not been
			// validated yet
			if( _this.is_first_validation ) {
				return;
			}

			_this.validateField( event.target );
		},

		onSubmit: function( event ){
			var _this = this;

			_this.validate();
			if(_this.hasErrors()) {
				event.preventDefault();
				_this.settings.formInvalid.call( _this );
			}
		},

		/**
		 * Check if element IS invalid
		 * @param element
		 * @returns false || {}
		 */
		isElementInvalid: function( element ) {
			var rule, result, results = [], method,
			    rules = this.getElementRules( element );

			for( method in rules ) {
				rule = { method: method, params: rules[ method ] };
				if(typeof $.fn.validator.methods[ method ] === 'function' ) {
					var value = this.getElementValue( element );
					if( !(result = $.fn.validator.methods[ method ].call( this, value, element, rule.params )) ) {
						results.push( rule );
					}
				}
			}

			return results.length === 0 ? false : results;
		},

		showElementErrors: function( element ) {
			var _this  = this;
			var errors = _this.getElementErrors( element );

			_this.framework.showFieldErrors( element, errors );
		},

		clearElementErrors: function( element ) {
			var _this = this, attributes = _this.settings.attribute_names;

			// Remove error message data from the element
			$( element ).removeData( attributes.errors );

			_this.framework.clearFieldErrors( element );
		},

		getInvalidElements: function() {

			var _this = this, attributes = _this.settings.attribute_names;

			function fieldErrors() {
				var errors = $(this).data( attributes.errors );
				if( errors === undefined ) return 0;

				var count = 0;
				var i;

				for (i in errors) {
					if (errors.hasOwnProperty(i)) {
						count++;
					}
				}

				return count;
			}

			var fields = _this.getElements( _this.$form );

			return fields.filter(fieldErrors);
		},

		/**
		 * Return data attribute value for errors
		 * @param element
		 * @returns {*|jQuery}
		 */
		getElementErrors: function( element ) {
			var _this = this, attributes = _this.settings.attribute_names;

			return $( element ).data( attributes.errors );
		},

		setElementErrors: function( element, messages ){
			var _this = this, attributes = _this.settings.attribute_names;
			$( element ).data( attributes.errors, messages );
		},

		/**
		 * Get error messages for all failed rules
		 * @param element
		 * @param rules
		 * @returns {{}}
		 */
		getErrorMessages: function( element, rules ) {
			var _this = this;
			var messages = {};

			$.each( rules, function() {
				messages[ this.method ] = _this.getErrorMessage( element, this );
			});

			return messages;
		},

		/**
		 * Get first defined message for a given method
		 * @param element
		 * @param rule
		 * @returns {*}
		 */
		getErrorMessage: function( element, rule ) {
			var _this = this;

			var message = _this.getFirstDefined(
				_this.getCustomMessage( element, rule ),
				_this.getCustomDataMessage( element, rule ),
				// title is never undefined, so handle empty string as undefined
				!_this.settings.ignoreTitle && element.title || undefined,
				$.fn.validator.messages[ rule.method ],
				"Warning: No message defined for " + element.name
			);

			if( typeof message === 'function' ) {
				message = message( rule.params );
			}

			return message;
		},

		/**
		 * Get message for a given method from data-rule-{method}-msg attribute
		 * @param element HTMLInputElement
		 * @param rule { method: method_name, params: parameters }
		 * @returns string|undefined
		 */
		getCustomDataMessage: function( element, rule ) {
			var method = rule.method, $element = $( element );
			return $element.data( "rule-" + method.charAt( 0 ).toUpperCase() + method.substring( 1 ).toLowerCase() + "-msg" ) ||
				$element.data('msg');
		},

		getCustomMessage: function( element, rule ) {
			var message = this.settings.messages[ element.name ];
			return message && ( message.constructor === String ? message : message[ rule.method ]);
		},

		// return the first defined argument, allowing empty strings
		getFirstDefined: function() {
			for ( var i = 0; i < arguments.length; i++) {
				if ( arguments[ i ] !== undefined ) {
					return arguments[ i ];
				}
			}
			return undefined;
		},

		getElementValue: function(element) {
			var type = element.type;

			if( type === 'radio' || type === 'checkbox' ) {
				return this.findByName( element.name ).filter(':checked').val();
			}

			return element.value;
		},

		findByName: function( name ) {
			return this.$form.find( '[name="' + name + '"]');
		},

		isCheckable: function( element ) {
			return ( /radio|checkbox/i ).test( element.type );
		},

		// Return either length of a value or if radio/checkbox checked
		getLength: function( value, element ) {
			var _this = this;
			switch ( _this.getNodeName( element ) ) {
				case "select":
					return $( "option:selected", element ).length;
				case "input":
					if ( _this.isCheckable( element ) ) {
						return this.findByName( element.name ).filter( ":checked" ).length;
					}
			}

			return value.length;
		},

		// Get elements TagName ( e.g input, select )
		getNodeName: function( element ) {
			return element.nodeName.toLowerCase();
		},

		// From jQuery.validator
		getElementRules: function( element ){
			var param;
			var rules = this.normalizeRules(
				$.extend(
					{},
					this.getClassRules( element ),
					this.getAttributeRules( element ),
					this.getDataRules( element )
				),
				element
			);

			// make sure required is at front
			if ( rules.required ) {
				param = rules.required;
				delete rules.required;
				rules = $.extend( { required: param }, rules );
				$( element ).attr( "aria-required", "true" );
			}

			// make sure remote is at back
			if ( rules.remote ) {
				param = rules.remote;
				delete rules.remote;
				rules = $.extend( rules, { remote: param });
			}

			return rules;
		},

		// Return list of tests based on element classes
		getClassRules: function( element ) {
			var results = {};
			var classes = element.className.split(/\s+/);

			$.each( classes, function( index, class_name ) {
				if( class_name in $.fn.validator.rules.class ){
					$.extend( results , $.fn.validator.rules.class[ class_name ] );
				}
			});

			return results;
		},

		// From jQuery.validator - http://jqueryvalidation.org/documentation/
		getAttributeRules: function( element ){
			var results = {},
			    $element = $( element ),
			    type = element.getAttribute( "type" ),
			    attribute_name, value, normalized_value, attributes;

			attributes = this.getElementAttributes( element );

			function add(method_name, value) {
				methods[ method_name ] = normalized_value;
			}

			// Loop all attributes
			for ( attribute_name in attributes ) {
				// Attribute has rule(s)
				if( attribute_name in $.fn.validator.rules.attr || attribute_name === 'type' ) {
					// support for <input required> in both html5 and older browsers
					if ( attribute_name === "required" ) {
						value = element.getAttribute( attribute_name );

						// Some browsers return an empty string for the required attribute
						// and non-HTML5 browsers might have required="" markup
						if ( value === "" ) {
							value = true;
						}

						// force non-HTML5 browsers to return bool
						value = !!value;
					} else {
						value = $element.attr( attribute_name );
					}

					normalized_value = attribute_name === 'type' ? true : this.normalizeAttributeValue( type, attribute_name, value );
					if( attribute_name === 'type' )
						attribute_name = value;

					var methods = $.fn.validator.rules.attr[ attribute_name ];

					if( methods ) {
						$.each( methods, add);

						$.extend( results, methods );
					}
				}
			}

			// maxlength may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
			if ( results.maxlength && /-1|2147483647|524288/.test( results.maxlength ) ) {
				delete results.maxlength;
			}

			return results;

		},

		getDataRules: function( element ) {
			var results = {},
			    $element = $( element ),
			    type = element.getAttribute( "type" ),
			    data_name, value, normalized_value;

			function add(method_name, value) {
				methods[ method_name ] = normalized_value;
			}

			for ( data_name in $.fn.validator.rules.data ) {
				value = $element.data( 'rule'+data_name.charAt( 0 ).toUpperCase() + data_name.substring( 1 ).toLowerCase() );
				normalized_value = this.normalizeAttributeValue( type, data_name, value );

				var methods = $.fn.validator.rules.data[ data_name ];

				$.each( methods, add);

				$.extend( results, methods );
			}
			return results;
		},

		// From jQuery.validator - http://jqueryvalidation.org/documentation/
		normalizeAttributeValue: function(type, attribute_name, value ) {
			var result = value;

			// convert the value to a number for number inputs, and for text for backwards compability
			// allows type="date" and others to be compared as strings
			if ( /min|max/.test( attribute_name ) && ( type === null || /number|range|text/.test( type ) ) ) {
				value = Number( value );

				// Support Opera Mini, which returns NaN for undefined minlength
				if ( isNaN( value ) ) {
					value = undefined;
				}
			}

			if ( value || value === 0 ) {
				result = value;
			} else if ( type === attribute_name && type !== "range" ) {

				// exception: the jquery validate 'range' method
				// does not test for the html5 'range' type
				result = true;
			}

			return result;
		},

		normalizeRules: function( rules, element ) {

			// handle dependency check
			$.each( rules, function( prop, val ) {
				// ignore rule when param is explicitly false, eg. required:false
				if ( val === false ) {
					delete rules[ prop ];
					return;
				}

				/*if ( val.param || val.depends ) {
				 var keepRule = true;
				 switch ( typeof val.depends ) {
				 case "string":
				 keepRule = !!$( val.depends, element.form ).length;
				 break;
				 case "function":
				 keepRule = val.depends.call( element, element );
				 break;
				 }
				 if ( keepRule ) {
				 rules[ prop ] = val.param !== undefined ? val.param : true;
				 } else {
				 delete rules[ prop ];
				 }
				 }*/

			});

			// evaluate parameters
			$.each( rules, function( rule, parameter ) {
				rules[ rule ] = $.isFunction( parameter ) ? parameter( element ) : parameter;
			});

			// clean number parameters
			$.each([ "minlength", "maxlength" ], function() {
				if ( rules[ this ] ) {
					rules[ this ] = Number( rules[ this ] );
				}
			});
			$.each([ "rangelength", "range" ], function() {
				var parts;
				if ( rules[ this ] ) {
					if ( $.isArray( rules[ this ] ) ) {
						rules[ this ] = [ Number( rules[ this ][ 0 ]), Number( rules[ this ][ 1 ] ) ];
					} else if ( typeof rules[ this ] === "string" ) {
						parts = rules[ this ].replace(/[\[\]]/g, "" ).split( /[\s,]+/ );
						rules[ this ] = [ Number( parts[ 0 ]), Number( parts[ 1 ] ) ];
					}
				}
			});

			/*if ( this.settings.autoCreateRanges ) {
			 // auto-create ranges
			 if ( rules.min != null && rules.max != null ) {
			 rules.range = [ rules.min, rules.max ];
			 delete rules.min;
			 delete rules.max;
			 }
			 if ( rules.minlength != null && rules.maxlength != null ) {
			 rules.rangelength = [ rules.minlength, rules.maxlength ];
			 delete rules.minlength;
			 delete rules.maxlength;
			 }
			 }*/

			return rules;
		},

		/**
		 * Return visible and selected not visible form controls
		 * @returns {*}
		 */
		getElements: function( $form ) {
			var _this = this;

			var visible = _this.getVisibleElements( $form );
			var hidden = _this.getHiddenElements( $form );

			return visible.add( hidden );
		},

		/**
		 * Return visible form controls
		 * @returns {*}
		 */
		getVisibleElements: function( $form ) {
			var _this = this;
			var selector = _this.settings.selectors;

			return $form
				.find( selector.elements.join(',') )
				.not( selector.ignore.join(',') )
				.filter( selector.enabled.join(',') )
				.filter( selector.visible.join(',') );
		},

		/**
		 * Return not visible form controls within selected containers
		 * @returns {*}
		 */
		getHiddenElements: function( $element ) {
			var _this = this;
			var selector = _this.settings.selectors;
			var framework = _this.framework.settings;

			// no containers provided ignore this whole step
			if( !framework.hidden_containers || !framework.hidden_containers.length )
				return [];

			var $results =  $element
				.find( framework.hidden_containers.join(',') )
				.find( selector.elements.join(',') );

			// ignore form elements within these containers
			$.each( selector.exclude ,function( index, container ){
				$.each( selector.elements, function(index2, element ){
					$results = $results.not( container + " " + element );
				});
			});

			$results = $results
				.not( selector.ignore.join(',') )
				.filter( selector.enabled.join(',') )
				.filter( selector.hidden.join(',') );

			return $results;
		},

		// Get all attributes for an element
		getElementAttributes: function( element ) {
			var attributes = {};

			$.each( Array.prototype.slice.call(element.attributes), function(){
				if(this.specified) {
					attributes[ this.name ] = this.value;
				}
			});

			return attributes;
		}
	};

	return $.fn.validator;
});
