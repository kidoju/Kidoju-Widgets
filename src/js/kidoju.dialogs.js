/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false, require: false */

(function (f, define) {
    'use strict';
    define([
        './vendor/kendo/kendo.dialog',
        './window.assert',
        './window.logger',
        './kidoju.tools'
    ], f);
})(function () {

    'use strict';

    (function ($, undefined) {

        var kendo = window.kendo;
        var kidoju = window.kidoju;
        var assert = window.assert;
        var logger = new window.Logger('kidoju.dialogs');
        var STRING = 'string';
        var DIALOG_DIV = '<div class="{0}"></div>';
        var TABSTRIP_HEADER_CLASS = 'k-tabstrip k-header';
        var NO_PADDING_CLASS = 'no-padding';
        // var BUTTON_TEMPLATE = '<img alt="{0}" src="{1}" class="k-image">{0}';
        var DIALOG_SELECTOR = 'kj-dialog';
        var RX_URL = /^https?\:\/\//;

        // TODO Consider adding:
        // - Style editor

        /**
         * This is a controller to display shared dialogs across pages
         * @type {{}}
         */
        kidoju.dialogs = {

            /**
             * Get a reusable dialog with OK and Cancel buttons
             * @param selector (allows for several dialog tags, especially for nested dialogs)
             * @param options, dialog options especially width
             * @param onOKAction
             * @returns {jQuery}
             */
            getOKCancelDialog: function (selector, options, onOKAction) {
                if ($.type(selector) !== STRING){
                    onOKAction = options;
                    options = selector;
                    selector = '';
                }
                if (!$.isPlainObject(options)) {
                    onOKAction = options;
                    options = {};
                }
                // TODO: Consider promises as in getDialog(...).then(...)
                assert.isFunction(onOKAction, assert.format(assert.messages.isFunction.default, 'onOKAction'));
                var dialogWidget = $(DIALOG_SELECTOR + selector).data('kendoDialog');
                // Find or create dialog frame
                if (!(dialogWidget instanceof kendo.ui.Dialog)) {
                    // var culture = app.i18n.culture.dialogs;
                    // var icons = app.uris.cdn.icons;
                    // Create dialog
                    dialogWidget = $(kendo.format(DIALOG_DIV, DIALOG_SELECTOR.substr(1) + ' ' + selector.substr(1)))
                        .appendTo(document.body)
                        .kendoDialog($.extend({
                            actions: [
                                {
                                    // text: kendo.format(BUTTON_TEMPLATE, culture.buttons.ok.text, kendo.format(icons, culture.buttons.ok.icon)),
                                    text: kidoju.Tool.fn.i18n.dialogs.ok.text,
                                    primary: true,
                                    action: function (e) {
                                        assert.isPlainObject(e, assert.format(assert.messages.isPlainObject.default, 'e'));
                                        assert.instanceof(kendo.ui.Dialog, e.sender, assert.format(assert.messages.instanceof.default, 'e.sender', 'kendo.ui.Dialog'));
                                        assert.isFunction(e.sender._onOKAction, assert.format(assert.messages.isFunction.default, 'e.sender._onOKAction'));
                                        // (e && e.sender && e.sender._onOKAction || $.noop).bind(e.sender)(e);
                                        e.sender._onOKAction(e);
                                    }
                                },
                                {
                                    // text: kendo.format(BUTTON_TEMPLATE, culture.buttons.cancel.text, kendo.format(icons, culture.buttons.cancel.icon))
                                    text: kidoju.Tool.fn.i18n.dialogs.cancel.text
                                }
                            ],
                            buttonLayout: 'normal',
                            modal: true,
                            // title: culture.iconEditor.title, <-- use options.title
                            visible: false,
                            width: 860,
                            close: function () {
                                dialogWidget.element.removeClass(TABSTRIP_HEADER_CLASS);
                                dialogWidget.element.removeClass(NO_PADDING_CLASS);
                                // The content method destroys widgets and unbinds data
                                dialogWidget.content('');
                                // Remove the viewModel
                                dialogWidget.viewModel = undefined;
                                // Remove the click handler
                                dialogWidget._onOKAction = undefined;
                            }
                        }, options))
                        .data('kendoDialog');

                    // Hides the display of "Fermer" after the "X" icon in the window title bar
                    // dialogWidget.wrapper.find('.k-window-titlebar > .k-dialog-close > .k-font-icon.k-i-x').text('');
                }
                assert.instanceof(kendo.ui.Dialog, dialogWidget, assert.format(assert.messages.instanceof.default, 'dialogWidget', 'kendo.ui.Dialog'));
                return dialogWidget;
            },

            /**
             * Show the updateasset manager
             * @param assets
             * @param value, url passed to viewModel
             * @param options, dialog options
             * @param onOKAction
             */
            showAssetManager: function (assets, value, options, onOKAction) {
                assert.instanceof(kidoju.ToolAssets, assets, assert.format(assert.messages.instanceof.default, 'assets', 'kidoju.ToolAssets'));
                assert.type(STRING, value, assert.format(assert.messages.type.default, 'value', STRING));
                assert.isPlainObject(options, assert.format(assert.messages.isPlainObject.default, 'options'));
                assert.isFunction(onOKAction, assert.format(assert.messages.isFunction.default, 'onOKAction'));
                var dialogWidget = kidoju.dialogs.getOKCancelDialog(/*selector,*/ options, onOKAction);
                assert.instanceof(kendo.ui.Dialog, dialogWidget, assert.format(assert.messages.instanceof.default, 'dialogWidget', 'kendo.ui.Dialog'));
                // Create viewModel (Cancel shall not save changes to main model)
                dialogWidget.viewModel = kendo.observable({
                    url: value
                });
                // Update the widget onOKAction method
                dialogWidget._onOKAction = kidoju.dialogs.wrapWithUploader(assets, onOKAction);
                // Prepare UI
                dialogWidget.element.addClass(TABSTRIP_HEADER_CLASS);
                dialogWidget.element.addClass(NO_PADDING_CLASS);
                dialogWidget.title(options.title);
                dialogWidget.content('<div data-' + kendo.ns + 'role="assetmanager" data-' + kendo.ns + 'bind="value: url"></div>');
                // var assetManagerWidget = dialogWidget.element.find(kendo.roleSelector('assetmanager')).kendoAssetManager(assets).data('kendoAssetManager');
                dialogWidget.element.find(kendo.roleSelector('assetmanager')).kendoAssetManager(assets);
                // Bind viewModel
                kendo.bind(dialogWidget.element, dialogWidget.viewModel);
                // Log
                logger.debug({ method: 'showAssetManager', message: 'Opening asset manager' });
                // Show a centered dialog
                // assetManagerWidget.tabStrip.activateTab(0);
                dialogWidget.open();
            },

            /**
             * Wrap with file uploader
             * @param assets
             * @param onOKAction
             */
            wrapWithUploader: function (assets, onOKAction) {
                assert.instanceof(kidoju.ToolAssets, assets, assert.format(assert.messages.instanceof.default, 'assets', 'kidoju.ToolAssets'));
                assert.isFunction(onOKAction, assert.format(assert.messages.isFunction.default, 'onOKAction'));
                // Return a new event handler wrapping onOKAction
                return function (e) {
                    assert.isPlainObject(e, assert.format(assert.messages.isPlainObject.default, 'e'));
                    assert.instanceof(kendo.ui.Dialog, e.sender, assert.format(assert.messages.instanceof.default, 'e.sender', 'kendo.ui.Dialog'));
                    var url = e.sender.viewModel.get('url');
                    var hasScheme = false;
                    for (var scheme in assets.schemes) {
                        if (assets.schemes.hasOwnProperty(scheme) && url.startsWith(scheme + '://')) {
                            hasScheme = true;
                            break;
                        }
                    }
                    if (hasScheme) {
                        // Select an asset which is already in our store
                        onOKAction.bind(e.sender)(e);
                    } else if (window.app && window.app.rapi && RX_URL.match(url)) {
                        // Upload the asset to our store before selecting it
                        // Note: it be have been nicer to have some sort of dependency injection to refer to window.app.rapi
                        // In this case, we simply test that window.app.rapi is available to create a loose dependency
                        // TODO how to we restrict the content type to an asset type?
                        window.app.rapi.v1.content.importFile(url)
                            .done(function (result) {
                                debugger;
                                // e.sender.viewModel.set('url');
                                onOKAction.bind(e.sender)(e);
                            })
                            .fail(function (error) {
                                debugger;
                            });
                    } else {
                        // Oops, this is an invalid url
                        debugger;
                    }
                };
            }

        };

    }(window.jQuery));

    return window.kidoju;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });
