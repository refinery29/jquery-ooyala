(function( global, jasmine ) {
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

  // Set the correct fixtures path for our code
  jasmine.getFixtures().fixturesPath = "/base/test/fixtures";

  // Preload all fixtures here, since synchronous ajax does not
  // work with 1.8+, and that's what jasmine-jquery uses in its
  // loadFixtures() call.
  jasmine.getFixtures().preload(
    "auto_init_element.html",
    "element_with_children.html",
    "content_trigger_elements.html"
  );

  // Add lazy evaluation functionality and fake OO
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

    this.fauxO = function( namespace ) {
      namespace = namespace || "OO";

      this.OO = window[ namespace ] = {
        Player: jasmine.createSpyObj( "Player", [ "create" ] ),
        EVENTS: {
          ERROR: "error",
          EVENT_ONE: "e1",
          EVENT_TWO: "e2",
          PAUSED: "paused",
          PLAYBACK_READY: "playbackready",
          PLAYED: "played",
          PLAYING: "playing",
          PLAY_FAILED: "playfailed",
          STREAM_PAUSED: "streampaused",
          STREAM_PLAYING: "streamplaying",
          STREAM_PLAY_FAILED: "streamplayfailed",
          WILL_PLAY: "willplay"
        },
        ready: function( fn ) { fn(); }
      };

      this.OO.Player.create.and.callFake(function( domId, contentId, options ) {
        var fakePlayer = new FakePlayer();
        options.onCreate( fakePlayer );
      });
    };
  });

  // Mock Ooyala Player, including fake Message Bus
  global.FakePlayer = function FakePlayer() {
    var events = $({}),
    player = jasmine.createSpyObj( "FakePlayer", [ "play", "pause", "seek", "skipAd", "destroy", "setEmbedCode" ] ),
    mb = jasmine.createSpyObj( "FakePlayer message bus", [ "subscribe", "publish" ]);

    mb.subscribe.and.callFake(function( name, ns, cb ) {
      events.on( name, function( /* evt, ...otherArgs */ ) {
        var otherArgs = [].slice.call( arguments, 1 );
        cb.apply( null, otherArgs );
      });
    });

    mb.publish.and.callFake(function( name/*, ...args */ ) {
      var args = [].slice.call( arguments, 1 );
      // make it behave like the ooyala message bus
      args.unshift( name );
      events.trigger( name, args );
    });

    player.mb = mb;

    return player;
  };


})( this, this.jasmine );
