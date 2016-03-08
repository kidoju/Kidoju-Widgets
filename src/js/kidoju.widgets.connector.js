/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define([
        './window.assert',
        './window.logger',
        './vendor/kendo/kendo.binder',
        './vendor/kendo/kendo.userevents',
        './vendor/kendo/kendo.draganddrop'
        // './vendor/kendo/kendo.multiselect' // required because of a test in kendo.binder.js
    ], f);
})(function () {

    'use strict';

    (function ($, undefined) {

        var kendo = window.kendo;
        var drawing = kendo.drawing;
        var geometry = kendo.geometry;
        var ObservableArray = kendo.data.ObservableArray;
        var Surface = drawing.Surface;
        var Widget = kendo.ui.Widget;
        var assert = window.assert;
        var logger = new window.Logger('kidoju.widgets.connector');
        var STRING = 'string';
        var NULL = 'null';
        var UNDEFINED = 'undefined';
        var CHANGE = 'change';
        var DOT = '.';
        var HASH = '#';
        var WIDGET = 'kendoConnector';
        var NS = DOT + WIDGET;
        var MOUSEDOWN = 'mousedown' + NS + ' ' + 'touchdown' + NS;
        var MOUSEMOVE = 'mousemove' + NS + ' ' + 'touchmove' + NS;
        var MOUSEUP = 'mouseup' + NS + ' ' + 'touchup' + NS;
        var DIV = '<div/>';
        var WIDGET_CLASS = 'kj-connector';
        var SURFACE_CLASS = WIDGET_CLASS + '-surface';
        var PATH_WIDTH = 5;
        var OBSERVABLE = 'observableArray';
        var SURFACE = 'surface';
        var RX_SELECTOR = /^#\S/;
        var ID = 'id';
        var VALUE = 'value';

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        function getRandomColor(){
            var r = (Math.round(Math.random()* 127) + 127).toString(16);
            var g = (Math.round(Math.random()* 127) + 127).toString(16);
            var b = (Math.round(Math.random()* 127) + 127).toString(16);
            return '#' + r + g + b;
        }

        /*********************************************************************************
         * Widget
         *********************************************************************************/

        /**
         * Connector
         * @class Connector Widget (kendoConnector)
         */
        var Connector = Widget.extend({

            /**
             * Initializes the widget
             * @param element
             * @param options
             */
            init: function (element, options) {
                var that = this;
                options = options || {};
                Widget.fn.init.call(that, element, options);
                logger.debug('widget initialized');
                that._layout();
                that._ensureSurface();
                that._bindConnectionArray();
                that._drawConnector();
                that._addDragAndDrop();
                that.value(that.options.value);
                that._enabled = !that.element.prop('disabled');
                kendo.notify(that);
            },

            /**
             * Widget options
             * @property options
             */
            options: {
                name: 'Connector',
                value: null,
                container: 'body', // .kj-stage>div[data-role="stage"]
                color: '#FF0000',
                height: 20,
                width: 20
            },

            /**
             * Widget events
             * @property events
             */
            events: [
                CHANGE
            ],

            /**
             * Value for MVVM binding
             * @param value
             */
            value: function (value) {
                var that = this;
                if ($.type(value) === STRING || $.type(value) === NULL) { // nullable string
                    if (that._value !== value) {
                        that._value = value;
                        if ($.type(that._value) === STRING && that._value.length) {
                            that._addConnection(HASH + that._value);
                        } else {
                            that._dropConnection();
                        }
                    }
                } else if ($.type(value) === UNDEFINED) {
                    return that._value;
                } else {
                    throw new TypeError('`value` is expected to be a string if not undefined');
                }
            },

            /**
             * Builds the widget layout
             * @private
             */
            _layout: function () {
                var that = this;
                var options = that.options;
                var height = options.height;
                var width = options.width;
                that.wrapper = that.element;
                that.element
                    .addClass(WIDGET_CLASS)
                    .height(width)
                    .width(height);
                that.surface = drawing.Surface.create(that.element);
            },

            /**
             * Ensure connection surface for all connectors
             * @private
             */
            _ensureSurface: function () {
                var that = this;
                var options = that.options;
                var container = that.element.closest(options.container);
                assert.hasLength(container, kendo.format(assert.messages.hasLength.default, options.container));
                // ensure ObservableArray
                var connections = container.data(OBSERVABLE);
                if (!(connections instanceof ObservableArray)) {
                    connections = new ObservableArray([]);
                    container.data(OBSERVABLE, connections);
                }
                // ensure surface
                var surface = container.data(SURFACE);
                if (!(surface instanceof Surface)) {
                    var surfaceElement = container.find(DOT + SURFACE_CLASS);
                    if (surfaceElement.length === 0) {
                        assert.ok(this.element.hasClass(WIDGET_CLASS), 'this._layout should be called before this._ensureSurface');
                        var firstChildWithConnector = container.children().has(DOT + WIDGET_CLASS).first();
                        if (firstChildWithConnector.length) {
                            surfaceElement = $(DIV)
                                .addClass(SURFACE_CLASS)
                                .css({ position: 'absolute', top: 0, left: 0 })
                                .height(container.height())
                                .width(container.width());
                            // TODO: what if elements have been reordered in explorer ?????????
                            // The solution is not to ensure the surface in design mode
                            surfaceElement.insertBefore(firstChildWithConnector);
                        }
                    }
                    surfaceElement.empty();
                    surface = kendo.drawing.Surface.create(surfaceElement);
                    container.data(SURFACE, surface);
                }
            },

            /**
             * Bind connection array
             * @private
             */
            _bindConnectionArray: function () {
                var that = this;
                var options = that.options;
                var container = that.element.closest(options.container);
                assert.hasLength(container, kendo.format(assert.messages.hasLength.default, options.container));
                var connections = container.data(OBSERVABLE);
                assert.instanceof(ObservableArray, connections, kendo.format(assert.messages.instanceof.default, 'connections', 'kendo.data.ObservableArray'));
                if (!$.isFunction(connections.draw)) {
                    connections.draw = $.proxy(that._drawConnections, container);
                    connections.bind(CHANGE, connections.draw);
                }
            },

            /**
             * Draw the connector circle
             * @private
             */
            _drawConnector: function () {
                assert.instanceof(Surface, this.surface, kendo.format(assert.messages.instanceof.default, 'this.surface', 'kendo.drawing.Surface'));
                var that = this; // this is the connector widget
                var options = that.options;
                var color = options.color;
                var x = parseInt(options.width, 10) / 2;
                var y = parseInt(options.height, 10) / 2;
                var radius = Math.min(x, y);
                var connector = new drawing.Group();
                var outerCircleGeometry = new geometry.Circle([x, y], 0.8* radius);
                var outerCircle = new drawing.Circle(outerCircleGeometry).stroke(color, 0.2 * radius);
                connector.append(outerCircle);
                var innerCircleGeometry = new geometry.Circle([x, y], 0.5 * radius);
                var innerCircle = new drawing.Circle(innerCircleGeometry).stroke(color, 0.1 * radius).fill(color);
                connector.append(innerCircle);
                that.surface.clear();
                that.surface.draw(connector);
            },

            /**
             * Draw connections
             * Note: do not use directly, use container.data(OBSERVABLE).draw
             * @private
             */
            _drawConnections: function () {
                var container = this;
                // The following prevents from using this method directly, in which case `this` is the connector widget
                assert.instanceof($, container, kendo.format(assert.messages.instanceof.default, 'container', 'jQuery'));
                var connections = this.data(OBSERVABLE);
                assert.instanceof(ObservableArray, connections, kendo.format(assert.messages.instanceof.default, 'this.connections', 'kendo.data.ObservableArray'));
                var surface = this.data(SURFACE);
                assert.instanceof(Surface, surface, kendo.format(assert.messages.instanceof.default, 'this.surface', 'kendo.drawing.Surface'));
                // Clear surface
                surface.clear();
                // Redraw all connections
                connections.forEach(function(connection) {
                    var origin = $(connection.origin);
                    var originWidget = origin.data(WIDGET);
                    var destination = $(connection.destination);
                    var destinationWidget = destination.data(WIDGET);
                    // Only connector widgets can be connected
                    if (originWidget instanceof Connector && destinationWidget instanceof Connector) {
                        var originOffset = origin.offset();
                        var destinationOffset = destination.offset();
                        var containerOffset = container.offset();
                        var path = new drawing.Path({
                            stroke: { color: connection.color, width: PATH_WIDTH }
                        })
                            .moveTo(originOffset.left - containerOffset.left + origin.width() / 2, originOffset.top - containerOffset.top + origin.height() / 2)
                            .lineTo(destinationOffset.left - containerOffset.left + destination.width() / 2, destinationOffset.top - containerOffset.top + destination.height() / 2);
                        surface.draw(path);
                    }
                });
            },

            /**
             * Redraw all elements
             */
            refresh: function () {
                // TODO
                // Redraw all connectors
                this._drawConnector();
                // Redraw all connections

            },

            /**
             * Add connection
             * Note: use this.value(string)
             * @param targetSelector (with a HASH)
             */
            _addConnection: function(targetSelector) {
                assert.match(RX_SELECTOR, targetSelector, kendo.format(assert.messages.match.default, 'targetSelector', RX_SELECTOR));
                var that = this;
                var options = that.options;
                var element = that.element;
                var id = HASH + element.attr(ID);
                assert.match(RX_SELECTOR, id, kendo.format(assert.messages.match.default, 'id', RX_SELECTOR));
                var container = that.element.closest(options.container);
                assert.hasLength(container, kendo.format(assert.messages.hasLength.default, options.container));
                var target = container.find(targetSelector);
                var targetWidget = target.data(WIDGET);
                if (id !== targetSelector && targetWidget instanceof Connector) {
                    var targetContainer = target.closest(targetWidget.options.container);
                    assert.hasLength(targetContainer, kendo.format(assert.messages.hasLength.default, targetWidget.options.container));
                    if (container[0] === targetContainer[0]) {
                        var connections = container.data(OBSERVABLE);
                        assert.instanceof(ObservableArray, connections, kendo.format(assert.messages.instanceof.default, 'connections', 'kendo.data.ObservableArray'));
                        var origin = id < targetSelector ? id : targetSelector;
                        var destination = id < targetSelector ? targetSelector : id;
                        var originWidget = id < targetSelector ? that : targetWidget;
                        var destinationWidget = id < targetSelector ? targetWidget : that;
                        var originConnection = connections.find(function (connection) {
                            return connection.origin === origin || connection.destination === origin;
                        });
                        var destinationConnection = connections.find(function (connection) {
                            return connection.origin === destination || connection.destination === destination;
                        });
                        if (($.type(originConnection) === UNDEFINED && $.type(destinationConnection) === UNDEFINED) ||
                            (originConnection !== destinationConnection)) {
                            if (originConnection) {
                                // connections.remove(originConnection);
                                originWidget._dropConnection();
                            }
                            if (destinationConnection) {
                                // connections.remove(destinationConnection);
                                destinationWidget._dropConnection();
                            }
                            connections.push({
                                origin: origin,
                                destination: destination,
                                color: getRandomColor()
                            });
                            originWidget._value = destination.substr(1);
                            destinationWidget._value = origin.substr(1);
                            originWidget.trigger(CHANGE, { value: originWidget._value });
                            destinationWidget.trigger(CHANGE, { value: destinationWidget._value });
                        }
                    }
                }
            },

            /**
             * Remove connection
             * Note: use this.value(null)
             */
            _dropConnection: function() {
                var that = this;
                var options = that.options;
                var element = that.element;
                var id = HASH + element.attr(ID);
                assert.match(RX_SELECTOR, id, kendo.format(assert.messages.match.default, 'id', RX_SELECTOR));
                var container = that.element.closest(options.container);
                assert.hasLength(container, kendo.format(assert.messages.hasLength.default, options.container));
                var connections = container.data(OBSERVABLE);
                assert.instanceof(ObservableArray, connections, kendo.format(assert.messages.instanceof.default, 'connections', 'kendo.data.ObservableArray'));
                var found = connections.find(function (connection) {
                    return connection.origin === id || connection.destination === id;
                });
                if (found) {
                    var targetSelector = found.origin === id ? found.destination : found.origin;
                    var target = container.find(targetSelector);
                    var targetWidget = target.data(WIDGET);
                    connections.remove(found);
                    that._value = null;
                    if (targetWidget instanceof Connector) {
                        targetWidget._value = null;
                    }
                    that.trigger(CHANGE, { value: null });
                    if (targetWidget instanceof Connector) {
                        targetWidget.trigger(CHANGE, { value: null });
                    }
                }
            },

            /**
             * Add drag and drop handlers
             * @param enabled
             * @private
             */
            _addDragAndDrop: function () {
                // TODO set cursor!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // IMPORTANT
                // We can have several containers containing connectors
                // But we only have on set of handlers shared across all containers
                // So we cannot use `this`, which is specific to this connector
                var element, path, target;
                $(document)
                    .off(NS)
                    .on(MOUSEDOWN, DOT + WIDGET_CLASS, function (e) {
                        e.preventDefault(); // prevents from selecting the div
                        element = $(e.currentTarget);
                        var elementOffset = element.offset();
                        var elementWidget = element.data(WIDGET);
                        if (elementWidget instanceof Connector && elementWidget._enabled) {
                            elementWidget._dropConnection();
                            var container = element.closest(elementWidget.options.container);
                            assert.hasLength(container, kendo.format(assert.messages.hasLength.default, elementWidget.options.container));
                            var containerOffset = container.offset();
                            var surface = container.data(SURFACE);
                            assert.instanceof(Surface, surface, kendo.format(assert.messages.instanceof.default, 'surface', 'kendo.drawing.Surface'));
                            path = new drawing.Path({
                                stroke: {
                                    color: elementWidget.options.color,
                                    width: PATH_WIDTH
                                }
                            });
                            path.moveTo(elementOffset.left - containerOffset.left + element.width() / 2, elementOffset.top - containerOffset.top + element.height() / 2);
                            path.lineTo(e.pageX - containerOffset.left, e.pageY - containerOffset.top);
                            surface.draw(path);
                        }
                    })
                    .on(MOUSEMOVE, function (e) {
                        if (element instanceof $ && path instanceof kendo.drawing.Path) {
                            var elementWidget = element.data(WIDGET);
                            assert.instanceof(Connector, elementWidget, kendo.format(assert.messages.instanceof.default, 'elementWidget', 'kendo.ui.Connector'));
                            var container = element.closest(elementWidget.options.container);
                            assert.hasLength(container, kendo.format(assert.messages.hasLength.default, elementWidget.options.container));
                            var containerOffset = container.offset();
                            path.segments[1].anchor().move(e.pageX - containerOffset.left, e.pageY - containerOffset.top);
                        }
                    })
                    .on(MOUSEUP, DOT + WIDGET_CLASS, function (e) {
                        if (element instanceof $ && path instanceof kendo.drawing.Path) {
                            var elementWidget = element.data(WIDGET);
                            assert.instanceof(Connector, elementWidget, kendo.format(assert.messages.instanceof.default, 'elementWidget', 'kendo.ui.Connector'));
                            target = $(e.currentTarget);
                            var targetWidget = target.data(WIDGET);
                            if (element.attr(ID) !== target.attr(ID) && targetWidget instanceof Connector && targetWidget._enabled) {
                                var container = element.closest(elementWidget.options.container);
                                assert.hasLength(container, kendo.format(assert.messages.hasLength.default, elementWidget.options.container));
                                var targetContainer = target.closest(targetWidget.options.container);
                                assert.hasLength(targetContainer, kendo.format(assert.messages.hasLength.default, targetWidget.options.container));
                                if (container[0] === targetContainer[0]) {
                                    var targetSelector = HASH + $(e.currentTarget).attr(ID);
                                    elementWidget._addConnection(targetSelector);
                                } else {
                                    var connections = container.data(OBSERVABLE);
                                    assert.instanceof(ObservableArray, connections, kendo.format(assert.messages.instanceof.default, 'connections', 'kendo.data.ObservableArray'));
                                    connections.draw();
                                }
                            }  else {
                                target = undefined;
                            }
                        }
                        // Note: The MOUSEUP events bubble and the following handler is always executed after this one
                    })
                    .on(MOUSEUP, function (e) {
                        if (path instanceof kendo.drawing.Path) {
                            path.close();
                        }
                        if (element instanceof $ && $.type(target) === UNDEFINED) {
                            var elementWidget = element.data(WIDGET);
                            if (elementWidget instanceof Connector) {
                                var container = element.closest(elementWidget.options.container);
                                var connections = container.data(OBSERVABLE);
                                assert.instanceof(ObservableArray, connections, kendo.format(assert.messages.instanceof.default, 'connections', 'kendo.data.ObservableArray'));
                                connections.draw();
                            }
                        }
                        path = undefined;
                        element = undefined;
                        target = undefined;
                    });
            },

            /**
             * Enable/disable user interactivity on connector
             */
            enable: function(enabled) {
                // this._enabled is checked in _addDragAndDrop
                this._enabled = enabled;
            },

            /**
             * Clears the widget
             * @method _clear
             * @private
             */
            _clear: function () {
                var that = this;
                // unbind kendo
                // kendo.unbind($(that.element));
                // unbind all other events
                $(that.element).find('*').off();
                $(that.element).off();
                // remove descendants
                $(that.element).empty();
                // remove element classes
                // $(that.element).removeClass(WIDGET_CLASS);
            },

            /**
             * Destroys the widget including all DOM modifications
             * @method destroy
             */
            destroy: function () {
                var that = this;
                Widget.fn.destroy.call(that);
                that._clear();
                kendo.destroy(that.element);
            }

        });

        kendo.ui.plugin(Connector);

    }(window.jQuery));

    return window.kendo;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });
