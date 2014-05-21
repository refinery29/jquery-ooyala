;(function ( $, window, document, undefined ) {
	"use strict";

	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).

	// Create the defaults once
	var pluginName = "ooyala",
	defaults = {
		propertyName: "value"
	};

	// The actual plugin constructor
	function OoyalaWrapper ( element, options ) {
		this.el = element;
		this.$el = $(element);
		this.settings = $.extend(true, {}, defaults, options );

		this._defaults = defaults;
		this._name = pluginName;
		this._player = null;

		this.init();
	}

	OoyalaWrapper.prototype = {
		init: function() {
			// something
		},
		getPlayer: function() {
			// some logic
		},
		play: function() {
		},
		pause: function() {
		},
		showThumb: function() {
		},
		hideThumb: function() {
		},
		loadVideo: function() {
		}
	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options ) {
		this.each(function() {
			if ( !$.data( this, pluginName ) ) {
				$.data( this, pluginName, new OoyalaWrapper( this, options ) );
			}
		});

		// chain jQuery functions
		return this;
	};

})( jQuery, window, document );
