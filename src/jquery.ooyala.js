;(function( $, window, document, undefined ) {
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
      uId = 0,
      defaults = {
        contentId: undefined,
        favorHtml5: true,
        lazyLoadOn: undefined,
        playerId: undefined,
        playerParams: {},
        playerPlacement: "append",
        urlParams: {}
      },
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

  // The actual plugin constructor
  function OoyalaWrapper ( element, options ) {
    this.el = element;
    this.$el = $(element);
    this.settings = $.extend( true, {}, defaults, options );

    this._ooNamespace = "OO" + uId++;
    this._defaults = defaults;
    this._name = pluginName;
    this._player = null;

    this.init();
  }

  OoyalaWrapper.prototype = {
    init: function() {
      var self = this;

      if ( !this.settings.playerId ) {
        throw new Error( "You must provide a playerId to $.fn.ooyala()" );
      }

      if ( !this.settings.contentId ) {
        throw new Error( "You must provide a contentId to $.fn.ooyala()" );
      }

      initDOM.call( this );

      if ( typeof this.settings.lazyLoadOn === "string" ) {
        this.$el.on( this.settings.lazyLoadOn, function() {
          fetchPlayer.call( self );
        });
      } else {
        fetchPlayer.call( this );
      }
    },

    getPlayer: function() {
      var scriptUrl = "//player.ooyala.com/v3/" + this.settings.playerId,
          urlParams = this.settings.urlParams;

      if ( !urlParams.platform ) {
        urlParams.platform = this.settings.favorHtml5 ? "html5-priority" : "flash";
      }

      // Namespace should always be set by us
      urlParams.namespace = this._ooNamespace;

      return $.ajax({
        dataType: "script",
        cache: true,  // prevent multiple calls for the same player
        url: scriptUrl + "?" + $.param(urlParams)
      });
    },

    loadContent: function( contentId ) {
      this.settings.contentId = contentId;
      this._player.setEmbedCode( contentId );
    },

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

  function fetchPlayer() {
    var self = this;

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

    OO.ready(function() {
      var domId = self.$el.find(".oo-player-video-container").attr("id"),
      contentId = self.settings.contentId;

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
        $videoContainer = $( "<div id='video_" + this.settings.contentId + "' class='oo-player-video-container'></div>" );

    // There's a bug in istanbul where it can't handle multiple else if statements, so we're going to
    // ignore this block. :(
    /* istanbul ignore next */
    if ( playerPlacement === "append" ) {
      this.$el.append( $videoContainer );
    } else if ( playerPlacement === "prepend" ) {
      this.$el.prepend( $videoContainer );
    } else if ( typeof playerPlacement === "function" ) {
      playerPlacement.call( this.$el, $videoContainer );
    }

    this.$el.addClass( "oo-player oo-player-loading" );
  }

  function initPlayer( player, OO ) {
    var self = this,
        proxyEventHandler;

    proxyEventHandler = function( evtKey ) {
      return function() {
        var args = [].slice.call(arguments);
        // Get rid of the name that gets sent as the first argument to each subscription
        args.shift();
        self.$el.trigger( "ooyala.event." + evtKey, args );
      };
    };

    objEach( OO.EVENTS, function( evt, evtKey ) {
      if ( typeof cssEventHooks[ evtKey ] === "string" ) {
        player.mb.subscribe( evt, "oo-player", function() {
          removeAllStateClasses.call( self );
          self.$el.addClass( cssEventHooks[ evtKey ] );
        });
      }

      player.mb.subscribe( evt, "oo-player", proxyEventHandler( evtKey ) );
    });

    this._player = player;
    this.$el.trigger( "ooyala.ready", [ this._player, OO ] );
  }

  function removeAllStateClasses() {
    this.$el.removeClass(function( idx, classNames ) {
      return ( classNames.match( /\boo-player-\S+/g ) || [] ).join( " " );
    });
  }

  function bindPlayerTrigger() {
    var $this = $( this ),
    defaults = { event: "click", seek: 0 },
    options = $.extend( defaults, $this.data().ooPlayerTrigger ),
    ooPlayer;

    if ( options.domId && options.contentId ) {
      ooPlayer = $( document.getElementById(options.domId) ).data( "ooyala" );

      $this.on( options.event, function() {

        if ( options.contentId === ooPlayer.settings.contentId ) {
          ooPlayer.seek( options.seek );
        } else {
          ooPlayer.loadContent( options.contentId );
        }
      });
    }
  }

  function createProxy( methodName ) {
    return function() {
      var player = this.$el.data( "ooyala" )._player,
      args = [].slice.call(arguments);

      player[ methodName ].apply(player, args);
    };
  }

  function isObject( x ) {
    return typeof x === "object" && x !== null;
  }

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
