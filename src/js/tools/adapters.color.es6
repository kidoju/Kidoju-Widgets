/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import CONSTANTS from '../common/window.constants.es6';
import BaseAdapter from './adapters.base.es6';

const { attr, format } = window.kendo;
const VALIDATION_CUSTOM = 'function validate(value, solution, all) {\n\t{0}\n}'; // TODO remove

/**
 * @class ColorAdapter
 */
const ColorAdapter = BaseAdapter.extend({
    /**
     * Constructor
     * @constructor
     * @param options
     * @param attributes
     */
    init(options, attributes) {
        BaseAdapter.fn.init.call(this, options);
        this.type = CONSTANTS.STRING;
        this.defaultValue =
            this.defaultValue || (this.nullable ? null : '#000000');
        this.editor = 'input';
        this.attributes = $.extend({}, this.attributes, attributes);
        this.attributes[attr('role')] = 'colorpicker';
    },
    library: [
        {
            name: 'equal',
            formula: format(
                VALIDATION_CUSTOM,
                'return String(value).trim() === String(solution).trim();'
            )
        }
    ],
    libraryDefault: 'equal'
});

/**
 * Default export
 */
export default ColorAdapter;
