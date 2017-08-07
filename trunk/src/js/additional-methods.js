define(['./core'],function() {

	(function() {

		function stripHtml(value) {
			// remove html tags and space chars
			return value.replace(/<.[^<>]*?>/g, " ").replace(/&nbsp;|&#160;/gi, " ")
				// remove punctuation
				.replace(/[.(),;:!?%#$'\"_+=\/\-“”’]*/g, "");
		}

		$.fn.validator.addMethod("maxWords", function(value, element, params) {
			return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length <= params;
		}, $.fn.validator.format("Please enter {0} words or less."));

		$.fn.validator.addMethod("minWords", function(value, element, params) {
			return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length >= params;
		}, $.fn.validator.format("Please enter at least {0} words."));

		$.fn.validator.addMethod("rangeWords", function(value, element, params) {
			var valueStripped = stripHtml(value),
			    regex = /\b\w+\b/g;
			return this.optional(element) || valueStripped.match(regex).length >= params[0] && valueStripped.match(regex).length <= params[1];
		}, $.fn.validator.format("Please enter between {0} and {1} words."));

	}());

	$.fn.validator.addMethod("alphanumeric", function(value, element) {
		return this.optional(element) || /^\w+$/i.test(value);
	}, "Letters, numbers, and underscores only please");

	/**
	 * Validates currencies with any given symbols by @jameslouiz
	 * Symbols can be optional or required. Symbols required by default
	 *
	 * Usage examples:
	 *  currency: ["£", false] - Use false for soft currency validation
	 *  currency: ["$", false]
	 *  currency: ["RM", false] - also works with text based symbols such as "RM" - Malaysia Ringgit etc
	 *
	 *  <input class="currencyInput" name="currencyInput">
	 *
	 * Soft symbol checking
	 *  currencyInput: {
 *     currency: ["$", false]
 *  }
	 *
	 * Strict symbol checking (default)
	 *  currencyInput: {
 *     currency: "$"
 *     //OR
 *     currency: ["$", true]
 *  }
	 *
	 * Multiple Symbols
	 *  currencyInput: {
 *     currency: "$,£,¢"
 *  }
	 */
	$.fn.validator.addMethod("currency", function(value, element, param) {
		var isParamString = typeof param === "string",
		    symbol = isParamString ? param : param[0],
		    soft = isParamString ? true : param[1],
		    regex;

		symbol = symbol.replace(/,/g, "");
		symbol = soft ? symbol + "]" : symbol + "]?";
		regex = "^[" + symbol + "([1-9]{1}[0-9]{0,2}(\\,[0-9]{3})*(\\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\\.[0-9]{0,2})?|0(\\.[0-9]{0,2})?|(\\.[0-9]{1,2})?)$";
		regex = new RegExp(regex);
		return this.optional(element) || regex.test(value);

	}, "Please specify a valid currency");

// Older "accept" file extension method. Old docs: http://docs.jquery.com/Plugins/Validation/Methods/accept
	$.fn.validator.addMethod("extension", function(value, element, param) {
		param = typeof param === "string" ? param.replace(/,/g, "|") : "png|jpe?g|gif";
		return this.optional(element) || value.match(new RegExp("\\.(" + param + ")$", "i"));
	}, $.fn.validator.format("Please enter a value with a valid extension."));

	$.fn.validator.addMethod("integer", function(value, element) {
		return this.optional(element) || /^-?\d+$/.test(value);
	}, "A positive or negative non-decimal number please");

	$.fn.validator.addMethod("ipv4", function(value, element) {
		return this.optional(element) || /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(value);
	}, "Please enter a valid IP v4 address.");

	$.fn.validator.addMethod("ipv6", function(value, element) {
		return this.optional(element) || /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(value);
	}, "Please enter a valid IP v6 address.");

	$.fn.validator.addMethod("lettersonly", function(value, element) {
		return this.optional(element) || /^[a-z]+$/i.test(value);
	}, "Letters only please");

	$.fn.validator.addMethod("letterswithbasicpunc", function(value, element) {
		return this.optional(element) || /^[a-z\-.,()'"\s]+$/i.test(value);
	}, "Letters or punctuation only please");

	/* For UK phone functions, do the following server side processing:
	 * Compare original input with this RegEx pattern:
	 * ^\(?(?:(?:00\)?[\s\-]?\(?|\+)(44)\)?[\s\-]?\(?(?:0\)?[\s\-]?\(?)?|0)([1-9]\d{1,4}\)?[\s\d\-]+)$
	 * Extract $1 and set $prefix to '+44<space>' if $1 is '44', otherwise set $prefix to '0'
	 * Extract $2 and remove hyphens, spaces and parentheses. Phone number is combined $prefix and $2.
	 * A number of very detailed GB telephone number RegEx patterns can also be found at:
	 * http://www.aa-asterisk.org.uk/index.php/Regular_Expressions_for_Validating_and_Formatting_GB_Telephone_Numbers
	 */
	$.fn.validator.addMethod("mobileUK", function(phone_number, element) {
		phone_number = phone_number.replace(/\(|\)|\s+|-/g, "");
		return this.optional(element) || phone_number.length > 9 &&
			phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?|0)7(?:[1345789]\d{2}|624)\s?\d{3}\s?\d{3})$/);
	}, "Please specify a valid mobile number");

	$.fn.validator.addMethod( "notEqualTo", function( value, element, param ) {
		return this.optional(element) || !$.fn.validator.methods.equalTo.call( this, value, element, param );
	}, "Please enter a different value, values must not be the same." );

	$.fn.validator.addMethod("nowhitespace", function(value, element) {
		return this.optional(element) || /^\S+$/i.test(value);
	}, "No white space please");

	/**
	 * Return true if the field value matches the given format RegExp
	 *
	 * @example $.fn.validator.methods.pattern("AR1004",element,/^AR\d{4}$/)
	 * @result true
	 *
	 * @example $.fn.validator.methods.pattern("BR1004",element,/^AR\d{4}$/)
	 * @result false
	 *
	 * @name $.fn.validator.methods.pattern
	 * @type Boolean
	 * @cat Plugins/Validate/Methods
	 */
	$.fn.validator.addMethod("pattern", function(value, element, param) {
		if (this.optional(element)) {
			return true;
		}
		if (typeof param === "string") {
			param = new RegExp("^(?:" + param + ")$");
		}
		return param.test(value);
	}, "Invalid format.");

	/* For UK phone functions, do the following server side processing:
	 * Compare original input with this RegEx pattern:
	 * ^\(?(?:(?:00\)?[\s\-]?\(?|\+)(44)\)?[\s\-]?\(?(?:0\)?[\s\-]?\(?)?|0)([1-9]\d{1,4}\)?[\s\d\-]+)$
	 * Extract $1 and set $prefix to '+44<space>' if $1 is '44', otherwise set $prefix to '0'
	 * Extract $2 and remove hyphens, spaces and parentheses. Phone number is combined $prefix and $2.
	 * A number of very detailed GB telephone number RegEx patterns can also be found at:
	 * http://www.aa-asterisk.org.uk/index.php/Regular_Expressions_for_Validating_and_Formatting_GB_Telephone_Numbers
	 */
	$.fn.validator.addMethod("phoneUK", function(phone_number, element) {
		phone_number = phone_number.replace(/\(|\)|\s+|-/g, "");
		return this.optional(element) || phone_number.length > 9 &&
			phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?)|(?:\(?0))(?:\d{2}\)?\s?\d{4}\s?\d{4}|\d{3}\)?\s?\d{3}\s?\d{3,4}|\d{4}\)?\s?(?:\d{5}|\d{3}\s?\d{3})|\d{5}\)?\s?\d{4,5})$/);
	}, "Please specify a valid phone number");

	/* For UK phone functions, do the following server side processing:
	 * Compare original input with this RegEx pattern:
	 * ^\(?(?:(?:00\)?[\s\-]?\(?|\+)(44)\)?[\s\-]?\(?(?:0\)?[\s\-]?\(?)?|0)([1-9]\d{1,4}\)?[\s\d\-]+)$
	 * Extract $1 and set $prefix to '+44<space>' if $1 is '44', otherwise set $prefix to '0'
	 * Extract $2 and remove hyphens, spaces and parentheses. Phone number is combined $prefix and $2.
	 * A number of very detailed GB telephone number RegEx patterns can also be found at:
	 * http://www.aa-asterisk.org.uk/index.php/Regular_Expressions_for_Validating_and_Formatting_GB_Telephone_Numbers
	 */
//Matches UK landline + mobile, accepting only 01-3 for landline or 07 for mobile to exclude many premium numbers
	$.fn.validator.addMethod("phonesUK", function(phone_number, element) {
		phone_number = phone_number.replace(/\(|\)|\s+|-/g, "");
		return this.optional(element) || phone_number.length > 9 &&
			phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?|0)(?:1\d{8,9}|[23]\d{9}|7(?:[1345789]\d{8}|624\d{6})))$/);
	}, "Please specify a valid uk phone number");

// Matches UK postcode. Does not match to UK Channel Islands that have their own postcodes (non standard UK)
	$.fn.validator.addMethod("postcodeUK", function(value, element) {
		return this.optional(element) || /^((([A-PR-UWYZ][0-9])|([A-PR-UWYZ][0-9][0-9])|([A-PR-UWYZ][A-HK-Y][0-9])|([A-PR-UWYZ][A-HK-Y][0-9][0-9])|([A-PR-UWYZ][0-9][A-HJKSTUW])|([A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]))\s?([0-9][ABD-HJLNP-UW-Z]{2})|(GIR)\s?(0AA))$/i.test(value);
	}, "Please specify a valid UK postcode");

	$.fn.validator.addMethod({
		method_name: "time",
		is_class_rule: false,
		is_attribute_rule: false,
		is_data_rule: true
	}, function(value, element) {
		return this.optional(element) || /^([01]\d|2[0-3]|[0-9])(:[0-5]\d){1,2}$/.test(value);
	}, "Please enter a valid time, between 00:00 and 23:59");

	$.fn.validator.addMethod("time12h", function(value, element) {
		return this.optional(element) || /^((0?[1-9]|1[012])(:[0-5]\d){1,2}(\ ?[AP]M))$/i.test(value);
	}, "Please enter a valid time in 12-hour am/pm format");

	$.fn.validator.addMethod("timeRange", function(value, element) {

		var result = true;
		var earliest_time = $(element ).data('earliest-time');
		var latest_time = $(element ).data('latest-time');
		if ( value < earliest_time || value > latest_time ) {
			result = false;
		}

		return this.optional(element) || result;
	}, "Please enter a valid time" );
});