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
        Events: {
          EVENT_ONE: "e1",
          EVENT_TWO: "e2"
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
    player = jasmine.createSpyObj( "FakePlayer", [ "play", "pause" ] ),
    mb = jasmine.createSpyObj( "FakePlayer message bus", [ "subscribe", "publish" ]);

    mb.subscribe.and.callFake(function( name, ns, cb ) {
      events.on( name, function( /* evt, ...otherArgs */ ) {
        var otherArgs = [].slice.call( arguments, 1 );
        cb.apply( null, otherArgs );
      });
    });

    mb.publish.and.callFake(function( name/*, ns, ...args */ ) {
      var args = [].slice.call( arguments, 2 );
      events.trigger( name, args );
    });

    player.mb = mb;

    return player;
  };


})( this, this.jasmine );
