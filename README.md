jquery-ooyala
=============

jQuery-Ooyala provides a dead-simple interface for creating and working with [Ooyala's V3 Javascript Player](http://support.ooyala.com/developers/documentation/concepts/player_v3_api_intro.html). It is:

#### Easy to use 
* Requires **no javascript out of the box**: all behaviour and initialization can be configured via data attributes on HTML elements
* Takes care of _all_ tasks needed to embed content from Ooyala onto a page

#### Extensible
* Support for multiple players on pages 
* Support for lazy loading of players on specified events
* Plethora of css hooks to use to style the player given its state

#### Versatile 
* Robust javascript API for high and low-level interfaces to the Ooyala player
* Mechanisms for accessing the global `OO` object for a player, as well as the underlying Ooyala player itself
* Chainable, jquery-like interface for subscribing to player events
* Fine-grained control over the plugin's automatic initialization logic

#### Enterprise-Grade
* Built using [jquery-boilerplate](https://github.com/jquery-boilerplate/jquery-boilerplate)
* Full suite of [jasmine](http://jasmine.github.io/2.0/introduction.html) unit tests
* 100% code coverage, verified by [istanbul](http://gotwarlost.github.io/istanbul/)
* Heavily annotated source code, and a plethora of demos to get you up and running quickly!

Built by your friends on the [Refinery29 Mobile Web Team](http://r29mobile.tumblr.com/)

## Installation

You can install jquery-ooyala using either [bower](http://bower.io/)

```sh
$ bower install jquery-ooyala
```

or npm

```sh
$ npm install jquery-ooyala
```

## Basic Usage

### Initializing the player

In your html, add an element with class "oo-player", as well as a script tag pointing to jquery and jquery-ooyala

```html
<div class="oo-player" 
     data-player-id="your_player_id"
     data-content-id="your_content_id"></div>
<!-- .... -->
<script src="/vendor/jquery/jquery.js"></script>
<!-- use dist/jquery.ooyala.min.js for a minified version -->
<script src="/vendor/jquery-ooyala/dist/jquery.ooyala.js"></script>
```

And that's all there is to it! jquery-ooyala will take care of all the plumbing around loading the Ooyala v3 player represented by the id specified in `data-player-id`, as well as create the Player with the video specified by `data-content-id`.

You can, of course, also use Javascript to initialize the plugin. Assuming you have the following html

```html
<div id="your-ooyala-player-element"></div>
<!-- .... -->
<script src="/vendor/jquery/jquery.js"></script>
<!-- use dist/jquery.ooyala.min.js for a minified version -->
<script src="/vendor/jquery-ooyala/dist/jquery.ooyala.js"></script>
```

Then you can instantiate the plugin like so:

```javascript
$( "#your-ooyala-player-element" ).ooyala({
    playerId: "your_player_id",
    contentId: "your_content_id"
});
```

Note that in either case, **playerId and contentId are required**.

### Lazy loading

Often times, especially on mobile, you'll want to wait until a user interacts with an element on your page before you load all of the assets needed for the ooyala player. You can easily achieve this functionality using jquery-ooyala by specifying an event it should listen for before loading the player.

```html
<div class="oo-player"
     data-player-id="your_player_id"
     data-content-id="your_content_id"
     data-lazy-load-on="touchend"
    >Tap me to load a video!</div>
```

Now the ooyala player will not be loaded until a `touchend` event is triggered on that element. 

You can achieve the same result using javascript:

```javascript
$( "#your-ooyala-player-element" ).ooyala({
    playerId: "your_player_id",
    contentId: "your_content_id",
    lazyLoadOn: "touchend"
});
```

### Using the Flash-based player

By default, jquery-ooyala opts for loading Ooyala's HTML5-based video player, rather than its flash version. If you'd like to disabled this functionality and only use the HTML5 player as a fallback by using `data-favor-html5="false"` on an `.oo-player` element, or by specifying `favorHtml5: false` as an option to the plugin call in Javascript. Note that there are other "platforms" you can use for the player, which can be specified by a custom URI param to the player script tag. For more info on this, see the section on Custom script tag / player params below.

### Customizing player placement within an element

jquery-ooyala allows you to control where exactly the player gets placed within its containing element via the `data-player-placement` attribute (html) / `playerPlacement` option (javascript). This option can have 3 possible values:

1. **"append"** - The player will be appended to the element
2. **"prepend"** - The player will be prepended to the element
3. **function( $videoContainer )** - A function can be used here to provide complete control over exactly where the player gets placed. It will be passed a jquery object representing the element containing all of the Ooyala DOM. This value of `this` in this function will be set to the jquery object representing the element the plugin was called on.

Here's how you could specify player placement using HTML
```html
<div class="oo-player"
     data-player-id="your_player_id"
     data-content-id="your_content_id"
     data-player-placement="prepend"
>
    <p>This text will appear below the ooyala player</p>
</div>
```

And here's how you could specify it within javascript using a custom placement function:
```javascript
$( "#your-ooyala-player-element" ).ooyala({
    playerId: "your_player_id",
    contentId: "your_content_id",
    playerPlacement: function( $videoContainer ) {
        this.find( ".some-inner-container" ).append( $videoContainer );
    }
});
```

### CSS Hooks

jquery-ooyala provides the following css hooks for styling:

* `oo-player` is added to every element which the plugin is called on
* `oo-player-loading` is applied during initialization (before the player/content has loaded) as well as when different videos are being loaded
* `oo-player-ready` is applied when content has been loaded and is ready to be played
* `oo-player-playing` is applied when the player is current playing content 
* `oo-player-paused` is applied when currently playing content is paused
* `oo-player-error` is applied if there is an error loading the player script, or if there is an error when loading content for a player

We use [SMACCS](http://smacss.com/)-style naming conventions and don't apply any styling ourselves. Therefore you can apply universal styles using `oo-player`, and then apply more specific styles using the `oo-player-*` state specifiers.

## Advanced Usage

### Subscribing to player events

jquery-ooyala provides an interface to subscribe to Player events in the same way that you would subscribe to any other event on a jquery object. The format for subscribing to these events is `"ooyala.event.<EVENT_KEY>"`, where `<EVENT_KEY>` corresponds to a property name on the `OO.EVENTS` object. All arguments sent by the player message bus will be passed onto the event handlers.

```javascript
$( "#your-ooyala-player-element" ).ooyala( { /* ... */ })
                                  .on( "ooyala.event.WILL_PLAY_ADS ooyala.event.WILL_PLAY_SINGLE_AD", showAdBanner )
                                  .on( "ooyala.event.WILL_RESUME_MAIN_VIDEO", hideAdBanner )
                                  .on( "ooyala.event.FULLSCREEN_CHANGED", function( evt, isFullscreen ) { 
                                    console.debug( ( isFullscreen ? "Fullscreen mode on" : "Fullscreen mode off" ) );
                                  });
```

For more information on the events you can hook into, take a look at Ooyala's [Player Message Bus Events](http://support.ooyala.com/developers/documentation/api/player_v3_api_events.html)

### Using Additional Elements to Load / Seek Within Videos

A common use case with any video player is the ability to change the current video that is playing. This can be accomplished by using what we call "triggers". Triggers are elements that, when interacted with, will change the state of the player. A trigger looks something like this:
```html
<div id="player"
     class="oo-player"
     data-player-id="abc"
     data-content-id="123"></div>
<button data-oo-player-trigger='{ "domId": "player", "contentId": "456" }'>Play different video</button>
```

The `data-oo-player-trigger` param lets jquery-ooyala know that when the button is clicked, then the player within `<div id="player"/>` should be load in the content
represented by id `"456"`. These triggers are registered when jquery-ooyala first initializes.

Triggers can also be used to seek within the same video. This is useful for longer videos, in which you may want something similar to "Chapters"
```html
<div id="player"
     class="oo-player"
     data-player-id="abc"
     data-content-id="123"></div>
<button data-oo-player-trigger='{ "domId": "player", "contentId": "123", "seek": 0 }'>Chapter 1 (0:00)</button>
<button data-oo-player-trigger='{ "domId": "player", "contentId": "123", "seek": 300 }'>Chapter 2 (5:00)</button>
```

The properties that can be specified within this object are as follows:

* **domId**: _(Required)_ The id of an element which jquery-ooyala was initialized on.
* **contentId**: _(Required)_ The id of the content that should be loaded.
* **seek**: _(Default: 0)_ If the `contentId` is the same as the current `contentId` for the content that's playing, this will cause the player to seek to the specified
    offset (in seconds) within that video. **Note that this property will do nothing if the `contentId`s differ**
* **event**: _(Default: "click")_ String representing the event that will be listened to in order to active the trigger. Useful for mobile devices, or for more interactive video experiences where you want things to change on mouseovers, mousemoves, etc.

Note that this functionality can be emulated relatively easily using Javascript
```javascript
var $el = $( "#your-ooyala-player-element" ).ooyala( { /* ... */ }),
    ooyala = $el.data( "ooyala" );

$( "#btn-play-some-video" ).on( "click", function() {
    ooyala.loadContent( "content_id_of_some_video" );
});

$( "#btn-seek-some-video" ).on( "click", function() {
    if ( ooyala.settings.contentId === "content_id_of_some_video" ) {
        ooyala.seek( 60 );
    }
});
```

### Custom script tag / player params

If you need to provide any [query paramaters](http://support.ooyala.com/developers/documentation/reference/player_v3_dev_querystringparams.html) to the player script call, or need to provide any additional [embedded parameters](http://support.ooyala.com/developers/documentation/api/player_v3_api_embedparams.html) to the ooyala player, you can do so by using `data-url-params` and `data-player-params`, respectively.

```html
<div class="oo-player"
     data-player-id="your_player_id"
     data-content-id="your_content_id"
     data-url-params='{ "platform": "html5-fallback" }'
     data-player-params='{ "autoplay": true, "initialTime": 30 }'></div>
```

```javascript
$( "#your-ooyala-player-element" ).ooyala({ 
    playerId: "your_player_id",
    contentId: "your_content_id",
    urlParams: { platform: "html5-fallback" },
    playerParams: { autoplay: true, initialTime: 30 }
});
```

Note that for url params, `namespace` will be ignored, as we control that internally. Additionally, `onCreate` is ignored in player params. See the next section for info on how to hook into `onCreate`.

### Directly accessing the Ooyala global object and player 

When the ooyala script has completely loaded and the player has been created, the element containing the ooyala plugin will trigger an `"ooyala.ready"` event on itself, and pass along both the instantiated player, as well as that player's global `OO` object. You can hook into this event to perform low-level interactions with the player and the object.

```javascript
$( "#your-ooyala-player-element" ).ooyala({ /* ... */ })
                                  .on( "ooyala.ready", function( evt, player, OO ) {
                                    // work with OO and player
                                  });
```

The plugin instance itself can be retrieved by calling `.data( "ooyala" )` on the element. This will return an instance of `OoyalaWrapper`, which is what we use to encapsulate all of the functionality of the plugin.

```javascript
var ooyala = $( "#your-ooyala-player-element" ).data( "ooyala" ), player, OO;

// If you feel you need to, you can access the actual ooyala player using the `_player` property
player = ooyala._player;
// Additionally, you can access the global object for the player using the `_ooNamespace` property
OO = window[ ooyala._ooNamespace ];

// Using the javascript API to play some content
ooyala.play();
```

See the plugin javascript API for more info

### Controlling auto-initialization

When jquery-ooyala initially loads, it automagically checks for all elements of class `oo-player` and instantiates the plugin on all of them. It also wires up any trigger elements it finds. If you want to disable this functionality, add a `data-auto-init="false"` attribute to the script tag that loads the player. Note that within the code we simply check for `script[data-auto-init]`, so that attribute can be attached to _any_ script tag, such as a built `vendor.js` file.

```html
<!-- vendor.js contains jquery-ooyala bundled with it -->
<script data-auto-init="false" src="/build/vendor.js"></script>
```

You may also want to manually trigger this event, such as in a single-page application where elements are dynamically generated. You can do this by triggering a `"jquery.ooyala.initialize"` on `document`, which jquery-ooyala will listen to and perform that initialization logic when it's triggered.

```javascript
$( document ).on( "dataVideosResponseReceived", function( evt, videos ) {
    var html = videosTemplateFunction( videos );
    $( "#view-container" ).append( html );
    $( document ).trigger( "jquery.ooyala.initialize" );
});
```

### Accessing the plugin constructor directly

You can access the `OoyalaWrapper` constructor function by invoking `$.data( document.body, "_jquery.ooyala" )`. Note however, that in most cases there are better ways to achieve what you are trying to do than this way. However, if you'd rather use a different pattern in your code than a traditional jquery plugin pattern, this will give you that flexibility.

## Plugin Javascript API

For those who need to get closer to the metal, the plugin provides a completely javascript API that is used under the hood to create/manipulate the player.

### OoyalaWrapper

This is the constructor that is used to instantiate the plugin on each element it's called on.

```javascript
var ooyala = $( "#some-player" ).data( "ooyala" ); // OoyalaWrapper instance
```

#### Public Properties

* **el/$el**: The element / jquery Object containing the element (respectively) that the plugin was called on.
* **settings**: An object representing the options the plugin was instantiated with, merged with its defaults.

#### Methods

* **init( opts )**: Called on instantiation to initialize the player. Takes an object `opts` containing plugin options (outlined below)
* **getPlayer()**: Makes a call for the ooyala player specified in `options.playerId`. Returns a [promise](http://api.jquery.com/Types/#Promise) that is fulfilled when the player script loads and is executed
* **loadContent( contentId )**: Switches out the current content in the player for the one specified by `contentId`

#### Ooyala Player method proxies.

`OoyalaWrapper` proxies the ooyala player's `play()`, `pause()`, `seek()`, and `skipAd()` functions. See the [ooyala docs](http://support.ooyala.com/developers/documentation/api/player_v3_apis.html) for information on how to use those methods.

## Full List of Options

| name                          | type   | default | description |
| ----------------------------- | ----   | ------- | ----------- |
| `playerId` / `data-player-id` | string | `undefined`   | The id of the player to load |
| `contentId` / `data-content-id` | string | `undefined` | The id of the content for the player to load |
| `favorHtml5` / `data-favor-html5` | boolean | `true` | When set to true, this will append `?platform=html5-priority` to the ooyala script tag |
| `lazyLoadOn` / `data-lazy-load-on` | string | `undefined` | When specified, the plugin will wait to load the player until the specified event is dispatched on the element. Note that this accepts any valid string that `$.fn.on` accepts, so you can specify strings such as `"click keyup"` |
| `playerParams` / `data-player-params` | Object | `{}` | Options object that will be passed to `OO.Player.create()` as the last argument. Note that `onCreate` will be ignored. For more info, see Ooyala's [Player Embedded Parameters Documentation](http://support.ooyala.com/developers/documentation/api/player_v3_api_embedparams.html) |
| `playerPlacement` / `data-player-placement` | string/Function | `"append"` | Specifies how the player should be placed within its containing element. Can be either `"prepend"` or `"append"`, or a custom function that can be used to position the player. See the documentation above for more info |
| `urlParams` / `data-url-params` | Object.<string, string> | `{}` | Object representing url params to be sent along with the player script tag url |

## Running Demos

1. cd into the plugin directory and run a static file server (such as Python's `SimpleHTTPServer`)
    ```sh
    $ cd /path/to/jquery-ooyala
    $ python -m SimpleHTTPServer
    ```
2. Navigate to `localhost:8000/demo/DEMO_FILE_NAME.html` where you should see the demo. Note that we load bootstrap and jquery from a CDN on these pages, so you'll need a working internet connection.

## FAQ/Troubleshotting

**I'm not seeing anything when I use the plugin on an empty element**

Ensure that you set at least a `min-height` and (if you're not using a block element) a `min-width` on the element you're placing the plugin into. Ooyala sets styles on their html5 player by to `width:100%;height:100%` so if your element has no width/height, it won't show. You can also use the `.oo-player` css hook to apply global styles to all ooyala players on your page.

**I'm trying to specify a certain namespace using `urlParams`, but I'm not seeing the Ooyala object in that namespace**

jquery-ooyala does *not* honor the url param if passed in. This is the only way we can reliably support having multiple players on one page. If you *really* need to assign a global `OO` object for a player to a specific window property, you can accomplish this by using the `"ooyala.ready"` event:
```javascript
$( "#element" ).ooyala({ /* ... */ })
               .on( "ooyala.ready", function( evt, player, OO ) {
                 window.MY_OO_NAMESPACE = OO;
               });
```

_If you're experiencing other problems or have found a bug, please let us know by [creating an issue](https://github.com/refinery29/jquery-ooyala/issues/new)_

## License

[MIT License](http://mit-license.org/) © Refinery29, Inc. 2014
