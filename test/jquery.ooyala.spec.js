describe( "jquery.ooyala", function() {
	"use strict";

	beforeEach(function() {
		this.$el = $("<div id='test-el'></div>");
		this.useCtorShorthand = false;
		this.options = {
			contentId: "abc",
			playerId: "123"
		};

		this.initPlugin = function() {
			var args = this.useCtorShorthand ?
								 [this.options.contentId, this.options.playerId] :
								 [this.options];

			return this.$el.ooyala.apply(this.$el, args);
		};

		this.let_( "$oo", this.initPlugin.bind(this));

		spyOn( $, "getScript" ).and.callFake(function() {
			return ( new $.Deferred() ).promise();
		});
	});

	describe( "initialization", function() {
		describe( "when the plugin has not yet been instantiated on the element", function() {
			it( "instantiates an OoyalaWrapper and adds it to data('ooyala')", function() {
				expect( this.$oo.data("ooyala") ).toEqual(jasmine.objectContaining({
					_name: "ooyala"
				}));
			});
		});

		describe( "when the plugin has already been instantiated on the element", function() {
			beforeEach(function() {
				this.oldInstance = this.$oo.data( "ooyala" );
			});

			it( "does not instantiate the player more than once", function() {
				expect( this.$oo.ooyala(this.options).data( "ooyala" ) ).toBe(this.oldInstance);
			});
		});
	});
});
