/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import BaseDataSource from './datasources.base.es6';
import Page from './models.page.es6';

/**
 * PageCollectionDataSource
 */
const PageCollectionDataSource = BaseDataSource.extend({
    init(options) {
        BaseDataSource.fn.init.call(
            this,
            $.extend(true, options, {
                schema: {
                    model: Page
                }
            })
        );
    }
});

/**
 * Default export
 */
export default PageCollectionDataSource;

/**
 * Maintain compatibility with legacy code
 */
window.kidoju = window.kidoju || {};
window.kidoju.data = window.kidoju.data || {};
window.kidoju.data.PageCollectionDataSource = PageCollectionDataSource;
