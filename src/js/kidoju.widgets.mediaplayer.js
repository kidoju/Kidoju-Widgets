/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define(['./vendor/kendo/kendo.core'], f);
})(function () {

    'use strict';

    (function($, undefined) {

        var kendo = window.kendo,
            ui = kendo.ui,
            Widget = ui.Widget,
            ARRAY = 'array',
            STRING = 'string',
            NUMBER = 'number',
            UNDEFINED = 'undefined',
            WIDGET_CLASS = 'k-mediaplayer',
            CONTROLS_CLASS = 'k-mediaplayer-control',
            ACTIVE = 'k-state-active',
            DISABLE = 'k-state-disabled',
            SELECT = 'select',
            MODES = {
                AUDIO: 'audio',
                VIDEO: 'video'
            },
            COMMAND = 'command',
            COMMANDS = {
                PLAY: 'play',
                MUTE: 'mute',
                FULL: 'full' //full screen
            };

        /**
         * Docs about media playing
         * @see http://camendesign.com/code/video_for_everybody
         * @see http://blog.falafel.com/new-kendo-ui-media-player-widget-mvvm/
         * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video
         */

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        function log(message) {
            if (window.app && window.app.DEBUG && window.console && $.isFunction(window.console.log)) {
                window.console.log('kidoju.widgets.mediaplayer: ' + message);
            }
        }

        /**
         * Asserts
         * Note: Use asserts where unmet conditions are independent from user entries, and
         * developers should be warned that there is probably something unexpected in their code
         */
        var assert = $.extend(
            // By extending assert, we ensure we can call both assert() and assert.ok() for the same result (like in nodeJS)
            function(test, message) {
                if (!test) { throw new Error(message); }
            },
            {
                enum: function(array, value, message) { if (array.indexOf(value) === -1) { throw new Error(message); } },
                equal: function(expected, actual, message) { if (expected !== actual) { throw new Error(message); } },
                instanceof: function(Class, value, message) { if (!(value instanceof Class)) { throw new Error(message); } },
                isOptionalObject: function(value, message) { if ($.type(value) !== 'undefined' && (!$.isPlainObject(value) || $.isEmptyObject(value))) { throw new Error(message); } },
                isPlainObject: function(value, message) { if (!$.isPlainObject(value) || $.isEmptyObject(value)) { throw new Error(message); } },
                isUndefined: function(value, message) { if ($.type(value) !== 'undefined') { throw new Error(message); } },
                match: function(rx, value, message) { if ($.type(value) !== STRING || !rx.test(value)) { throw new Error(message); } },
                ok: function(test, message) { return assert(test, message); },
                type: function(type, value, message) { if ($.type(value) !== type) { throw new TypeError(message); } }
            },
            {
                messages: {
                    instanceof: {
                        default: '`{0}` is expected to be an instance of `{1}`'
                    },
                    isPlainObject: {
                        default: '`{0}` is expected to be a non-empty plain object'
                    },
                    isUndefined: {
                        default: '`{0}` is expected to be undefined'
                    },
                    type: {
                        default: '`{0}` is expected to be a(n) `{1}`'
                    }
                }
            }
        );

        /**
         * Convert file extension to mime type
         * @see http://hul.harvard.edu/ois/systems/wax/wax-public-help/mimetypes.htm
         * @param url
         * @returns {*}
         */
        function typeFormatter(url) {
            assert.type(STRING, url, kendo.format(assert.messages.type.default, 'url', STRING));
            var ext = url.split('.').pop();
            switch(ext) {
                case 'mp3':
                    // @see http://tools.ietf.org/html/rfc3003
                    // @see https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats#MP3
                    return 'audio/mpeg';
                case 'mp4':
                    // @see http://www.rfc-editor.org/rfc/rfc4337.txt
                    return 'video/mp4';
                case 'ogg':
                    return 'audio/ogg';
                case 'ogv':
                    return 'video/ogg';
                case 'wav':
                    return 'audio/wav';
                case 'webm':
                    return 'video/webm';
                default:
                    return 'application/octet-stream';
            }
        }

        /*********************************************************************************
         * Widget
         *********************************************************************************/

        /**
         * MediaPlayer widget
         */
        var MediaPLayer = Widget.extend({

            /**
             * Constructor
             * @param element
             * @param options
             */
            init: function(element, options) {
                var that = this;
                Widget.fn.init.call(that, element, options);
                that._layout();

                /*
                that._enable = true;
                if(!that.options.enable) {
                    that._enable = false;
                    that.wrapper.addClass(DISABLE);
                }
                */
            },

            options: {
                name: 'MediaPLayer',
                mode: MODES.VIDEO,
                // TODO Consider options like loop. mute, ...
                files: [],
                enable: true,
                messages: {
                    play: 'Play/Pause',
                    mute: 'Mute/Unmute',
                    full: 'Full Screen'
                }
            },

            events: [
                SELECT
            ],

            modes: {
                audio: MODES.AUDIO,
                video: MODES.VIDEO
                // TODO youtube, vimeo, dailymotion and others modes.
            },

            _layout: function() {
                var that = this;
                that.wrapper = that.element;
                that.element.addClass(WIDGET_CLASS);
                that._native();
                that._controls();
            },

            /**
             * Add native audio or video tag
             * @private
             */
            _native: function() {
                var that = this;
                if (that.options.mode === MODES.AUDIO) {
                    that.media = $('<audio></audio>');
                } else {
                    that.media = $('<video></video>');
                }
                var files = $.type(that.options.files) === STRING ? [that.options.files] : that.options.files;
                assert.type(ARRAY, files, kendo.format(assert.messages.type.default, 'options.files', ARRAY));
                $.each(files, function(index, url) {
                    $('<source>')
                        .attr({ src: url, type: typeFormatter(url) })
                        .appendTo(that.media);
                });
                that.element.append(that.media);
            },

            /**
             * Add controls (play/pause, sound, full screen)
             * @private
             */
            _controls: function() {
                var that = this;
                that.controls = $('<div/>')
                    .addClass('k-pager-wrap')
                    .on('click', 'a.k-link', $.proxy(that._buttonClick, that))
                    .appendTo(that.element);
                // Play button
                $('<a/>')
                    .attr({ href: '#', title: that.options.messages.play })
                    .addClass('k-link k-pager-nav')
                    .attr(kendo.attr(COMMAND), COMMANDS.PLAY)
                    .append('<span class="k-icon k-i-arrow-e">' + that.options.messages.play + '</span>')
                    .appendTo(that.controls);
                // seeker slider
                $('<input>')
                    .appendTo(that.controls)
                    .kendoSlider({
                        max: 10,
                        min: 0,
                        smallStep: 1,
                        showButtons: false,
                        tickPlacement: 'none'
                        // todo value??
                    });
                // TODO: display time
                // mute button
                $('<a/>')
                    .attr({ href: '#', title: that.options.messages.mute })
                    .addClass('k-link k-pager-nav')
                    .attr(kendo.attr(COMMAND), COMMANDS.MUTE)
                    .append('<span class="k-icon k-i-arrow-e">' + that.options.messages.mute + '</span>')
                    .appendTo(that.controls);
                // volume
                $('<input>')
                    .appendTo(that.controls)
                    .kendoSlider({
                        max: 10,
                        min: 0,
                        smallStep: 1,
                        showButtons: false,
                        tickPlacement: 'none'
                        // todo value??
                    });
                // Full screen button (video only)
                if (that.options.mode === MODES.VIDEO) {
                    $('<a/>')
                        .attr({ href: '#', title: that.options.messages.mute })
                        .addClass('k-link k-pager-nav')
                        .attr(kendo.attr(COMMAND), COMMANDS.FULL)
                        .append('<span class="k-icon k-i-arrow-e">' + that.options.messages.full + '</span>')
                        .appendTo(that.controls);
                }
            },

            /**
             * Toggle play pause
             */
            togglePlayPause: function() {
                var mediaElement = this.media.get(0);
                assert.instanceof(window.HTMLMediaElement, mediaElement, kendo.format(assert.messages.instanceof.default, 'this.media.get(0)', 'window.HTMLMediaElement'));
                if (mediaElement.paused && mediaElement.readyState === 4) {
                    mediaElement.play();
                    // todo chamge icon/tooltip
                } else {
                    mediaElement.pause();
                }
            },

            /**
             * Toggle muted sound
             */
            toggleMute: function() {
                var mediaElement = this.media.get(0);
                assert.instanceof(window.HTMLMediaElement, mediaElement, kendo.format(assert.messages.instanceof.default, 'this.media.get(0)', 'window.HTMLMediaElement'));
                mediaElement.muted = !mediaElement.muted;
                // todo change icon/tooltip
            },

            /**
             * Toggle full screen mode
             * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
             */
            toggleFullScreen: function() {
                var mediaElement = this.media.get(0);
                assert.instanceof(window.HTMLVideoElement, mediaElement, kendo.format(assert.messages.instanceof.default, 'this.media.get(0)', 'window.HTMLVideoElement'));
                if (mediaElement.requestFullscreen) {
                    mediaElement.requestFullscreen();
                } else if (mediaElement.msRequestFullscreen) {
                    mediaElement.msRequestFullscreen();
                } else if (mediaElement.mozRequestFullScreen) {
                    mediaElement.mozRequestFullScreen();
                } else if (mediaElement.webkitRequestFullscreen) {
                    mediaElement.webkitRequestFullscreen();
                }
            },

            volume: function(value) {
                var mediaElement = this.media.get(0);
                assert.instanceof(window.HTMLMediaElement, mediaElement, kendo.format(assert.messages.instanceof.default, 'this.media.get(0)', 'window.HTMLMediaElement'));
                if ($.type(value) === UNDEFINED) {
                    return mediaElement.volume;
                } else {
                    assert.type(NUMBER, value, kendo.format(assert.messages.type.default, 'value', NUMBER));
                    if (value < 0) {
                        value = 0;
                    } else if (value > 1) {
                        value = 1;
                    }
                    mediaElement.volume = value;
                }
            },

            _onVolumeSlide: function(e) {
                $.noop();
            },

            /**
             * Event handler triggered when clicking a media player controls button
             * @param e
             * @private
             */
            _buttonClick: function(e) {
                var command = $(e.currentTarget).attr(kendo.attr(COMMAND));
                switch(command) {
                    case COMMAND.PLAY:
                        this.togglePlayPause();
                        break;
                    case COMMAND.MUTE:
                        this.toggleMute();
                        break;
                    case COMMAND.FULL:
                        this.toggleFullScreen();
                        break;
                }
            },

            enable: function(enable) {
                var wrapper = this.wrapper;

                if(typeof enable === "undefined") {
                    enable = true;
                }

                if(enable) {
                    wrapper.removeClass(DISABLE);
                } else {
                    wrapper.addClass(DISABLE);
                }

                this._enable = this.options.enable = enable;
            }

        });

        ui.plugin(MediaPLayer);

    })(window.jQuery);

    return window.kendo;

}, typeof define === 'function' && define.amd ? define : function(_, f){ 'use strict'; f(); });
