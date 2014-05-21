(function(jasmine ) {
	"use strict";

	// Bind shim for PhantomJS
	if ( typeof Function.prototype.bind !== "function" ) {
		Function.prototype.bind = function( rcvr/*, ...preArgs */ ) {
			var slice = [].slice,
					preArgs = slice.call(arguments, 1),
					boundFn = this;

			return function __bound__() {
				var args = preArgs.concat( slice.call(arguments) );
				return boundFn.apply(rcvr, args);
			};
		};
	}

	jasmine.getFixtures().fixturesPath = "test/fixtures";

	beforeEach(function() {
		this.let_ = function( name, getter ) {
			var _lazy;

			Object.defineProperty( this, name, {
				get: function() {
					if ( !_lazy ) {
						_lazy = getter.call( this );
					}
					return _lazy;
				},
				set: function() {},
				enumerable: true,
				configurable: true
			});
		};
	});
})( this.jasmine );
