/**
 * Copyright (c) 2013-2019 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import __ from '../app/app.i18n.es6';
import CONSTANTS from '../common/window.constants.es6';
import './widgets.basedialog.es6';

const {
    ns,
    resize,
    roleSelector,
    ui: { BaseDialog }
} = window.kendo;

/**
 * A shortcut function to display a dialog with a kendo.ui.CodeEditor
 * @param options
 * @returns {*}
 */
function openCodeEditor(options = {}) {
    const dfd = $.Deferred();

    /*
     * The bundle generated by webpack for this dynamic import
     * will not include codemirror.js which is also used by widgets.markeditor.es6
     * but will include the linting code used in the code editor in JavaScript mode
     */
    import(/* webpackChunkName: "jshint" */ '../widgets/widgets.codeeditor.es6')
        .then(() => {
            // Find or create the DOM element
            const $dialog = BaseDialog.getElement(options.cssClass);
            $dialog.css({ overflow: 'hidden', padding: 0 });

            // Create the dialog
            const dialog = $dialog
                .kendoBaseDialog({
                    title: __('dialogs.codeeditor.title'),
                    content: `<div data-${ns}role="codeeditor" data-${ns}bind="value:value,source:library" style="border:0;"/>`,
                    data: {
                        value: null,
                        library: []
                    },
                    actions: [
                        BaseDialog.fn.options.messages.actions.ok,
                        BaseDialog.fn.options.messages.actions.cancel
                    ],
                    width: 860,
                    ...options
                })
                .data('kendoBaseDialog');

            // Bind the show event to resize once opened
            dialog.one(CONSTANTS.SHOW, e => {
                resize(e.sender.element);
                const codeEditor = e.sender.element
                    .find(roleSelector('codeeditor'))
                    .data('kendoCodeEditor');
                // IMPORTANT, we need to refresh CodeMirror here otherwise the open animation messes with CodeMirror calculations
                // and gutter and line numbers are not displayed properly
                codeEditor.codeMirror.refresh();
            });

            // Bind the click event
            dialog.bind(CONSTANTS.CLICK, e => {
                dfd.resolve({
                    action: e.action,
                    // data: e.sender.viewModel.toJSON() <-- we do not need to return the library
                    data: {
                        value: e.sender.viewModel.get('value').toJSON()
                    }
                });
            });

            // Display the message dialog
            dialog.open();
        })
        .catch(dfd.reject);

    return dfd.promise();
}

/**
 * Default export
 */
export default openCodeEditor;
