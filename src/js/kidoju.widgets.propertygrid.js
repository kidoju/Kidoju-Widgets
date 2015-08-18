/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define(['./kidoju.data', './kidoju.tools', './vendor/kendo/kendo.numerictextbox', './vendor/kendo/kendo.datepicker', './vendor/kendo/kendo.mobile.switch'], f);
})(function () {

    'use strict';

    (function ($, undefined) {

        // shorten references to variables for uglification
        var kendo = window.kendo,
            ui = kendo.ui,
            Widget = ui.Widget,
            kidoju = window.kidoju = window.kidoju || {},

        // Types
            OBJECT = 'object',
            STRING = 'string',
            NUMBER = 'number',
            BOOLEAN = 'boolean',
            DATE = 'date',
            NULL = null,

        // Regex
            RX_PRIVATE = /^_/,

        // Html
            TBODY = 'tbody',
            TCELL = 'td[role="gridcell"]';

        // Misc.
        // UID = 'uid',
        // DIRTY = 'dirty',

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        function log(message) {
            if (window.app && window.app.DEBUG && window.console && $.isFunction(window.console.log)) {
                window.console.log('kidoju.widgets.explorer: ' + message);
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
                    isPlainObject: {
                    },
                    isUndefined: {
                    },
                    match: {
                    }
                }
            }
        );


        /*********************************************************************************
         * Widget
         *********************************************************************************/

        /**
         * PropertyGrid widget
         * @class PropertyGrid
         * @extend Widget
         */
        var PropertyGrid = Widget.extend({

            /**
             * Initializes the widget
             * @method init
             * @param element
             * @param options
             */
            init: function (element, options) {
                var that = this;

                // base call to widget initialization
                Widget.fn.init.call(this, element, options);
                util.log('widget initialized');

                // Add property grid frame
                that.wrapper = that.element;
                that._layout();

                // Add validator
                that._addValidator();

                // Refresh if we have an object to display
                that.refresh();


            },

            /**
             * Widget options
             * @property options
             */
            options: {
                name: 'PropertyGrid',
                value: NULL,
                rows: NULL,
                validation: NULL,
                templates: {
                    row: '<tr role="row"><td role="gridcell">#: title #</td><td role="gridcell"></td></tr>',
                    altRow: '<tr class="k-alt" role="row"><td role="gridcell">#: title #</td><td role="gridcell"></td></tr>'
                },
                messages: {
                    property: 'Property',
                    value: 'Value'
                }
            },

            /**
             * Value is the object whose properties are displayed in the property grid
             * @param object
             * @returns {*}
             */
            value: function (object) {
                var that = this;
                if (object === null) {
                    if (that.options.value !== null) {
                        that.options.value = null;
                        that.refresh();
                    }
                } else if (object !== undefined) {
                    if ($.type(object) !== OBJECT) {
                        throw new TypeError('Properties should be an object');
                    }
                    if (object !== that.options.value) {
                        that.options.value = object;
                        that.refresh();
                    }
                } else {
                    return that.options.value;
                }
            },

            /**
             * Rows setter/getter
             * @param array
             * @returns {*}
             */
            rows: function (array) {
                var that = this;
                if (array !== undefined) {
                    if (!$.isArray(array)) {
                        throw new TypeError('Rows should be an object');
                    }
                    if (array !== that.options.rows) {
                        that.options.rows = array;
                        that.refresh();
                    }
                } else {
                    return that.options.rows;
                }
            },

            /**
             * Builds the widget layout
             * @method _layout
             * @private
             */
            _layout: function () {
                var that = this, element = that.element, messages = that.options.messages;
                that.wrapper = element;
                element.addClass('k-grid k-widget');  // the kendo.ui.Grid has style="height:..."
                // add column headers (matches markup generated by kendo.ui.Grid)
                if ($.type(messages.property) === STRING && $.type(messages.value) === STRING) {
                    element.append(
                        '<div class="k-grid-header" style="padding-right: 17px;">' +
                        '<div class="k-grid-header-wrap">' +
                        '<table role="grid">' +
                        '<colgroup><col><col></colgroup>' +
                        '<thead role="rowgroup"><tr role="row">' +
                        '<th role="columnheader" class="k-header">' + messages.property + '</th>' +
                        '<th role="columnheader" class="k-header">' + messages.value + '</th>' +
                        '</tr></thead>' +
                        '</table>' +
                        '</div>' +
                        '</div>'
                    );
                }
                // Add property grid content (matches markup generated by kendo.ui.Grid)
                element.append(
                    '<div class="k-grid-content">' + // the kendo.ui.Grid has style="height:..."
                    '<table role="grid" style="height: auto;">' +
                    '<colgroup><col><col></colgroup>' +
                    '<tbody role="rowgroup">' +
                        // ------------------------------ This is where rows are added
                    '</tbody>' +
                    '</table>' +
                    '</div>'
                );
            },

            /**
             * Refresh rows
             * @method refresh
             */
            refresh: function () {

                var that = this,
                    properties = that.value(),
                    tbody = $(that.element).find(TBODY).first();

                kendo.unbind(tbody);
                kendo.destroy(tbody);
                tbody.find('*').off();
                tbody.empty();

                if ($.type(properties) !== OBJECT) {
                    return;
                }

                var rowTemplate = kendo.template(that.options.templates.row),
                    altRowTemplate = kendo.template(that.options.templates.altRow),
                    rows = that._buildRows(),
                    discarded = 0;

                for (var idx = 0; idx < rows.length; idx++) {
                    var row = rows[idx];
                    if (row) {
                        var template = ((idx - discarded) % 2 === 1) ? altRowTemplate : rowTemplate;

                        // Append the HTML table cells with the title in the left cell
                        tbody.append(template({title: row.title}));

                        // Add the editor to the right cell
                        var container = tbody.find(TCELL).last(),
                            options = $.extend({}, row, {model: properties});
                        row.editor(container, options);

                    } else {
                        discarded++;
                    }
                }

                kendo.bind(tbody, properties, kendo.ui, kendo.mobile.ui);

            },

            /**
             * Build rows
             * @returns {Array}
             * @private
             */
            _buildRows: function () {
                var that = this,
                    rows = [],
                    hasRows = $.isArray(that.options.rows); // && that.options.rows.length > 0;

                // that.options.rows gives:
                // - field (name) - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.field
                // - title        - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.title
                // - format       - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.format
                // - template     - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.template
                // - editor       - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.editor
                // - values?????  - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.values
                // - encoded????  - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.encoded
                // - attributes   - http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.attributes

                // that.options.fields gives: - http://docs.telerik.com/kendo-ui/api/javascript/data/model#methods-Model.define
                // - type
                // - editable
                // - nullable
                // - defaultValue - see that.options.value.defaults
                // - validation

                // that.options.value gives
                // - type
                // - value (for data-binding)

                function buildRows(properties, hashedOptionRows, path) {

                    var fields = properties.fields,
                        defaults = properties.defaults;

                    for (var prop in properties) {

                        // Select only public properties that are not functions (discards _events)
                        if (properties.hasOwnProperty(prop) && !RX_PRIVATE.test(prop) && !$.isFunction(properties[prop]) &&
                                // if rows are desinated in this.options.rows, only select these rows
                            (!hasRows || hashedOptionRows.hasOwnProperty(prop))) {

                            if ($.type(properties[prop]) === OBJECT) {

                                buildRows(properties[prop], hashedOptionRows[prop] || {}, path.length === 0 ? prop : path + '.' + prop);

                            } else {

                                var row = {
                                    attributes: hasRows && hashedOptionRows[prop] && hashedOptionRows[prop].attributes ? hashedOptionRows[prop].attributes : undefined,
                                    // defaultValue
                                    editable: fields && fields[prop] && (fields[prop].editable === false) ? false : true,
                                    editor: hasRows && hashedOptionRows[prop] && hashedOptionRows[prop].editor ? hashedOptionRows[prop].editor : undefined,
                                    field: path.length === 0 ? prop : path + '.' + prop,
                                    format: hasRows && hashedOptionRows[prop] && hashedOptionRows[prop].format ? hashedOptionRows[prop].format : undefined,
                                    // nullable
                                    template: hasRows && hashedOptionRows[prop] && hashedOptionRows[prop].template ? hashedOptionRows[prop].template : undefined,
                                    title: hasRows && hashedOptionRows[prop] && hashedOptionRows[prop].title ? hashedOptionRows[prop].title : util.formatTitle(prop),
                                    type: util.getType(fields && fields[prop], defaults && defaults[prop], properties[prop])
                                };

                                // Add validation rules to attributes
                                // See https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
                                if (fields && fields[prop] && fields[prop].validation) {
                                    var attributes = {
                                        required: fields[prop].validation.required ? true : undefined,
                                        min: fields[prop].validation.min,
                                        max: fields[prop].validation.max,
                                        maxlength: fields[prop].validation.maxlength, // See http://docs.telerik.com/kendo-ui/aspnet-mvc/helpers/editor/how-to/add-max-length-validation
                                        step: fields[prop].validation.step,
                                        pattern: fields[prop].validation.pattern,
                                        type: fields[prop].validation.type
                                    };
                                    row.attributes = $.extend({}, row.attributes, attributes);
                                }

                                util.optimizeEditor(row);

                                if (row.type) {
                                    if (hasRows) {
                                        // With this.options.rows, only designated properties are displayed
                                        rows[hashedOptionRows[prop]._index] = row;
                                    } else {
                                        // Without this.options.rows, all public properties are displayed
                                        rows.push(row);
                                    }
                                }
                            }
                        }
                    }
                }

                buildRows(that.value(), util.hash(that.options.rows), '');
                return rows;
            },

            /**
             * Gets/Set validation rules
             * See http://docs.telerik.com/kendo-ui/api/javascript/ui/validator
             * @param validation
             * @returns {*}
             */
            validation: function (validation) {
                var that = this;
                if (validation !== undefined) {
                    if (validation !== NULL && !$.isPlainObject(validation)) {
                        throw new TypeError('validation is not a nullable object');
                    }
                    if (validation !== that.options.validation) {
                        that.options.validation = validation;
                        that._removeValidator();
                        that._addValidator();
                    }
                } else {
                    return that.options.validation;
                }
            },

            /**
             * Add validator
             * See http://docs.telerik.com/kendo-ui/api/javascript/ui/validator
             * @private
             */
            _addValidator: function () {
                var that = this;
                if (!(that._validator instanceof kendo.ui.Validator)) {
                    that._validator = that.element.kendoValidator(that.options.validation).data("kendoValidator");
                }
            },

            /**
             * Remove validator
             * @private
             */
            _removeValidator: function () {
                var that = this;
                if (that._validator instanceof kendo.ui.Validator) {
                    that._validator.destroy();
                }
            },

            /**
             * Get the error messages if any. (call validate first)
             * @returns {*}
             */
            errors: function () {
                var that = this;
                if (that._validator instanceof kendo.ui.Validator) {
                    return that._validator.errors();
                }
            },

            /**
             * Hides the validation messages.
             * @returns {*}
             */
            hideMessages: function () {
                var that = this;
                if (that._validator instanceof kendo.ui.Validator) {
                    return that._validator.hideMessages();
                }
            },

            /**
             * Validates the input element(s) against the declared validation rules.
             * @returns {*}
             */
            validate: function () {
                var that = this;
                if (that._validator instanceof kendo.ui.Validator) {
                    return that._validator.validate();
                }
            },

            /**
             * Validates the input element against the declared validation rules.
             * @param input
             * @returns {*}
             */
            validateInput: function (input) {
                var that = this;
                if (that._validator instanceof kendo.ui.Validator) {
                    return that._validator.validateInput(input);
                }
            },

            /**
             * Clears the DOM from modifications made by the widget
             * @method _clear
             * @private
             */
            _clear: function () {
                var that = this;
                that._removeValidator();
                kendo.unbind(that.element);
                kendo.destroy(that.element);
                that.element.find('*').off();
                // clear element
                that.element
                    .off()
                    .empty()
                    .removeClass('k-widget k-grid');
            },

            /**
             * Destroys the widget
             * @method destroy
             */
            destroy: function () {
                var that = this;
                that._clear();
                Widget.fn.destroy.call(this);
            }

        });

        ui.plugin(PropertyGrid);

        /*********************************************************************************
         * Editors
         * See http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#configuration-columns.editor
         *********************************************************************************/

        var editors = kidoju.editors = {

            span: function (container, options) {
                $('<span/>')
                    .attr($.extend({}, options.attributes, util.getTextBinding(options.field)))
                    .appendTo(container);
            },

            input: function (container, options) {
                if (options && options.attributes && options.attributes[kendo.attr('role')] === undefined) {
                    if ([undefined, 'text', 'email', 'search', 'tel', 'url'].indexOf(options.attributes.type) > -1) {
                        options.attributes.class = 'k-textbox';
                    } else if (['button', 'reset'].indexOf(options.attributes.type) > -1) {
                        options.attributes.class = 'k-button';
                    }
                }
                $('<input style="width: 100%;"/>')
                    .attr('name', options.field)
                    .attr($.extend({}, options.attributes, util.getValueBinding(options.field)))
                    .appendTo(container);
            },

            textarea: function (container, options) {
                $('<textarea class="k-textbox" style="width: 100%; resize: vertical;"/>')
                    .attr('name', options.field)
                    .attr($.extend({}, options.attributes, util.getValueBinding(options.field)))
                    .appendTo(container);
            },

            _template: function (container, options) {
                var template = kendo.template(options.template);
                $(template(options))
                    .appendTo(container);
            }

        };


        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        var util = {

            /**
             * Log function
             * @param message
             */
            log: function (message) {
                if (window.app && window.app.DEBUG && window.console && $.isFunction(window.console.log)) {
                    window.console.log('kidoju.widgets.propertygrid: ' + message);
                }
            },

            /**
             * Return a hash object from an array of rows
             * @param rows
             * @returns {{}}
             */
            hash: function (rows) {
                var ret = {};
                if ($.isArray(rows)) {
                    $.each(rows, function (index, row) {
                        // check fields like attributes.src
                        var hierarchy = row.field.split('.'),
                            obj = ret;
                        for (var i = 0; i < hierarchy.length; i++) {
                            obj = obj[hierarchy[i]] = obj[hierarchy[i]] || {};
                        }
                        obj._index = index;
                        for (var prop in row) {
                            if (row.hasOwnProperty(prop)) {
                                obj[prop] = row[prop];
                            }
                        }
                    });
                }
                return ret;
            },

            /**
             * Format a fieldName into a title
             * e.g. return `My Field Title` from `myFieldTitle`
             * @param fieldName
             * @returns {*}
             */
            formatTitle: function (fieldName) {
                // See http://stackoverflow.com/questions/6142922/replace-a-regex-capture-group-with-uppercase-in-javascript
                return kendo.toHyphens(fieldName).replace(/(^\w|-\w)/g, function (v) {
                    return v.replace('-', ' ').toUpperCase();
                });
            },

            /**
             * Get the field type
             * @param field
             * @param defaultValue
             * @param value
             */
            getType: function (field, defaultValue, value) {
                var fieldTypes = ['string', 'number', 'boolean', 'date'],
                    type;
                if (field && fieldTypes.indexOf(field.type) > -1) {
                    return field.type;
                }
                if (defaultValue !== undefined && defaultValue !== null) {
                    type = $.type(defaultValue);
                    if (fieldTypes.indexOf(type) > -1) {
                        return type;
                    } else {
                        return undefined;
                    }
                }
                if (value !== undefined && value !== null) {
                    type = $.type(value);
                    if (fieldTypes.indexOf(type) > -1) {
                        return type;
                    } else {
                        return undefined;
                    }
                }
                // By default
                return STRING;
            },

            /**
             * Improve the editor set in row
             * @param row
             */
            optimizeEditor: function (row) {

                if (!row.editable) {
                    row.editor = editors.span;
                    return;
                }

                // INPUT_TYPES = 'color,date,datetime,datetime-local,email,month,number,range,search,tel,text,time,url,week',
                // We have left: button, checkbox, file, hidden, image, password, radio, reset, submit
                // SEE:http://www.w3schools.com/tags/att_input_type.asp

                // If row.editor is a function, there is nothing to optimize
                if ($.isFunction(row.editor)) {
                    return;
                }

                // If row editor is a string
                if ($.type(row.editor) === STRING) {
                    row.editor = row.editor.toLowerCase();

                    // If it designates a public well-known editor
                    if (row.editor.length && !RX_PRIVATE.test(row.editor) && $.isFunction(editors[row.editor])) {
                        row.editor = editors[row.editor];
                        return;
                    }

                    // If it designates a kendo UI widget that works with an input
                    var widgets = ['colorpicker', 'datepicker', 'datetimepicker', 'maskedtextbox', 'multiinput', 'numerictextbox', 'rating', 'slider', 'switch', 'timepicker'];
                    if ((widgets.indexOf(row.editor) > -1) &&
                        (kendo.rolesFromNamespaces(kendo.ui).hasOwnProperty(row.editor) || kendo.rolesFromNamespaces(kendo.mobile.ui).hasOwnProperty(row.editor))) {
                        row.attributes = $.extend({}, row.attributes, util.getRoleBinding(row.editor));
                        row.editor = editors.input; // editors._kendoInput;
                        return;
                    }
                }

                // At this stage, there should be no row editor
                row.editor = undefined;

                // If there is a template, use the corresponding editor
                if ($.type(row.template) === STRING && row.template.length) {
                    row.editor = editors._template;
                    return;
                }

                // Otherwise we can only rely on data type
                switch (row.type) {
                    case NUMBER:
                        row.attributes = $.extend({}, row.attributes, util.getRoleBinding('numerictextbox'));
                        row.editor = editors.input; // editors._kendoInput;
                        break;
                    case BOOLEAN:
                        row.attributes = $.extend({}, row.attributes, util.getRoleBinding('switch'));
                        row.editor = editors.input; // editors._kendoInput;
                        break;
                    case DATE:
                        row.attributes = $.extend({}, row.attributes, util.getRoleBinding('datepicker'));
                        row.editor = editors.input; // editors._kendoInput;
                        break;
                    default: // STRING
                        row.attributes = $.extend({type: 'text'}, row.attributes);
                        row.editor = editors.input;
                }
            },

            getValueBinding: function (field) {
                var binding = {};
                if ($.type(field) === STRING && field.length) {
                    binding[kendo.attr('bind')] = 'value: ' + field;
                }
                return binding;
            },

            getTextBinding: function (field) {
                var binding = {};
                if ($.type(field) === STRING && field.length) {
                    binding[kendo.attr('bind')] = 'text: ' + field;
                }
                return binding;
            },

            getRoleBinding: function (role) {
                var binding = {};
                if ($.type(role) === STRING && role.length) {
                    binding[kendo.attr('role')] = role;
                }
                return binding;
            }

        };

    }(window.jQuery));

    return window.kendo;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });
