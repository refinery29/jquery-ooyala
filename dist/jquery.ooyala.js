/*
 *  jQuery Ooyala - v0.1.1
 *  An easy-to-use, extensible wrapper around Ooyala's Player Javascript API
 *  https://github.com/refinery29/jquery-ooyala
 *
 *  Made with love by Refinery29, Inc.
 *  Under MIT License
 */
// # jQuery-ooyala
//
// jQuery-Ooyala provides a dead-simple interface for creating and working with
// [Ooyala's V3 Javascript Player](http://support.ooyala.com/developers/documentation/concepts/player_v3_api_intro.html).
// It aims to be easy to use, extensible, versatile, and enterprise-grade.
// It is licensed under the [MIT License](http://mit-license.org), and built by your friends on the
// [Refinery29 Mobile Web Team](http://r29mobile.tumblr.com)
//
// Documentation, demos, and usage can be found on [GitHub](https://github.com/refinery29/jquery-ooyala)
//
// For bugs/feature requests, please [create an issue](https://github.com/refinery29/jquery-ooyala/issues/new), and
//
// And of course, **please** [contribute](https://github.com/refinery29/jquery-ooyala/blob/master/CONTRIBUTING.md)! :)
//
;(function( $, window, document, undefined ) {
  "use strict";

  // undefined is used here as the undefined global variable in ECMAScript 3 is
  // mutable (ie. it can be changed by someone else). undefined isn't really being
  // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
  // can no longer be modified.

  // window and document are passed through as local variable rather than global
  // as this (slightly) quickens the resolution process and can be more efficiently
  // minified (especially when both are regularly referenced in your plugin).

  var pluginName = "ooyala",
      // Save a uId in a closure we can use to properly namespace Ooyala objects
      uId = 0,
      // Create the defaults once
      defaults = {
        contentId: undefined,
        favorHtml5: true,
        lazyLoadOn: undefined,
        playerId: undefined,
        playerParams: {},
        playerPlacement: "append",
        urlParams: {}
      },
      // Map of OO.EVENTS property names to the respective css classes that should
      // be applied to a player when that event is triggered from its underlying
      // player's message bus.
      cssEventHooks = {
        ERROR: "oo-player-error",
        PAUSED: "oo-player-paused",
        PLAYBACK_READY: "oo-player-ready",
        PLAYING: "oo-player-playing",
        PLAY_FAILED: "oo-player-error",
        STREAM_PAUSED: "oo-player-paused",
        STREAM_PLAYING: "oo-player-playing",
        STREAM_PLAY_FAILED: "oo-player-error"
      };

  // The actual plugin constructor. Wraps all logic around fetching Ooyala's javascript,
  // creating a player with given content, ensuring Ooyala is completely loaded, etc.
  function OoyalaWrapper ( element, options ) {
    this.el = element;
    this.$el = $(element);
    this.settings = $.extend( true, {}, defaults, options );

    // This will be used to assign this particular player's OO object to the global namespace
    this._ooNamespace = "OO" + uId++;
    // Save a reference to the defaults used with this player
    this._defaults = defaults;
    // Used to identify an object as an instance of the plugin. Cleaner in our opinion than
    // `instanceof`
    this._name = pluginName;
    // Reference to the underlying ooyala player. Directly referencing this is discouraged,
    // but if absolutely needed is possible
    this._player = null;

    this.init();
  }

  OoyalaWrapper.prototype = {
    // ## init()
    //
    // The main initialization function. Usually this is only called once, when the plugin is
    // first instantiated on an element.
    init: function() {
      var self = this;

      // Ooyala's v3 Player requires both a player id and a content id to function properly.
      // If we're missing any of these properties, we won't be able to do anything, so let's
      // error out and immediately inform the consumer that she has made a mistake by omitting
      // these properties.
      if ( !this.settings.playerId ) {
        throw new Error( "You must provide a playerId to $.fn.ooyala()" );
      }

      if ( !this.settings.contentId ) {
        throw new Error( "You must provide a contentId to $.fn.ooyala()" );
      }

      // Take care of applying the correct classes to the element and properly setting up the
      // DOM structure needed for Ooyala to function correctly.
      initDOM.call( this );

      // When lazyLoadOn is specified, we wait for that event to occur before we actually
      // make the call to retrieve the Ooyala player.
      if ( typeof this.settings.lazyLoadOn === "string" ) {
        this.$el.on( this.settings.lazyLoadOn, function() {
          fetchPlayer.call( self );
        });
      } else {
        // ...otherwise we do that immediately
        fetchPlayer.call( this );
      }
    },

    // ## getPlayer()
    //
    // Used to retrieve the player script from Ooyala. Returns a promise object
    // representing the ajax call being made to get the player script.
    getPlayer: function() {
      var scriptUrl = "//player.ooyala.com/v3/" + this.settings.playerId,
          urlParams = this.settings.urlParams;

      // We want to give priority to `urlParams.platform` if it's passed in, so we
      // only look at `favorHtml5` if we don't see the user specifying an exact platform.
      if ( !urlParams.platform ) {
        urlParams.platform = this.settings.favorHtml5 ? "html5-priority" : "flash";
      }

      // Namespace should always be set by us
      urlParams.namespace = this._ooNamespace;

      return $.ajax({
        dataType: "script",
        // prevent multiple network calls for the same player by caching ones that are
        // identical
        cache: true,
        url: scriptUrl + "?" + $.param(urlParams)
      });
    },

    // ## loadContent()
    //
    // Used to load content represented by `contentId` into the current player. Essentially
    // a convenience method for switching between different content.
    loadContent: function( contentId ) {
      // Here we ensure that settings.contentId is always up-to-date with what the
      // underlying player is currently playing, since the trigger logic uses contentId
      // comparisons to determine behaviour.
      this.settings.contentId = contentId;
      this._player.setEmbedCode( contentId );
    },

    // `play()`, `pause()`, `seek()`, and `skipAd()` are all methods that simply proxy
    // to the underlying Ooyala player. They take the same arguments and return the same
    // results.

    play: createProxy( "play" ),

    pause: createProxy( "pause" ),

    seek: createProxy( "seek" ),

    skipAd: createProxy( "skipAd" )
  };

  OoyalaWrapper.initialize = function() {
    // Find all elements with class oo-player and initializes the plugin on
    // each of those elements.
    $( ".oo-player" ).each(function() {
      var $this = $( this ),
          options = $this.data();

      $this.ooyala( options );
    });

    // Find all triggers for a certain player, and bind triggering logic
    // for each.
    $( "[data-oo-player-trigger]" ).each( bindPlayerTrigger );
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

  // Allow initialize() to be triggered via an event on the document.
  $( document ).on( "jquery.ooyala.initialize", OoyalaWrapper.initialize );

  // When the script loads, and the data-auto-init attr on the tag is not
  // set to a falsy value, we automagically call $( el ).ooyala(), where
  // el represents the NodeList of all elements with class "oo-player".
  $(function() {
    var $pluginTag = $( "script[data-auto-init]" );

    // Initial check for the attribute is done here because we want to
    // auto-initialize by default if data-auto-init is omitted completely.
    if ( !$pluginTag.length ||
         $pluginTag.data( "autoInit" ) ) {
      OoyalaWrapper.initialize();
    }
  });

  function fetchPlayer() {
    var self = this;

    self.$el.addClass( "oo-player oo-player-loading" );
    self.getPlayer()
        .done(function() {
          initOO.call(self);
        })
        .fail(function() {
          var err = new Error( "Could not retrieve player with id " + self.settings.playerId );
          self.$el
          .removeClass( "oo-player-loading" )
          .addClass( "oo-player-error" )
          .trigger( "ooyala.error", [ err ] );
        });
  }

  function initOO() {
    var self = this, OO = window[ self._ooNamespace ];

    // We don't want to do *anything* player related until Ooyala lets us know
    // that it's ready
    OO.ready(function() {
      var domId = self.$el.find( ".oo-player-video-container" ).attr( "id" ),
          contentId = self.settings.contentId;

      // If consumers do pass in onCreate as part of `playerParams`, we want to
      // let them know we're disregarding this so we can save them having to source-dive,
      // or re-read the dox, etc. Note on older browsers console.debug may not be available
      // (or console altogether for that matter) so we need to check and make sure we
      // our well-intentioned debug message won't cause the script to die :)
      if ( self.settings.playerParams.onCreate &&
           isObject( console ) && typeof console.debug === "function" ) {
        console.debug(
          "($.ooyala) ignoring onCreate playerParam. Use .on('ooyala.ready') " +
          "to gain access to the player and the OO object"
        );
      }

      self.settings.playerParams.onCreate = function( player ) {
        initPlayer.call( self, player, OO );
      };

      OO.Player.create( domId, contentId, self.settings.playerParams );
    });
  }

  function initDOM() {
    var playerPlacement = this.settings.playerPlacement,
        // This is the DOM element that we'll reference in OO.Player.create(), so we
        // give it a unique id.
        $videoContainer = $(
          "<div id='video_" + this.settings.contentId + "' class='oo-player-video-container'></div>"
        );

    // There seems to be a bug in istanbul where it can't handle multiple
    // `else if` statements, so we're going to ignore this block. :(

    /* istanbul ignore next */
    if ( playerPlacement === "append" ) {
      this.$el.append( $videoContainer );
    } else if ( playerPlacement === "prepend" ) {
      this.$el.prepend( $videoContainer );
    } else if ( typeof playerPlacement === "function" ) {
      playerPlacement.call( this.$el, $videoContainer );
    }

  }

  function initPlayer( player, OO ) {
    var self = this,
        proxyEventHandler;

    // Takes an event key and returns a function that triggers the
    // "ooyala.event.<evtKey>", passing along the arguments given
    // from that event.
    proxyEventHandler = function( evtKey ) {
      return function() {
        var args = [].slice.call(arguments);
        // Get rid of the name that gets sent as the first argument to each callback
        // by Ooyala.
        args.shift();
        self.$el.trigger( "ooyala.event." + evtKey, args );
      };
    };

    // Ensure that we proxy every event that the Ooyala player may fire by enumerating
    // through the keys on the Ooyala object, subscribing to that event, and invoking
    // our proxy event handler when that event is published.
    //
    // We also use these events to keep our player's css updated with the player state.
    // We found this to be more reliable than simply manually updating the css.
    objEach( OO.EVENTS, function( evt, evtKey ) {
      if ( typeof cssEventHooks[ evtKey ] === "string" ) {
        player.mb.subscribe( evt, "oo-player", function() {
          removeAllStateClasses.call( self );
          self.$el.addClass( cssEventHooks[ evtKey ] );
        });
      }

      player.mb.subscribe( evt, "oo-player", proxyEventHandler( evtKey ) );
    });

    // The player is now completely set up, so we assign it to the `_player`
    // property and inform interested parties that we're good to go.
    this._player = player;
    this.$el.trigger( "ooyala.ready", [ this._player, OO ] );
  }

  function removeAllStateClasses() {
    this.$el.removeClass(function( idx, classNames ) {
      return ( classNames.match( /\boo-player-\S+/g ) || [] ).join( " " );
    });
  }

  // `bindPlayerTrigger` takes care of all logic around finding DOM elements
  // that should act as triggers, and making them behave as such.
  function bindPlayerTrigger() {
    var $this = $( this ),
        defaults = { event: "click", seek: 0 },
        options = $.extend( defaults, $this.data().ooPlayerTrigger ),
        ooPlayer;

    // Like $.fn.ooyala(), we need a domId and contentId in order for this
    // to work properly. _Unlike_ $.fn.ooyala(), we simply fail silently if
    // they're not found. HTML elements are easy enough to inspect.
    if ( options.domId && options.contentId ) {
      ooPlayer = $( document.getElementById(options.domId) ).data( "ooyala" );

      $this.on( options.event, function() {
        // Seek if contentId is the same, swap the content otherwise
        if ( options.contentId === ooPlayer.settings.contentId ) {
          ooPlayer.seek( options.seek );
        } else {
          ooPlayer.loadContent( options.contentId );
        }
      });
    }
  }

  // Used to create method proxies for the underlying ooyala player.
  function createProxy( methodName ) {
    return function() {
      var player = this.$el.data( "ooyala" )._player,
          args = [].slice.call(arguments);

      return player[ methodName ].apply(player, args);
    };
  }

  // We need this for the unfortunate `typeof null === "object"` nonsense :(
  function isObject( x ) {
    return typeof x === "object" && x !== null;
  }

  // Safe enumeration through an object, similar to
  // ES5's `Array.prototype.forEach`
  function objEach( obj, iterator, context ) {
    var hasOwn = Object.prototype.hasOwnProperty, key;

    for ( key in obj ) {
      // Not even going to worry about covering this if statement
      /* istanbul ignore next */
      if ( hasOwn.call( obj, key ) ) {
        iterator.call( context, obj[ key ], key, obj );
      }
    }
  }
})( jQuery, window, document );
