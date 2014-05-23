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

    this.let_( "$oo", this.initPlugin.bind(this) );

    spyOn( $, "ajax" ).and.callFake(function() {
      this.deferred = new $.Deferred();
      return this.deferred.promise();
    }.bind(this) );

    this.initWorld = function() {
      var ooyala;
      this.$el.ooyala( this.options );
      ooyala = this.$el.data( "ooyala" );
      this.fauxO( ooyala._ooNamespace );
    };
  });

  describe( "initialization", function() {
    describe( "when the plugin has not yet been instantiated on the element", function() {
      it( "instantiates an OoyalaWrapper and adds it to data('ooyala')", function() {
        expect( this.$oo.data("ooyala") ).toEqual(jasmine.objectContaining({
          _name: "ooyala"
        }));
      });

      it( "makes a ajax call for a namespaced ooyala player given by playerId", function() {
        this.$el.ooyala( this.options );
        expect( $.ajax ).toHaveBeenCalledWith( jasmine.objectContaining({
          dataType: "script",
          url: "//player.ooyala.com/v3/" + this.options.playerId +
               "/?platform=html5-priority" + "&namespace=" +
               this.$el.data( "ooyala" )._ooNamespace
        }));
      });

      it( "uses caching to ensure multiple calls for the same script aren't made", function() {
        this.$el.ooyala( this.options );
        expect( $.ajax ).toHaveBeenCalledWith( jasmine.objectContaining({
          cache: true
        }));
      });

      it( "adds an oo-player-loading class to the element", function() {
        expect( this.$oo ).toHaveClass( "oo-player-loading" );
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

    describe( "when no playerId is provided", function() {
      beforeEach(function() {
        delete this.options.playerId;
      });

      it( "throws an error", function() {
        expect( function() {
          this.$el.ooyala( this.options );
        }.bind(this) ).toThrow();
      });
    });

    describe( "when no contentId is provided", function() {
      beforeEach(function() {
        delete this.options.contentId;
      });

      it( "throws an error", function() {
        expect( function() {
          this.$el.ooyala( this.options );
        }.bind(this) ).toThrow();
      });
    });

    describe( "DOM structure", function() {
      it( "creates a top-level DOM element of class 'oo-player'", function() {
        expect( this.$oo ).toHaveClass( "oo-player" );
      });

      describe( "player placement", function() {
        beforeEach(function() {
          loadFixtures( "element_with_children.html" );
          this.$el = $( "#jasmine-fixtures" );
        });

        it( "by default appends the player to the element", function() {
          expect( this.$oo.children().last() ).toHaveClass( "oo-player-video-container" );
        });

        it( "assigns an id of 'video_<contentId>' to the element", function() {
          expect( this.$oo.find( ".oo-player-video-container" ) ).toHaveAttr( "id", "video_" + this.options.contentId );
        });

        describe( "when options.playerPlacement = 'append'", function() {
          beforeEach(function() {
            this.options.playerPlacement = "append";
          });

          it( "appends the player to the element", function() {
            expect( this.$oo.children().last() ).toHaveClass( "oo-player-video-container" );
          });
        });

        describe( "when options.playerPlacement = 'prepend'", function() {
          beforeEach(function() {
            this.options.playerPlacement = "prepend";
          });

          it( "prepends the player to the element", function() {
            expect( this.$oo.children().first() ).toHaveClass( "oo-player-video-container" );
          });
        });

        describe( "when options.playerPlacement is a function", function() {
          beforeEach(function() {
            this.placementFn = jasmine.createSpy( "playerPlacement function" );
            this.options.playerPlacement = this.placementFn;

            this.$el.ooyala( this.options );
            this.placementCall = this.options.playerPlacement.calls.first();
          });

          it( "invokes placementFn in order to place the element", function() {
            expect( this.placementFn ).toHaveBeenCalled();
          });

          it( "calls placementFn with the video player jquery object as its argument", function() {
            expect( this.placementCall.args[0] ).toHaveClass( "oo-player-video-container" );
          });

          it( "invokes the placementFn with the jquery object ooyala() was called on as the receiver", function() {
            expect( this.placementCall.object ).toBe( this.$el.data( "ooyala" ).$el );
          });
        });
      });
    });

    describe( "when the video player is successfully retrieved", function() {
      beforeEach(function() {
        this.initWorld();
        this.evtSpy = spyOnEvent( this.$el, "ooyala.ready" );
        this.e1Spy = jasmine.createSpy( "ooyala.event.EVENT_ONE spy" );
        this.e2Spy = jasmine.createSpy( "ooyala.event.EVENT_TWO spy" );

        this.deferred.resolve();
      });

      it( "proxies all OO.Events to the element", function() {
        var player = this.$oo.data( "ooyala" )._player;

        this.$oo
            .on( "ooyala.event.EVENT_ONE", this.e1Spy )
            .on( "ooyala.event.EVENT_TWO", this.e2Spy );

        player.mb.publish( this.OO.Events.EVENT_ONE, "", "foo" );
        player.mb.publish( this.OO.Events.EVENT_TWO, "", "bar", "baz" );

        expect( this.e1Spy ).toHaveBeenCalledWith( jasmine.any( Object ), "foo" );
        expect( this.e2Spy ).toHaveBeenCalledWith( jasmine.any( Object ), "bar", "baz" );
      });

      it( "triggers ooyala.ready and passes it (player, OO)", function() {
        var player = this.$el.data( "ooyala" )._player;
        expect( "ooyala.ready" ).toHaveBeenTriggeredOnAndWith( this.$el, [ player, this.OO ] );
      });

      it( "adds an oo-player-ready class to the element", function() {
        expect( this.$el ).toHaveClass( "oo-player-ready" );
      });

      it( "removes the oo-player-loading class from the element", function() {
        expect( this.$el ).not.toHaveClass( "oo-player-loading" );
      });
    });

    describe( "when the video player retrieval fails", function() {
      beforeEach(function() {
        this.evtSpy = spyOnEvent( this.$el, "ooyala.error" );

        this.$el.ooyala( this.options );
        this.deferred.reject();
      });

      it( "triggers ooyala.error and passes it an Error object", function() {
        expect( "ooyala.error" ).toHaveBeenTriggeredOnAndWith( this.$el, [
          new Error( "Could not retrieve player with id " + this.options.playerId )
        ]);
      });

      it( "adds an oo-player-error class to the element", function() {
        expect( this.$el ).toHaveClass( "oo-player-error" );
      });

      it( "removes the oo-player-loading class from the element", function() {
        expect( this.$el ).not.toHaveClass( "oo-player-loading" );
      });
    });
  }); // initialization

  describe( "#init", function() {
    describe( "when settings.lazyLoadOn is a string representing an event", function() {
      beforeEach(function() {
        this.evt = "click";
        this.options.lazyLoadOn = this.evt;
        this.$el.ooyala( this.options );
      });

      it( "does not immediately make the call for the script", function() {
        expect( $.ajax ).not.toHaveBeenCalled();
      });

      it( "waits until that event is triggered on the element to load the player", function() {
        this.$el.trigger( this.evt );
        expect( $.ajax ).toHaveBeenCalled();
      });
    });
  });

  describe( "#getPlayer", function() {
    describe( "when options.uriParams is an object", function() {
      beforeEach(function() {
        this.options.urlParams = {
          foo: "bar",
          baz: "your mom",
          platform: "html5-fallback"
        };
        this.initWorld();
      });

      it( "makes the ajax call for the script with the included uriParams", function() {
        expect( $.ajax.calls.mostRecent().args[0].url ).toContain( "platform=html5-fallback" );
        expect( $.ajax.calls.mostRecent().args[0].url ).toContain( "foo=bar" );
        expect( $.ajax.calls.mostRecent().args[0].url ).toContain( "baz=your+mom" );
      });
    });

    describe( "when options.favorHtml5 is falsy", function() {
      beforeEach(function() {
        this.options.favorHtml5 = false;
        this.initWorld();
      });

      it( "uses platform=flash instead of platform=html5-priority", function() {
        expect( $.ajax.calls.mostRecent().args[0].url ).toContain( "platform=flash" );
      });
    });

    describe( "when options.playerParams is an object", function() {
      beforeEach(function() {
        this.debugSpy = spyOn( console, "debug" );
        this.options.playerParams = {
          foo: 1,
          bar: 2
        };
        this.initWorld();
      });

      it( "calls OO.Player.create with the given params as the 3rd argument", function() {
        this.deferred.resolve();
        expect( this.OO.Player.create ).toHaveBeenCalledWith(
          jasmine.any(String), jasmine.any(String), jasmine.objectContaining( this.options.playerParams )
        );
      });

      describe( "when onCreate is given as part of options.playerParams", function() {
        beforeEach(function() {
          this.options.playerParams.onCreate = jasmine.createSpy( "onCreate callback" );
          $.extend( this.$el.data( "ooyala" ).settings.playerParams, this.options.playerParams);
        });

        it( "sanitizes the property to use what we provide", function() {
          this.deferred.resolve();
          expect( this.options.playerParams.onCreate ).not.toHaveBeenCalled();
        });

        describe( "when a console object with debug() method is in the environment", function() {
          beforeEach(function() {
            this.deferred.resolve();
          });

          it( "logs a debug message to the console about using ooyala.ready instead of onCreate", function() {
            expect( this.debugSpy ).toHaveBeenCalledWith(
              "($.ooyala) ignoring onCreate playerParam. Use .on('ooyala.ready') " +
              "to gain access to the player and the OO object"
            );
          });
        });

        describe( "when a console object is in scope but does not have debug", function() {
          beforeEach(function() {
            this.realDebug = console.debug;
            delete console.debug;
            this.deferred.resolve();
          });

          afterEach(function() {
            console.debug = this.realDebug;
          });

          it( "does not log anything out", function() {
            expect( this.debugSpy ).not.toHaveBeenCalled();
          });
        });
      });
    });
  }); // #getPlayer

  describe( "proxied ooyala player methods", function() {
    beforeEach(function() {
      var OO;

      this.initWorld();
      this.deferred.resolve();
      OO = this.OO;

      this.ooPlayer = this.$oo.data( "ooyala" )._player;
    });

    describe( "#play", function() {
      beforeEach(function() {
        this.$el.data( "ooyala" ).play();
      });

      it( "calls play() on the underlying ooyala player", function() {
        expect( this.ooPlayer.play ).toHaveBeenCalled();
      });
    });

    describe( "#pause", function() {
      beforeEach(function() {
        this.$el.data( "ooyala" ).pause();
      });

      it( "calls pause() on the underlying ooyala player", function() {
        expect( this.ooPlayer.pause ).toHaveBeenCalled();
      });
    });

    describe( "#seek", function() {
      beforeEach(function() {
        this.$el.data( "ooyala" ).seek( 250 );
      });

      it( "calls seek() on the underlying ooyala player and passes the arguments through", function() {
        expect( this.ooPlayer.seek ).toHaveBeenCalledWith( 250 );
      });
    });

    describe( "#skipAd", function() {
      beforeEach(function() {
        this.$el.data( "ooyala" ).skipAd();
      });

      it( "calls skipAd() on the underlying ooyala player", function() {
        expect( this.ooPlayer.skipAd ).toHaveBeenCalled();
      });
    });
  });

  describe( "#loadContent", function() {
    beforeEach(function() {
      this.newContentId = "def456";
      this.initWorld();
      this.deferred.resolve();
      this.ooPlayer = this.$el.data( "ooyala" )._player;
      this.$el.data( "ooyala" ).loadContent( this.newContentId );
    });

    it( "sets the content id to the new id", function() {
      expect( this.$el.data( "ooyala" ).settings.contentId ).toEqual( this.newContentId );
    });

    it( "calls setEmbedCode() using the new contentId", function() {
      expect( this.ooPlayer.setEmbedCode ).toHaveBeenCalledWith( this.newContentId );
    });
  });

});
