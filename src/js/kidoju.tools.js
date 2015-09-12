﻿/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define(['./vendor/kendo/kendo.binder', './kidoju.data'], f);
})(function () {

    'use strict';

    (function ($, undefined) {

        var kendo = window.kendo,
            kidoju = window.kidoju = window.kidoju || {},
            Model = kidoju.data.Model,
            PageComponent = kidoju.data.PageComponent,

        // Types
            OBJECT = 'object',
            STRING = 'string',
            NUMBER = 'number',
            BOOLEAN = 'boolean',
            DATE = 'date',
            UNDEFINED = 'undefined',

        // Tools
            CURSOR_DEFAULT = 'default',
            CURSOR_CROSSHAIR = 'crosshair',
            REGISTER = 'register',
            ACTIVE = 'active',
            POINTER = 'pointer',

        // HTML
            ELEMENT_CLASS = '.kj-element',
            ABSOLUTE = 'absolute',
            AUTO = 'auto',
            DIALOG_DIV = '<div class="k-popup-edit-form {0}"></div>',
            DIALOG_CLASS = '.kj-dialog',

        // Event
            CLICK = 'click',

            FORMULA = 'function validate(value, solution) {\n\t{0}\n}',
            CUSTOM = {
                name: 'custom',
                formula: kendo.format(FORMULA, '// Your code should return true when value is validated against solution.')
            };

        /*********************************************************************************
         * Culture
         *********************************************************************************/
        var culture = kidoju.culture = kidoju.culture || {};
        culture.tools = {}; // TODO

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        /**
         * Log a message
         * @param message
         */
        function log(message) {
            if (window.app && window.app.DEBUG && window.console && $.isFunction(window.console.log)) {
                window.console.log('kidoju.tools: ' + message);
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
                        default: '`{0}` is expected to be a plain object'
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
         * Build a random hex string of length characters
         * @param length
         * @returns {string}
         */
        function randomString(length) {
            var s = new Array(length + 1).join('x');
            return s.replace(/x/g, function(c) {
                /* jshint -W016 */
                return (Math.random()*16|0).toString(16);
                /* jshint +W016 */
            });
        }



        /*********************************************************************************
         * Tools
         *********************************************************************************/

        /**
         * Registry of tools
         * @type {{register: Function}}
         */
        var tools = kidoju.tools = kendo.observable({
            active: null,
            register: function (Class) {
                // if(Class instanceof constructor) {
                if ($.type(Class.fn) === OBJECT) {
                    var obj = new Class();
                    if (obj instanceof Tool && $.type(obj.id) === STRING) {
                        if (obj.id === ACTIVE || obj.id === REGISTER) {
                            throw new Error('You cannot name your tool `active` or `register`');
                        } else if (!this[obj.id]) { // make sure (our system) tools are not being replaced
                            this[obj.id] = obj;
                            if (obj.id === POINTER) {
                                this.active = POINTER;
                            }
                        }
                    }
                }
            }
        });

        /**
         * @class Tool
         * @type {void|*}
         */
        var Tool = kidoju.Tool = kendo.Class.extend({
            id: null,
            icon: null,
            cursor: null,
            height: 250,
            width: 250,
            attributes: {},
            properties: {},
            /**
             * Constructor
             * @param options
             */
            init: function (options) {

                // Extend tool with init options
                $.extend(this, options);

                // Pass solution adapter library to validation adapter, especially for the code editor
                if (this.properties && this.properties.solution instanceof adapters.BaseAdapter && this.properties.validation instanceof adapters.ValidationAdapter) {
                    this.properties.validation.library = this.properties.solution.library;
                    this.properties.validation.defaultValue = this.properties.solution.libraryDefault;
                }

            },

            /**
             * Get a kidoju.data.Model for attributes
             * @method _getAttributeModel
             * @returns {kidoju.data.Model}
             * @private
             */
            _getAttributeModel: function () {
                var model = {fields: {}};
                for (var attr in this.attributes) {
                    if (this.attributes.hasOwnProperty(attr)) {
                        if (this.attributes[attr] instanceof adapters.BaseAdapter) {
                            model.fields[attr] = this.attributes[attr].getField();
                        }
                    }
                }
                return Model.define(model);
            },

            /**
             * Gets property grid row specifications for attributes
             * @method _getAttributeRows
             * @returns {kArray}
             * @private
             */
            _getAttributeRows: function () {
                var rows = [];

                // Add top, left, height, width, rotation
                // rows.push(new adapters.NumberAdapter({attributes:{'data-min': 0}}).getRow('top'));
                rows.push(new adapters.NumberAdapter().getRow('top'));
                rows.push(new adapters.NumberAdapter().getRow('left'));
                rows.push(new adapters.NumberAdapter().getRow('height'));
                rows.push(new adapters.NumberAdapter().getRow('width'));
                rows.push(new adapters.NumberAdapter().getRow('rotate'));

                // Add other attributes
                for (var attr in this.attributes) {
                    if (this.attributes.hasOwnProperty(attr)) {
                        if (this.attributes[attr] instanceof adapters.BaseAdapter) {
                            rows.push(this.attributes[attr].getRow('attributes.' + attr));
                        }
                    }
                }
                return rows;
            },

            /**
             * Get a kidoju.data.Model for properties
             * @method _getPropertyModel
             * @returns {kidoju.data.Model}
             * @private
             */
            _getPropertyModel: function () {
                var properties = this.properties,
                    model = { fields: {} };
                for (var prop in properties) {
                    if (properties.hasOwnProperty(prop)) {
                        if (properties[prop] instanceof adapters.BaseAdapter) {
                            model.fields[prop] = properties[prop].getField();
                            if (prop === 'name') {
                                // This cannot be set as a default value on the  adapter because each instance should have a different name
                                model.fields.name.defaultValue = 'val_' + randomString(4);
                            } else if (prop === 'validation') {
                                // We need the code library otherwise we won't have code to execute when validation === '// equal' or any other library value
                                model._library = properties.validation.library;
                            }
                        }
                    }
                }
                return Model.define(model);
            },

            /**
             * Gets property grid row specifications for properties
             * @returns {Array}
             * @private
             */
            _getPropertyRows: function () {
                var rows = [];

                for (var prop in this.properties) {
                    if (this.properties.hasOwnProperty(prop)) {
                        if (this.properties[prop] instanceof adapters.BaseAdapter) {
                            rows.push(this.properties[prop].getRow('properties.' + prop));
                        }
                    }
                }
                return rows;
            },

            /**
             * Get Html content
             * @param component
             */
            getHtml: function (component) {
                throw new Error('Please implement in subclassed tool.');
            }

            //addEvents(mode)
            //removeEvents(mode)

            // onMove(e.component)
            // onResize(e.component)
            // onRotate(e.component)
        });

        /*******************************************************************************************
         * Adapter classes
         * used to display values in a proprty grid
         *******************************************************************************************/
        var adapters = kidoju.adapters = {};

        /**
         * Base (abstract) adapter
         */
        adapters.BaseAdapter = kendo.Class.extend({

            /**
             * Data type: string, number, boolean or date
             */
            type: undefined,

            /**
             * Constructor
             * @param options
             */
            init: function (options) {
                options = options || {};
                // this.value = options.value;

                // See http://docs.telerik.com/kendo-ui/api/javascript/data/model#methods-Model.define
                this.defaultValue = options.defaultValue;
                this.editable = options.editable;
                this.nullable = options.nullable;
                this.parse = options.parse;
                this.from = options.from;
                this.validation = options.validation;

                // See http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns
                this.field = options.field;
                this.title = options.title;
                this.format = options.format;
                this.template = options.template;
                this.editor = options.editor;
                // TODO: HTML encode????
                this.attributes = options.attributes;
            },

            /**
             * Get a dialog window
             */
            getDialog: function() {
                var that = this,
                    dialog = $(DIALOG_CLASS).data('kendoWindow');
                // Find or create dialog frame
                if (!(dialog instanceof kendo.ui.Window)) {
                    // Create dialog
                    dialog = $(kendo.format(DIALOG_DIV, DIALOG_CLASS.substr(1)))
                        .appendTo(document.body)
                        .kendoWindow({
                            actions: ['close'],
                            modal: true,
                            resizable: false,
                            visible: false,
                            width: 800
                        })
                        .data('kendoWindow');
                }
                return dialog;
            },

            /**
             * Get a kendo.data.Model field
             * See http://docs.telerik.com/kendo-ui/api/javascript/data/model#methods-Model.define
             * @returns {{}}
             */
            getField: function () {
                var field = {};
                if ([STRING, NUMBER, BOOLEAN, DATE].indexOf(this.type) > -1) {
                    field.type = this.type;
                }
                if ($.type(this.defaultValue) === this.type ||
                    this.type === undefined) { // TODO: test that defaultValue is null or an object
                    field.defaultValue = this.defaultValue;
                }
                if ($.type(this.editable) === BOOLEAN) {
                    field.editable = this.defaultValue;
                }
                if ($.type(this.nullable) === BOOLEAN) {
                    field.nullable = this.nullable;
                }
                if ($.isFunction(this.parse)) {
                    field.parse = this.parse;
                }
                if ($.type(this.from) === STRING) {
                    field.from = this.from;
                }
                if ($.type(this.validation) === OBJECT) {
                    field.validation = this.validation;
                }
                return field;
            },

            /**
             * Get a property grid row
             * See http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns
             * @param field - This is the MVVM path to the field the data is bound to
             * @returns {{}}
             */
            getRow: function (field) {
                if ($.type(field) !== STRING || field.length === 0) {
                    throw new TypeError();
                }
                var row = {};
                row.field = field; // Mandatory
                if ($.type(this.title) === STRING) {
                    row.title = this.title;
                }
                if ($.type(this.format) === STRING) {
                    row.format = this.format;
                }
                if ($.type(this.template) === STRING) {
                    row.template = this.template;
                }
                if ($.isFunction(this.editor) ||
                    ($.type(this.editor) === STRING && (kidoju.editors === undefined || $.isFunction(kidoju.editors[this.editor])))) {
                    row.editor = this.editor;
                }
                // TODO: HTML encode????
                if ($.isPlainObject(this.attributes)) {
                    row.attributes = this.attributes;
                }
                return row;
            }

        });

        /**
         * String adapter
         */
        adapters.StringAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                adapters.BaseAdapter.fn.init.call(this, options);
                this.type = STRING;
                this.defaultValue = this.defaultValue || (this.nullable ? null : '');
                this.editor = 'input';
                this.attributes = $.extend({}, this.attributes, {type: 'text', class: 'k-textbox'});
            },
            library: [
                // TODO: provide a Soundex and doubleMetaphone function to web worker
                // See https://github.com/hgoebl/doublemetaphone
                // See https://github.com/NaturalNode/natural
                {
                    name: 'equal',
                    formula: kendo.format(FORMULA, 'return String(value).trim() === String(solution).trim();')
                },
                {
                    name: 'ignoreCaseEqual',
                    formula: kendo.format(FORMULA, 'return String(value).trim().toUpperCase() === String(solution).trim().toUpperCase();')
                },
                {
                    name: 'ignoreCaseMatch',
                    formula: kendo.format(FORMULA, 'return (new RegExp(String(solution), \'i\')).match(String(value));')
                },
                {
                    name: 'match',
                    formula: kendo.format(FORMULA, 'return (new RegExp(String(solution))).match(String(value));')
                }
            ],
            libraryDefault: 'equal'
        });

        /**
         * Number adapter
         */
        adapters.NumberAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                adapters.BaseAdapter.fn.init.call(this, options);
                this.type = NUMBER;
                this.defaultValue = this.defaultValue || (this.nullable ? null : 0);
                this.editor = 'input';
                this.attributes = $.extend({}, this.attributes);
                this.attributes[kendo.attr('role')] = 'numerictextbox';
            },
            library: [
                {
                    name: 'equal',
                    // TODO: parsing raises a culture issue with 5.3 in english and 5,3 in french
                    formula: kendo.format(FORMULA, 'return parseFloat(value) === parseFloat(solution);')
                },
                {
                    name: 'greaterThan',
                    formula: kendo.format(FORMULA, 'return parseFloat(value) > parseFloat(solution);')
                },
                {
                    name: 'greaterThanOrEqual',
                    formula: kendo.format(FORMULA, 'return parseFloat(value) >= parseFloat(solution);')
                },
                {
                    name: 'lowerThan',
                    formula: kendo.format(FORMULA, 'return parseFloat(value) < parseFloat(solution);')
                },
                {
                    name: 'lowerThanOrEqual',
                    formula: kendo.format(FORMULA, 'return parseFloat(value) <= parseFloat(solution);')
                }
            ],
            libraryDefault: 'equal'
        });

        /**
         * Boolean adapter
         */
        adapters.BooleanAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                adapters.BaseAdapter.fn.init.call(this, options);
                this.type = BOOLEAN;
                this.defaultValue = this.defaultValue || (this.nullable ? null : false);
                this.editor = 'input';
                this.attributes = $.extend({}, this.attributes);
                this.attributes[kendo.attr('role')] = 'switch';
            },
            library: [
                {
                    name: 'equal',
                    formula: kendo.format(FORMULA, 'return String(value).toLowerCase() === String(solution).toLowerCase();')
                }
            ],
            libraryDefault: 'equal'
        });

        /**
         * Date adapter
         */
        adapters.DateAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                adapters.BaseAdapter.fn.init.call(this, options);
                this.type = DATE;
                this.defaultValue = this.defaultValue || (this.nullable ? null : new Date());
                this.editor = 'input';
                this.attributes = $.extend({}, this.attributes);
                this.attributes[kendo.attr('role')] = 'datepicker';
            },
            library: [
                {
                    name: 'equal',
                    // TODO: parsing raises a culture issue with MM/DD/YYYY in english and DD/MM/YYYY in french
                    formula: kendo.format(FORMULA, 'return new Date(value) === new Date(solution);')
                }
            ],
            libraryDefault: 'equal'
        });

        /**
         * Text (multiline) adapter
         */
        adapters.TextAdapter = adapters.StringAdapter.extend({
            init: function (options) {
                adapters.StringAdapter.fn.init.call(this, options);
                this.editor = 'textarea';
                this.attributes = $.extend({}, this.attributes, { rows: 4, style: 'resize:vertical; width: 100%;' });
            }
        });

        /**
         * Enum adapter
         */
        adapters.EnumAdapter = adapters.StringAdapter.extend({
            init: function (options) {
                adapters.StringAdapter.fn.init.call(this, options);
                this.editor = 'input';
                this.attributes = $.extend({}, this.attributes, { style: 'width: 100%;' });
                this.attributes[kendo.attr('role')] = 'dropdownlist';
                this.attributes[kendo.attr('source')] = JSON.stringify(options.enum);
            }
        });

        /**
         * Style adapter
         */
        adapters.StyleAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                var that = this;
                adapters.BaseAdapter.fn.init.call(that, options);
                that.type = STRING;
                that.defaultValue = that.defaultValue || (that.nullable ? null : '');
                // This is the inline editor with a [...] button which triggers this.showDialog
                that.editor = function (container, options) {
                    var table = $('<div/>')
                        .css({ display: 'table' })
                        .appendTo(container);
                    var cell = $('<div/>')
                        .css({
                            display: 'table-cell',
                            width: '100%',
                            paddingRight: '8px'
                        })
                        .appendTo(table);
                    var input = $('<input/>')
                        .addClass('k-textbox') // or k-input
                        .css({width: '100%'})
                        .attr($.extend({}, options.attributes, {'data-bind': 'value: ' + options.field}))
                        .appendTo(cell);
                    $('<button/>')
                        .text('...')
                        .addClass('k-button')
                        .css({
                            display: 'table-cell',
                            minWidth: '40px',
                            height: input.css('height'), // to match input,
                            margin: 0
                        })
                        .appendTo(table)
                        .on(CLICK, $.proxy(that.showDialog, that, options));
                };
            },
            showDialog: function (options) {
                var that = this,
                    dialog = that.getDialog();
                // Create viewModel (Cancel shall not save changes to main model)
                dialog.viewModel = kendo.observable({
                    style: options.model.get(options.field)
                });
                // Prepare UI
                dialog.title(options.title);
                var content = '<div class="k-edit-form-container">' +
                    '<div data-role="styleeditor" data-bind="value: style"></div>' +
                    '<div class="k-edit-buttons k-state-default"><a class="k-primary k-button" data-command="ok" href="#">OK</a><a class="k-button" data-command="cancel" href="#">Cancel</a></div>' +
                    '</div>';
                dialog.content(content);
                kendo.bind(dialog.element, dialog.viewModel);
                dialog.element.addClass('kj-no-padding');
                // Bind click handler for edit buttons
                dialog.element.on(CLICK, '.k-edit-buttons>.k-button', $.proxy(that.closeDialog, that, options, dialog));
                // Show dialog
                dialog.center().open();
            },
            closeDialog: function (options, dialog, e) {
                var that = this;
                if (e instanceof $.Event && e.target instanceof window.HTMLElement) {
                    var command = $(e.target).attr(kendo.attr('command'));
                    if (command === 'ok') {
                        options.model.set(options.field, dialog.viewModel.get('style'));
                    }
                    if (command === 'ok' || command === 'cancel') {
                        dialog.close();
                        dialog.element.off(CLICK, '.k-edit-buttons>.k-button');
                        dialog.element.removeClass('kj-no-padding');
                        // The content method destroys widgets and unbinds data
                        dialog.content('');
                        dialog.viewModel = undefined;
                    }
                }
            }
        });

        /**
         * Asset Adapter
         */
        adapters.AssetAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                var that = this;
                adapters.BaseAdapter.fn.init.call(that, options);
                that.type = STRING;
                that.defaultValue = that.defaultValue || (that.nullable ? null : '');
                // This is the inline editor with a [...] button which triggers this.showDialog
                that.editor = function (container, options) {
                    var table = $('<div/>')
                        .css({ display: 'table' })
                        .appendTo(container);
                    var cell = $('<div/>')
                        .css({
                            display: 'table-cell',
                            width: '100%',
                            paddingRight: '8px'
                        })
                        .appendTo(table);
                    var input = $('<input/>')
                        .addClass('k-textbox') // or k-input
                        .css({width: '100%'})
                        .attr($.extend({}, options.attributes, {'data-bind': 'value: ' + options.field}))
                        .appendTo(cell);
                    $('<button/>')
                        .text('...')
                        .addClass('k-button')
                        .css({
                            display: 'table-cell',
                            minWidth: '40px',
                            height: input.css('height'), // to match input,
                            margin: 0
                        })
                        .appendTo(table)
                        .on(CLICK, $.proxy(that.showDialog, that, options));
                };
            },
            showDialog: function (options) {
                var that = this,
                    dialog = that.getDialog();
                // Create viewModel (Cancel shall not save changes to main model)
                dialog.viewModel = kendo.observable({
                    url: options.model.get(options.field)
                });
                // Prepare UI
                dialog.title(options.title);
                var content = '<div class="k-edit-form-container">' +
                    '<div data-role="assetmanager" data-bind="value: url"></div>' +
                    '<div class="k-edit-buttons k-state-default"><a class="k-primary k-button" data-command="ok" href="#">OK</a><a class="k-button" data-command="cancel" href="#">Cancel</a></div>' +
                    '</div>';
                dialog.content(content);
                dialog.element.find(kendo.roleSelector('assetmanager')).kendoAssetManager({
                    //change: function(e) {
                    //    dialog.viewModel.set('url', e.sender.value());
                    //},
                    transport: {
                        read: function(options) {
                            options.success({
                                total: 1,
                                data: [
                                    { "url": "https://s3-eu-west-1.amazonaws.com/kidoju.test/s/en/55c9c75dcc8974a01a397472/item204.jpg", "size": 3177 }
                                ]
                            });
                        },
                        create: function(options) {

                        },
                        destroy: function(options) {

                        }
                        // update is same as create
                    },
                    collections: [
                        {
                            name: 'G-Collection',
                            transport: {
                                read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/g_collection/svg/all/index.json'
                            }
                        },
                        {
                            name: 'O-Collection',
                            collections: [
                                {
                                    name: 'Dark Grey',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/o_collection/svg/dark_grey/index.json'
                                    }
                                },
                                {
                                    name: 'Office',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/o_collection/svg/office/index.json'
                                    }
                                },
                                {
                                    name: 'White',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/o_collection/svg/white/index.json'
                                    }
                                }
                            ]
                        },
                        {
                            name: 'V-Collection',
                            collections: [
                                {
                                    name: 'Small',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/v_collection/png/32x32/index.json'
                                    }
                                },
                                {
                                    name: 'Medium',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/v_collection/png/64x64/index.json'
                                    }
                                },
                                {
                                    name: 'Large',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/v_collection/png/128x128/index.json'
                                    }
                                },
                                {
                                    name: 'Huge',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/v_collection/png/256x256/index.json'
                                    }
                                }
                            ]
                        },
                        {
                            name: 'X-Collection',
                            collections: [
                                {
                                    name: 'Small',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/x_collection/png/32x32/index.json'
                                    }
                                },
                                {
                                    name: 'Large',
                                    transport: {
                                        read: 'http://localhost:63342/Kidoju.Widgets/test/data/images/x_collection/png/128x128/index.json'
                                    }
                                }
                            ]
                        }
                    ]
                });
                kendo.bind(dialog.element, dialog.viewModel);
                dialog.element.addClass('kj-no-padding');
                // Bind click handler for edit buttons
                dialog.element.on(CLICK, '.k-edit-buttons>.k-button', $.proxy(that.closeDialog, that, options, dialog));
                // Show dialog
                dialog.center().open();
            },
            closeDialog: function (options, dialog, e) {
                var that = this;
                if (e instanceof $.Event && e.target instanceof window.HTMLElement) {
                    var command = $(e.target).attr(kendo.attr('command'));
                    if (command === 'ok') {
                        options.model.set(options.field, dialog.viewModel.get('url'));
                    }
                    if (command === 'ok' || command === 'cancel') {
                        dialog.close();
                        dialog.element.off(CLICK, '.k-edit-buttons>.k-button');
                        dialog.element.removeClass('kj-no-padding');
                        // The content method destroys widgets and unbinds data
                        dialog.content('');
                        dialog.viewModel = undefined;
                    }
                }
            }
        });

        /**
         * Property name adapter
         */
        adapters.NameAdapter = adapters.StringAdapter.extend({});

        /**
         * Property validation adapter
         */
        adapters.ValidationAdapter = adapters.BaseAdapter.extend({
            init: function (options) {
                var that = this;
                adapters.BaseAdapter.fn.init.call(that, options);
                that.type = STRING;
                that.editor = function (container, options) {
                    var table = $('<div/>')
                        .css({display: 'table'})
                        .appendTo(container);
                    var cell = $('<div/>')
                        .css({
                            display: 'table-cell',
                            width: '100%',
                            paddingRight: '8px'
                        })
                        .appendTo(table);
                    var input = $('<div data-role="codeinput" />')
                        // Note: _library is added to the data bound PageComponent in its init method
                        .attr($.extend({}, options.attributes, {'data-bind': 'value: ' + options.field + ', source: _library'}))
                        .appendTo(cell);
                    $('<button/>')
                        .text('...')
                        .addClass('k-button')
                        .css({
                            display: 'table-cell',
                            minWidth: '40px',
                            height: $('input.k-textbox').first().css('height'), // hopefully there is one available before CodeInput widget is initialized
                            margin: 0
                        })
                        .appendTo(table)
                        .on(CLICK, $.proxy(that.showDialog, that, options));
                };
            },
            showDialog: function (options/*,evt*/) {
                var that = this,
                    dialog = that.getDialog();
                // Create viewModel (Cancel shall not save changes to main model)
                dialog.viewModel = kendo.observable({
                    code: options.model.get(options.field),
                    library: [CUSTOM].concat(that.library)
                });
                // Prepare UI
                dialog.title(options.title);
                var content = '<div class="k-edit-form-container">' +
                    '<div data-role="codeeditor" data-bind="value: code, source: library" data-default="' + that.defaultValue + '" data-solution="' + kendo.htmlEncode(JSON.stringify(options.model.get('properties.solution'))) + '"></div>' +
                    '<div class="k-edit-buttons k-state-default"><a class="k-primary k-button" data-command="ok" href="#">OK</a><a class="k-button" data-command="cancel" href="#">Cancel</a></div>' +
                    '</div>';
                dialog.content(content);
                kendo.bind(dialog.element, dialog.viewModel);
                dialog.element.addClass('kj-no-padding');
                // Bind click handler for edit buttons
                dialog.element.on(CLICK, '.k-edit-buttons>.k-button', $.proxy(that.closeDialog, that, options, dialog));
                // Bind window activate handler
                dialog.bind('activate', function () {
                    // IMPORTANT, we need to refresh codemirror here
                    // otherwise the open animation messes with CodeMirror calculations
                    // and gutter and line numbers are displayed at the wrong coordinates
                    var codeEditor = dialog.element
                        .find('.kj-codeeditor')
                        .data('kendoCodeEditor');
                    if (codeEditor instanceof kendo.ui.CodeEditor && codeEditor.codeMirror instanceof window.CodeMirror) {
                        codeEditor.codeMirror.refresh();
                    }
                    dialog.unbind('activate');
                });
                // Show dialog
                dialog.center().open();
            },
            closeDialog: function (options, dialog, e) {
                var that = this;
                if (e instanceof $.Event && e.target instanceof window.HTMLElement) {
                    var command = $(e.target).attr(kendo.attr('command'));
                    if (command === 'ok') {
                        options.model.set(options.field, dialog.viewModel.get('code'));
                    }
                    if (command === 'ok' || command === 'cancel') {
                        dialog.close();
                        dialog.element.off(CLICK, '.k-edit-buttons>.k-button');
                        dialog.element.removeClass('kj-no-padding');
                        // The content method destroys widgets and unbinds data
                        dialog.content('');
                        dialog.viewModel = undefined;
                    }
                }
            }
        });

        /**
         * Property score adapter
         */
        adapters.ScoreAdapter = adapters.NumberAdapter.extend({});

        /*******************************************************************************************
         * Tool classes
         *******************************************************************************************/

        /**
         * @class Pointer tool
         * @type {void|*}
         */
        var Pointer = kidoju.Tool.extend({
            id: POINTER,
            icon: 'mouse_pointer',
            cursor: CURSOR_DEFAULT,
            height: 0,
            width: 0,
            getHtml: undefined
        });
        tools.register(Pointer);

        /**
         * @class Label tool
         * @type {void|*}
         */
        var Label = kidoju.Tool.extend({
            id: 'label',
            icon: 'document_orientation_landscape',
            cursor: CURSOR_CROSSHAIR,
            templates: {
                default: '<div style="#: attributes.style #">#: attributes.text #</div>'
            },
            height: 100,
            width: 300,
            attributes: {
                text: new adapters.StringAdapter({defaultValue: 'Label'}),
                style: new adapters.StyleAdapter({defaultValue: 'font-family: Georgia, serif; font-size: 80px; color: #000000;'})
            },

            /**
             * Get Html content
             * @method getHtml
             * @param component
             * @returns {*}
             */
            getHtml: function (component) {
                if (component instanceof PageComponent) {
                    var template = kendo.template(this.templates.default);
                    return template(component);
                }
            }

            /**
             * onResize Event Handler
             * @method onResize
             * @param e
             * @param component
             */
            /*
            onResize: function (e, component) {
                var stageElement = $(e.currentTarget);
                if (stageElement.is(ELEMENT_CLASS) && component instanceof PageComponent) {
                    var content = stageElement.find('>div'),
                        style = content.attr('style');
                    //if (!isNaN(fontSize)) {
                    // The NaN test prevents the following loops from executing in Zombie
                    // see https://github.com/assaf/zombie/issues/929
                    if (!/font(-size)?:[^;]*[0-9]+px/.test(style)) {
                        // Since we have not defined any font-size, try adapting using div height
                        var fontSize = content.height(),
                            height, width,
                            clone = content
                                .clone()
                                .hide()
                                .css({
                                    position: ABSOLUTE,
                                    height: AUTO,
                                    width: AUTO
                                });
                        stageElement.after(clone);
                        // if no overflow, increase until overflow
                        while (clone.width() <= component.width && clone.height() <= component.height) {
                            width = clone.width();
                            height = clone.height();
                            fontSize++;
                            clone.css('font-size', fontSize);
                            if (clone.width() === width && clone.height() === height) {
                                break; //avoid an infinite loop if fontSize has no impact on dimensions
                            }
                        }
                        // if overflow, decrease until no overflow
                        while (clone.width() > component.width || clone.height() > component.height) {
                            width = clone.width();
                            height = clone.height();
                            fontSize--;
                            clone.css('font-size', fontSize);
                            if (clone.width() === width && clone.height() === height) {
                                break; //avoid an infinite loop if fontSize has no impact on dimensions
                            }
                        }
                        clone.remove();
                        content.css('font-size', fontSize);
                    }
                    // prevent any side effect
                    e.preventDefault();
                    // prevent event to bubble on stage
                    e.stopPropagation();
                }
            }
            */
        });
        tools.register(Label);

        /**
         * @class Image tool
         * @type {void|*}
         */
        var Image = kidoju.Tool.extend({
            id: 'image',
            icon: 'painting_landscape',
            cursor: CURSOR_CROSSHAIR,
            templates: {
                default: '<img src="#: attributes.src #" alt="#: attributes.alt #">'
            },
            height: 250,
            width: 250,
            attributes: {
                src: new adapters.AssetAdapter({ title: 'Image', defaultValue: 'https://d2rvsmwqptocm.cloudfront.net/images/o_collection/svg/office/painting_landscape.svg' }),
                alt: new adapters.StringAdapter({ title: 'Text', defaultValue: 'Painting Landscape' })
            },
            /**
             * Get Html content
             * @method getHtml
             * @param component
             * @returns {*}
             */
            getHtml: function (component) {
                if (component instanceof PageComponent) {
                    var template = kendo.template(this.templates.default);
                    return template(component);
                }
            },
            /**
             * onResize Event Handler
             * @method onResize
             * @param e
             * @param component
             */
            onResize: function (e, component) {
                var stageElement = $(e.currentTarget);
                if (stageElement.is(ELEMENT_CLASS) && component instanceof PageComponent) {
                    var content = stageElement.find('>img');
                    if ($.type(component.width) === NUMBER) {
                        content.width(component.width);
                    }
                    if ($.type(component.height) === NUMBER) {
                        content.height(component.height);
                    }
                    // prevent any side effect
                    e.preventDefault();
                    // prevent event to bubble on stage
                    e.stopPropagation();
                }
            }
        });
        tools.register(Image);

        /**
         * @class Textbox tool
         * @type {void|*}
         */
        var Textbox = kidoju.Tool.extend({
            id: 'textbox',
            icon: 'text_field',
            cursor: CURSOR_CROSSHAIR,
            templates: {
                default: '<input type="text" style="#: attributes.style #" data-#= ns #bind="value: #: properties.name #">'
            },
            height: 100,
            width: 300,
            attributes: {
                style: new adapters.StyleAdapter()
            },
            properties: {
                name: new adapters.NameAdapter({title: 'Name'}),
                description: new adapters.StringAdapter({ title: 'Description' }),
                solution: new adapters.StringAdapter({ title: 'Solution' }),
                validation: new adapters.ValidationAdapter({
                    title: 'Validation'
                    // The following is now achieved in kidoju.Tool.init
                    // solutionAdapter: new adapters.StringAdapter({ title: 'Solution' }),
                    // defaultValue: '// ' + adapters.StringAdapter.prototype.libraryDefault
                }),
                success: new adapters.ScoreAdapter({ title: 'Success', defaultValue: 1 }),
                failure: new adapters.ScoreAdapter({ title: 'Failure', defaultValue: 0 }),
                omit: new adapters.ScoreAdapter({ title: 'Omit', defaultValue: 0 })
            },
            /**
             * Get Html content
             * @method getHtml
             * @param component
             * @returns {*}
             */
            getHtml: function (component) {
                if (component instanceof PageComponent) {
                    var template = kendo.template(this.templates.default);
                    return template($.extend(component, {ns: kendo.ns}));
                }
            },

            /**
             * onResize Event Handler
             * @method onResize
             * @param e
             * @param component
             */
            onResize: function (e, component) {
                var stageElement = $(e.currentTarget);
                if (stageElement.is(ELEMENT_CLASS) && component instanceof PageComponent) {
                    var content = stageElement.find('>input');
                    if ($.type(component.width) === NUMBER) {
                        content.width(component.width);
                    }
                    if ($.type(component.height) === NUMBER) {
                        content.height(component.height);
                        content.css('font-size', Math.floor(0.75 * component.height));
                    }
                    // prevent any side effect
                    e.preventDefault();
                    // prevent event to bubble on stage
                    e.stopPropagation();
                }
            }
        });
        tools.register(Textbox);

        /**
         * @class Quiz tool
         * @type {void|*}
         */
        var CheckBox = kidoju.Tool.extend({
            id: 'checkbox',
            icon: 'checkbox',
            cursor: CURSOR_CROSSHAIR,
            templates: {
                // TODO See http://www.telerik.com/forums/font-size-of-styled-radio-buttons-and-checkboxes
                default: '<div><input id="#: properties.name #" type="checkbox" style="#: attributes.checkboxStyle #" data-#= ns #bind="checked: #: properties.name #"><label for="#: properties.name #" style="#: attributes.labelStyle #">#: attributes.text #</label></div>'
            },
            height: 60,
            width: 500,
            attributes: {
                checkboxStyle: new adapters.StyleAdapter(),
                labelStyle: new adapters.StyleAdapter(),
                text: new adapters.StringAdapter({ defaultValue: 'text' })
            },
            properties: {
                name: new adapters.NameAdapter({ title: 'Name' }),
                description: new adapters.StringAdapter({ title: 'Description' }),
                solution: new adapters.BooleanAdapter({ title: 'Solution' }),
                validation: new adapters.ValidationAdapter({
                    title: 'Validation'
                    // The following is now achieved in kidoju.Tool.init
                    // solutionAdapter: new adapters.BooleanAdapter({ title: 'Solution' }),
                    // defaultValue: '// ' + adapters.StringAdapter.prototype.libraryDefault
                }),
                success: new adapters.ScoreAdapter({ title: 'Success', defaultValue: 1 }),
                failure: new adapters.ScoreAdapter({ title: 'Failure', defaultValue: 0 }),
                omit: new adapters.ScoreAdapter({ title: 'Omit', defaultValue: 0 })
            },

            /**
             * Get Html content
             * @method getHtml
             * @param component
             * @returns {*}
             */
            getHtml: function (component) {
                if (component instanceof PageComponent) {
                    var template = kendo.template(this.templates.default);
                    return template($.extend(component, {ns: kendo.ns}));
                }
            },

            /**
             * onResize Event Handler
             * @method onResize
             * @param e
             * @param component
             */
            onResize: function (e, component) {
                var stageElement = $(e.currentTarget);
                if (stageElement.is(ELEMENT_CLASS) && component instanceof PageComponent) { // TODO: same id, same tool?
                    var content = stageElement.find('>div');
                    //TODO
                    // prevent any side effect
                    e.preventDefault();
                    // prevent event to bubble on stage
                    e.stopPropagation();
                }
            }

        });
        tools.register(CheckBox);

        /**
         * Quiz tool
         * @class Quiz
         * @type {void|*}
         */
        var Quiz = kidoju.Tool.extend({
            id: 'quiz',
            icon: 'radio_button_group',
            cursor: CURSOR_CROSSHAIR,
            templates: {
                default: '<div data-role="quiz" data-mode="#: attributes.mode #" data-#= ns #bind="value: #: properties.name #" data-source="#: JSON.stringify(attributes.data.trim().split(\'\\n\')) #" data-group-style="#: attributes.groupStyle #" data-item-style="#: attributes.itemStyle #" data-active-style="#: attributes.activeStyle #"></div>'
            },
            height: 300,
            width: 500,
            attributes: {
                mode: new adapters.EnumAdapter({ title: 'Mode', defaultValue: 'button', enum: ['button', 'dropdown', 'radio'] }),
                groupStyle: new adapters.StyleAdapter({ title: 'Group Style' }),
                itemStyle: new adapters.StyleAdapter({ title: 'Item Style' }),
                activeStyle: new adapters.StyleAdapter({ title: 'Active Style' }),
                data: new adapters.TextAdapter({ title: 'Data', defaultValue: 'Text 1\nText 2' })
            },
            properties: {
                name: new adapters.NameAdapter({ title: 'Name' }),
                description: new adapters.StringAdapter({ title: 'Description' }),
                solution: new adapters.StringAdapter({ title: 'Solution' }),
                validation: new adapters.ValidationAdapter({
                    title: 'Validation'
                    // The following is now achieved in kidoju.Tool.init
                    // solutionAdapter: new adapters.BooleanAdapter({ title: 'Solution' }),
                    // defaultValue: '// ' + adapters.StringAdapter.prototype.libraryDefault)
                }),
                success: new adapters.ScoreAdapter({ title: 'Success', defaultValue: 1 }),
                failure: new adapters.ScoreAdapter({ title: 'Failure', defaultValue: 0 }),
                omit: new adapters.ScoreAdapter({ title: 'Omit', defaultValue: 0 })
            },

            /**
             * Get Html content
             * @method getHtml
             * @param component
             * @returns {*}
             */
            getHtml: function (component) {
                if (component instanceof PageComponent) {
                    var template = kendo.template(this.templates.default);
                    return template($.extend(component, {ns: kendo.ns}));
                }
            },

            /**
             * onResize Event Handler
             * @method onResize
             * @param e
             * @param component
             */
            onResize: function (e, component) {
                var stageElement = $(e.currentTarget);
                if (stageElement.is(ELEMENT_CLASS) && component instanceof PageComponent) {
                    var content = stageElement.find('>div'),
                        data = component.attributes.data,
                        length = data.trim().split('\n').length || 1,
                        height = $.type(component.height) === NUMBER ? component.height : 0;
                        //width = $.type(component.width) === NUMBER ? component.width : 0;
                    //content.width(width);
                    //content.height(height);
                    switch(component.attributes.mode) {
                        case 'button':
                            content.css('font-size', Math.floor(0.57 * height));
                            break;
                        case 'dropdown':
                            content.css('font-size', Math.floor(0.5 * height));
                            break;
                        case 'radio':
                            content.css('font-size', Math.floor(0.9 * height / (length || 1)));
                            break;
                    }
                    // prevent any side effect
                    e.preventDefault();
                    // prevent event to bubble on stage
                    e.stopPropagation();
                }
            }
        });
        tools.register(Quiz);

        /**
         * Audio tool
         * @class Audio
         */
        var Audio = kidoju.Tool.extend({
            id: 'audio',
            icon: 'loudspeaker3',
            cursor: CURSOR_CROSSHAIR,
            templates: {
                // TODO Make a Kendo UI media Player - See http://blog.falafel.com/new-kendo-ui-media-player-widget-mvvm/
                default: '<audio controls>' +
                    // TODO test attributes.ogg and attributes.mpeg
                    '<source src="#= attributes.ogg #" type="audio/ogg" />' +
                    '<source src="#= attributes.mpeg #" type="audio/mpeg" />' +
                '</audio>'
            },
            height: 50,
            width: 500,
            attributes: {
                ogg: new adapters.AssetAdapter({ title: 'Ogg File' }),
                mpeg: new adapters.AssetAdapter({ title: 'Mpeg File' })
            },

            /**
             * Get Html content
             * @method getHtml
             * @param component
             * @returns {*}
             */
            getHtml: function (component) {
                if (component instanceof PageComponent) {
                    var template = kendo.template(this.templates.default);
                    return template($.extend(component, {ns: kendo.ns}));
                }
            }
        });
        tools.register(Audio);

        /**
         * We could also consider
         * ButtonGroup
         * HTML
         * Drawing surface
         * Shape
         * Select
         * Checkbox
         * Drop Target
         * Connector
         * Clock
         * Video
         * Text-to-Speech
         * MathJax
         * Grid
         */

        /*****************************************************************************
         * TODO: Behaviours
         ******************************************************************************/

    }(window.jQuery));

    return window.kidoju;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });
