/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// TODO Use StyleDataSource

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import 'kendo.button';
import 'kendo.colorpicker';
import 'kendo.combobox';
import 'kendo.grid';
import 'kendo.slider';
import assert from '../common/window.assert.es6';
import CONSTANTS from '../common/window.constants.es6';
import Logger from '../common/window.logger.es6';
import './widgets.unitinput.es6';

const {
    destroy,
    ui: { plugin, Grid, Widget }
} = window.kendo;
const logger = new Logger('widgets.styleeditor');

const WIDGET_CLASS = 'k-grid k-widget kj-styleeditor';
const NS = '.kendoStyleEditor';
const TOOLBAR_SELECTOR = '.k-grid-toolbar';
// var ADD_SELECTOR = '.k-grid-add';
const DELETE_SELECTOR = '.k-grid-delete';
const TABLE_SELECTOR = 'table';

/** *******************************************************************************
 * Helpers
 ******************************************************************************** */

/* If a strict mode function is executed using function invocation, its 'this' value will be undefined. */
/* The following functions raise this error because this is undefined in functions that are not part of a prototype, but we use bind to call them */

/**
 * Normalize value
 * Removes spaces around colons and semi-colons and end with semi-colon
 * @param value
 */
function normalizeValue(value) {
    assert.type(
        CONSTANTS.STRING,
        value,
        assert.format(assert.messages.type.default),
        'value',
        CONSTANTS.STRING
    );
    return (
        value.replace(/[\s]*(\:|\;)[\s]*/g, '$1') +
        (value.length && value.charAt(value.length - 1) === CONSTANTS.SEMICOLON
            ? ''
            : CONSTANTS.SEMICOLON)
    );
}

function borderStyle(container, options) {
    // https://www.w3schools.com/cssref/pr_border-style.asp
    return comboBox.bind(this)(container, options, {
        dataSource: [
            'dashed',
            'dotted',
            'double',
            'groove',
            'hidden',
            'inherit',
            'initial',
            'inset',
            'none',
            'outset',
            'ridge',
            'solid'
        ]
    });
}

function comboBox(container, options, widgetOptions) {
    // We cannot set the comboBox name for validation before initializing the kendo ui widget
    // See http://www.telerik.com/forums/comboxbox-in-grid-with-validation
    // $('<input name="name" data-bind="value: ' + options.field + '" required data-required-msg="' + this.options.messages.validation.value + '">')
    const input = $(
        `<input data-bind="value: ${
            options.field
        }" required data-required-msg="${
            this.options.messages.validation.value
        }">`
    )
        .appendTo(container)
        .kendoComboBox(widgetOptions)
        .data('kendoComboBox');
    // The workaround for validation to work is to set the name after initializing the kendo ui widget
    // TODO http://www.telerik.com/forums/how-to-enforce-validation-in-grid-sample
    input.element.attr('name', 'value');
    $('<span class="k-invalid-msg" data-for="value"></span>').appendTo(
        container
    );
}

function cssSize(container, options) {
    // https://www.w3schools.com/cssref/css_units.asp
    return unitInput.bind(this)(container, options, {
        units: ['%', 'em', 'px', 'rem', 'vh', 'vw'],
        nonUnits: ['auto', 'inherit', 'initial']
    });
}

function colorPicker(container, options) {
    const that = this;
    // We cannot set the colorpicker name for validation before initializing the kendo ui widget
    // See http://www.telerik.com/forums/comboxbox-in-grid-with-validation
    // $('<input name="name" data-bind="value: ' + options.field + '" required data-required-msg="' + that.options.messages.validation.value + '">')
    const colorPicker = $(
        `<input data-bind="value: ${
            options.field
        }" required data-required-msg="${
            that.options.messages.validation.value
        }">`
    )
        .appendTo(container)
        .kendoColorPicker()
        .data('kendoColorPicker');
    // The workaround for validation to work is to set the name after initializing the kendo ui widget
    // TODO http://www.telerik.com/forums/how-to-enforce-validation-in-grid-sample
    colorPicker.element.attr('name', 'value');
    $('<span class="k-invalid-msg" data-for="value"></span>').appendTo(
        container
    );
}

function fontFamily(container, options) {
    // https://www.w3schools.com/cssref/pr_font_font-style.asp
    return comboBox.bind(this)(container, options, {
        dataSource: [
            'Arial',
            'Courier New',
            'Georgia',
            'Times New Roman',
            'Trebuchet MS',
            'Verdana'
        ]
    });
}

function fontStyle(container, options) {
    // https://www.w3schools.com/cssref/pr_font_font-style.asp
    return comboBox.bind(this)(container, options, {
        dataSource: ['inherit', 'initial', 'italic', 'normal', 'oblique']
    });
}

function fontWeight(container, options) {
    return comboBox.bind(this)(container, options, {
        dataSource: [
            '100',
            '200',
            '300',
            '400',
            '500',
            '600',
            '700',
            '800',
            '900',
            'bold',
            'bolder',
            'inherit',
            'initial',
            'lighter',
            'normal'
        ]
    });
}

function textAlign(container, options) {
    // https://www.w3schools.com/cssref/pr_text_text-align.asp
    return comboBox.bind(this)(container, options, {
        dataSource: ['center', 'inherit', 'initial', 'justify', 'left', 'right']
    });
}

function textDecoration(container, options) {
    // https://www.w3schools.com/cssref/pr_text_text-decoration.asp
    return comboBox.bind(this)(container, options, {
        dataSource: [
            'inherit',
            'initial',
            'line-through',
            'none',
            'overline',
            'underline'
        ]
    });
}

function opacitySlider(container, options) {
    // TODO
}

function unitInput(container, options, widgetOptions) {
    // We cannot set the comboBox name for validation before initializing the kendo ui widget
    // See http://www.telerik.com/forums/comboxbox-in-grid-with-validation
    // $('<input name="name" data-bind="value: ' + options.field + '" required data-required-msg="' + this.options.messages.validation.value + '">')
    const unitinput = $(
        `<input data-${kendo.ns}bind="value: ${
            options.field
        }" required data-required-msg="${
            this.options.messages.validation.value
        }" style="width:100%;">`
    )
        .appendTo(container)
        .kendoUnitInput(widgetOptions)
        .data('kendoUnitInput');
    // The workaround for validation to work is to set the name after initializing the kendo ui widget
    // TODO http://www.telerik.com/forums/how-to-enforce-validation-in-grid-sample
    unitinput.element.attr('name', 'value');
    $('<span class="k-invalid-msg" data-for="value"></span>').appendTo(
        container
    );
}

function verticalAlign(container, options) {
    // https://www.w3schools.com/cssref/pr_pos_vertical-align.asp
    // https://www.w3schools.com/cssref/css_units.asp
    return unitInput.bind(this)(container, options, {
        units: ['%', 'em', 'px', 'rem', 'vh', 'vw'],
        nonUnits: [
            'baseline',
            'bottom',
            'inherit',
            'initial',
            'middle',
            'sub',
            'super',
            'text-bottom',
            'text-top',
            'top'
        ]
    });
}

const CSS_STYLES = [
    // This is where we define all style names displayed in the combo box and their respective default values
    { name: 'background-color', value: '#ffffff', editor: colorPicker },
    { name: 'border-color', value: '#000000', editor: colorPicker },
    { name: 'border-radius', value: '5px', editor: cssSize },
    { name: 'border-style', value: 'solid', editor: borderStyle },
    { name: 'border-width', value: '1px', editor: cssSize },
    { name: 'color', value: '#000000', editor: colorPicker },
    { name: 'font-family', value: 'Times New Roman', editor: fontFamily },
    { name: 'font-size', value: '20px', editor: cssSize },
    { name: 'font-style', value: 'italic', editor: fontStyle },
    { name: 'font-weight', value: 'bold', editor: fontWeight },
    { name: 'padding', value: '10px', editor: cssSize },
    { name: 'margin', value: '10px', editor: cssSize },
    { name: 'opacity', value: '1' },
    { name: 'text-align', value: 'center', editor: textAlign },
    { name: 'text-decoration', value: 'underline', editor: textDecoration },
    { name: 'vertical-align', value: 'middle', editor: verticalAlign }
    // TODO: box-sizing, height, width, background-image, background-position, ...
];

/**
 * @class StyleEditor Widget (kendoStyleEditor)
 */
const StyleEditor = Widget.extend({
    /**
     * Init
     * @param element
     * @param options
     */
    init(element, options) {
        const that = this;
        options = options || {};
        Widget.fn.init.call(that, element, options);
        logger.debug({ method: 'init', message: 'widget initialized' });
        // if ($.isFunction($.fn.kendoGrid)) {
        that._setDataSource();
        that.value(that.options.value);
        that._layout();
        that._setEventHandlers();
        // }
        // Note: a simple textarea would do when running kendo-core without grid
    },

    /**
     * StyleEditor options
     * @property options
     */
    options: {
        name: 'StyleEditor',
        height: 400,
        value: '',
        messages: {
            columns: {
                name: 'Name',
                value: 'Value'
            },
            toolbar: {
                create: 'New Style',
                destroy: 'Delete'
            },
            validation: {
                name: 'Name is required',
                value: 'Value is required'
            }
        }
    },

    /**
     * Events
     * @property events
     */
    events: [CONSTANTS.CHANGE],

    /**
     * Gets or sets the style value
     * @param value
     * @returns {string}
     */
    value(value) {
        /*
                 // Sort function on style names
                 // Sorting is not user-friendly as positions change unexpectedly in the grid
                 function sort(a, b) {
                 if (a.name > b.name) {
                 return 1;
                 }
                 if (a.name < b.name) {
                 return -1;
                 }
                 // a must be equal to b
                 return 0;
                 }
                 */

        const that = this;
        let i;
        let data;
        if ($.type(value) === CONSTANTS.STRING) {
            const _value = that.value();
            value = normalizeValue(value);
            if (value !== _value) {
                // Break the various style names/values and fill the data source
                const styles = value.split(CONSTANTS.SEMICOLON);
                data = [];
                for (i = 0; i < styles.length; i++) {
                    const style = styles[i].split(CONSTANTS.COLON);
                    if ($.isArray(style) && style.length === 2) {
                        data.push({
                            name: style[0].trim(),
                            value: style[1].trim()
                        });
                    }
                }
                // Because of this, we have to implement additional plumbing
                // See: http://docs.telerik.com/kendo-ui/api/javascript/ui/grid#methods-editCell
                that._dataSource.data(data); // (data.sort(sort));
                // that.trigger(CONSTANTS.CHANGE);
            }
        } else if ($.type(value) === CONSTANTS.UNDEFINED) {
            // Convert the data source into an HTML style attribute
            value = '';
            data = that._dataSource.data();
            for (i = 0; i < data.length; i++) {
                let name = data[i].name;
                let val = data[i].value;
                if (
                    $.type(name) === CONSTANTS.STRING &&
                    $.type(val) === CONSTANTS.STRING
                ) {
                    name = name.trim();
                    val = val.trim();
                    if (name.length && val.length) {
                        value +=
                            name + CONSTANTS.COLON + val + CONSTANTS.SEMICOLON;
                    }
                }
            }
            return value;
        } else {
            throw new TypeError(
                'value is expected to be a string if not undefined'
            );
        }
    },

    /**
     * Builds the widget layout
     * @private
     */
    _layout() {
        const that = this;
        that.wrapper = that.element;
        that._setGrid();
        that.element.addClass(WIDGET_CLASS);
    },

    /**
     * Set the grid
     * @private
     */
    _setGrid() {
        const that = this;
        const options = that.options;
        that.grid = that.element
            .kendoGrid({
                columns: [
                    {
                        field: 'name',
                        title: options.messages.columns.name,
                        editor: that._cssNameEditor.bind(that),
                        template: '#=name#'
                    },
                    {
                        field: 'value',
                        title: options.messages.columns.value,
                        editor: that._cssValueEditor.bind(that),
                        template: '#=value#'
                    }
                ],
                dataBound: that._onDataBound.bind(that),
                dataSource: that._dataSource,
                editable: 'incell',
                edit: that._onGridEdit.bind(that),
                height: options.height,
                resizable: true,
                scrollable: true,
                selectable: 'row',
                sortable: true,
                toolbar: [
                    { name: 'create', text: options.messages.toolbar.create },
                    { name: 'destroy', text: options.messages.toolbar.destroy }
                ]
            })
            .data('kendoGrid');
    },

    /**
     * The CSS property name editor (a drop down list of names)
     * This function is taken from http://demos.kendoui.com/web/grid/editing-custom.html
     * @See also http://www.telerik.com/forums/kendo-ui-grid-s-combobox-editor-template-validation
     * @param container
     * @param options
     * @private
     */
    _cssNameEditor(container, options) {
        const that = this;
        // We cannot set the combobox name for validation before initializing the kendo ui widget
        // See http://www.telerik.com/forums/comboxbox-in-grid-with-validation
        // $('<input name="style_name" data-bind="value: ' + options.field + '" required data-required-msg="' + that.options.messages.validation.name + '">')
        const combobox = $(
            `<input data-bind="value: ${
                options.field
            }" required data-required-msg="${
                that.options.messages.validation.name
            }">`
        )
            .appendTo(container)
            .kendoComboBox({
                autoBind: true,
                change(e) {
                    // The change event handler assigns a default value depending on the style name
                    if (
                        e /* instanceof $.Event */ &&
                        e.sender instanceof kendo.ui.ComboBox
                    ) {
                        const dataItem = e.sender.dataItem();
                        // var grid = container.closest('.k-grid').data('kendoGrid');
                        const grid = that.element.data('kendoGrid');
                        const uid = container.parent().attr(kendo.attr('uid'));
                        if (
                            grid instanceof kendo.ui.Grid &&
                            $.type(uid) === 'string' &&
                            $.type(dataItem) !== CONSTANTS.UNDEFINED
                        ) {
                            const row = grid.dataSource.getByUid(uid);
                            row.set('value', dataItem.get('value'));
                        }
                    }
                },
                dataSource: { data: CSS_STYLES },
                dataTextField: 'name',
                dataValueField: 'name'
            })
            .data('kendoComboBox');
        // The workaround for validation to work is to set the name after initializing the kendo ui widget
        // TODO http://www.telerik.com/forums/how-to-enforce-validation-in-grid-sample
        combobox.element.attr('name', 'name');
        $('<span class="k-invalid-msg" data-for="name"></span>').appendTo(
            container
        );
    },

    /**
     * The CSS property value editor switches to a custom editor based on property name
     * @param container
     * @param options
     * @private
     */
    _cssValueEditor(container, options) {
        const that = this;
        // Find the corresponding property name and custom editor
        const name = container
            .closest('tr.k-state-selected')
            .children()
            .first()
            .text();
        const found = CSS_STYLES.filter(item => item.name === name);
        // Switch to the corresponding editor or fallback to a simple textbox
        if (
            $.isArray(found) &&
            found.length &&
            found[0] &&
            $.isFunction(found[0].editor)
        ) {
            return found[0].editor.bind(that)(container, options);
        }
        const textbox = $(
            `<input type="text" name="value" class="k-textbox" data-bind="value: ${
                options.field
            }" required data-required-msg="${
                that.options.messages.validation.value
            }">`
        ).appendTo(container);
        $('<span class="k-invalid-msg" data-for="value"></span>').appendTo(container);
    },

    /**
    },

    /**
     * Event handler for the grid dataBound event
     * Clicking `New Style` executes addRow which triggers a sync event on the dataSource
     * This triggers a refresh on the grid which cancels edit mode
     * We restore edit mode here below assuming that if the first dataItem has empty properties, it has just been added
     * @private
     */
    _onDataBound(e) {
        assert.isPlainObject(
            e,
            assert.format(assert.messages.isPlainObject.default, 'e')
        );
        assert.instanceof(
            Grid,
            e.sender,
            assert.format(
                assert.messages.instanceof.default,
                'e.sender',
                'kendo.ui.Grid'
            )
        );
        const dataItem = e.sender.dataSource.at(0);
        if (dataItem && dataItem.name === '' && dataItem.value === '') {
            e.sender.editCell(e.sender.element.find('td:eq(0)'));
        }
    },

    /**
     * Event handler for editing a grid row
     * @param e
     * @private
     */
    _onGridEdit(e) {
        assert.isPlainObject(
            e,
            assert.format(assert.messages.isPlainObject.default, 'e')
        );
        assert.instanceof(
            Grid,
            e.sender,
            assert.format(
                assert.messages.instanceof.default,
                'e.sender',
                'kendo.ui.Grid'
            )
        );
        assert.instanceof(
            $,
            e.container,
            assert.format(
                assert.messages.instanceof.default,
                'e.container',
                'jQuery'
            )
        );
        // Select the edited row
        const row = e.container.closest('tr');
        e.sender.select(e.container.closest('tr'));
        // if editing a css property name (and not a css property value)
        if (e.container.is('td:eq(0)')) {
            // Find the combobox and update dataSource with a list of styles that does not contain styles already defined
            const comboBox = e.container
                .find(kendo.roleSelector('combobox'))
                .data('kendoComboBox');
            if (comboBox instanceof kendo.ui.ComboBox) {
                const rows = e.sender.dataSource.data();
                const css = [];
                for (let i = 0; i < CSS_STYLES.length; i++) {
                    let found = false;
                    for (let j = 0; j < rows.length; j++) {
                        if (
                            CSS_STYLES[i].name === rows[j].name &&
                            CSS_STYLES[i].name !== comboBox.value()
                        ) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        css.push(CSS_STYLES[i]);
                    }
                }
                comboBox.setDataSource(css);
                comboBox.focus();
            }
        }
    },

    /**
     * Sets the data source
     * @private
     */
    _setDataSource() {
        const that = this;
        // This dataSource is private to the widget because data is assigned through value binding instead of source binding
        that._dataSource = new kendo.data.DataSource({
            autoSync: true,
            change(e) {
                // triggers the change event on the widget for value binding
                // that.trigger(CONSTANTS.CHANGE, { value: that.value() }); // otherwise that.value is executed twice (also by MVVM)
                that.trigger(CONSTANTS.CHANGE);
            },
            data: [],
            schema: {
                model: {
                    id: 'name',
                    fields: {
                        name: {
                            type: 'string',
                            validation: {
                                required: true
                            }
                        },
                        value: {
                            type: 'string',
                            validation: {
                                required: true
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Refresh
     */
    refresh() {
        const that = this;
        if (that.grid instanceof kendo.ui.Grid) {
            that.grid.refresh();
        }
    },

    /**
     * Add a click event handlers for the toolbar
     * @private
     */
    _setEventHandlers() {
        const that = this;
        const element = that.element;
        element
            .find(TOOLBAR_SELECTOR)
            .on(
                CONSTANTS.CLICK + NS,
                DELETE_SELECTOR,
                that._onDeleteClick.bind(that)
            );
        element
            .find(TABLE_SELECTOR)
            .on(
                CONSTANTS.KEYPRESS + NS,
                CONSTANTS.INPUT,
                that._onInputKeyPress.bind(that)
            );
    },

    /**
     * Event handler for clicking the `Delete` button
     * Note: Since the dataSource does not have transport destroy, delete is not processed
     * @param e
     * @private
     */
    _onDeleteClick(e) {
        assert.instanceof(
            $.Event,
            e,
            assert.format(
                assert.messages.instanceof.default,
                'e',
                'jQuery.Event'
            )
        );
        assert.instanceof(
            Grid,
            this.grid,
            assert.format(
                assert.messages.instanceof.default,
                'this.grid',
                'kendo.ui.Grid'
            )
        );
        e.preventDefault();
        const grid = this.grid;
        const selected = grid.select();
        if (selected instanceof $ && selected.length) {
            // although shorter, the following displays an alert to confirm deletion, which we do not want
            // grid.removeRow(selected);
            const uid = selected.attr(kendo.attr('uid'));
            const dataItem = grid.dataSource.getByUid(uid);
            grid.dataSource.remove(dataItem);
        }
    },

    /**
     * Event handler for input key press
     * to prevent some unhealthy characters to be used for style names and values
     * @private
     */
    _onInputKeyPress(e) {
        assert.instanceof(
            $.Event,
            e,
            assert.messages.instanceof.default,
            'e',
            'jQuery.Event'
        );
        const input = $(e.target);
        if (
            input.hasClass('k-input') &&
            input.parent().hasClass('k-dropdown-wrap')
        ) {
            // the drop down with a list of style names has the focus
            // allowed characters are a-z (96-123) and minus/hiphen/dash (45)
            if (!(e.which === 45 || (e.which > 96 && e.which < 123))) {
                e.preventDefault();
            }
        } else if (
            input.hasClass('k-textbox') &&
            input.parent().hasClass('k-edit-cell')
        ) {
            // the textbox for style value has the focus
            // do not allow < (60), > (62), : (58), ; (59) and " (34)
            if (
                e.which === 34 ||
                e.which === 58 ||
                e.which === 59 ||
                e.which === 60 ||
                e.which === 62
            ) {
                e.preventDefault();
            }
        }
    },

    /**
     * Destroy
     * @method destroy
     */
    destroy() {
        const that = this;
        const wrapper = that.wrapper;
        // Unbind events
        wrapper.find(TABLE_SELECTOR).off(CONSTANTS.KEYPRESS + NS);
        wrapper.find(TOOLBAR_SELECTOR).off(CONSTANTS.CLICK + NS);
        that._dataSource.unbind(CONSTANTS.CHANGE);
        kendo.unbind(wrapper);
        // Clear references
        that.grid = undefined;
        that._dataSource = undefined;
        // Destroy kendo
        Widget.fn.destroy.call(that);
        kendo.destroy(wrapper);
        // Remove widget class
        // wrapper.removeClass(WIDGET_CLASS);
    }
});

/**
 * Registration
 */
plugin(StyleEditor);
