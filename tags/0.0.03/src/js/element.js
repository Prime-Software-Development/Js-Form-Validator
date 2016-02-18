// UMD dance - https://github.com/umdjs/umd

!function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(root.jQuery);
	}
}(this, function($) {

	var element = {

	};

	return element;
});