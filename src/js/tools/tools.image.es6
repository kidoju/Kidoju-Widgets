/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import assets from '../app/app.assets.es6';
import assert from '../common/window.assert.es6';
import CONSTANTS from '../common/window.constants.es6';
import PageComponent from '../data/models.pagecomponent.es6';
import AssetAdapter from './adapters.asset.es6';
import DropDownListAdapter from './adapters.dropdownlist.es6';
import StyleAdapter from './adapters.style.es6';
import TextBoxAdapter from './adapters.textbox.es6';
import tools from './tools.es6';
import BaseTool from './tools.base.es6';
import ToolAssets from './util.assets.es6';

const { format, ns, template } = window.kendo;

const RX_IMAGE = /^(cdn|data):\/\/[\s\S]+.(gif|jpe?g|png|svg)$/i;
const RX_STYLE = /^(([\w-]+)\s*:([^;<>]+);\s*)+$/i;
const RX_TEXT = /\S+/i;

/**
 * i18n
 * @returns {*|{}}
 */
function i18n() {
    return (
        (((window.app || {}).i18n || {}).tools || {}).image || {
            name: 'Image',
            description: 'Image',
            attributes: {
                alt: { title: 'Text', defaultValue: 'Image' },
                src: {
                    title: 'Source',
                    defaultValue:
                        'cdn://images/o_collection/svg/office/painting_landscape.svg'
                },
                style: { title: 'Style' }
            },
            properties: {
                behavior: { title: 'Behaviour' },
                constant: { title: 'Constant' }
            }
        }
    );
}

/**
 * Image
 * @class Image
 * @extends BaseTool
 */
const Image = BaseTool.extend({
    id: 'image',
    icon: 'painting_landscape',
    name: i18n().name,
    description: i18n().description,
    cursor: CONSTANTS.CROSSHAIR_CURSOR,
    menu: ['attributes.src', 'attributes.alt', 'attributes.style'],
    templates: {
        default:
            '<img src="#: src$() #" alt="#: attributes.alt #" class="#: class$() #" style="#: attributes.style #" data-#= ns #id="#: id$() #" data-#= ns #behavior="#: properties.behavior #" data-#= ns #constant="#: properties.constant #">'
    },
    height: 250,
    width: 250,
    attributes: {
        alt: new TextBoxAdapter({
            title: i18n().attributes.alt.title,
            defaultValue: i18n().attributes.alt.defaultValue
        }),
        src: new AssetAdapter({
            title: i18n().attributes.src.title,
            defaultValue: i18n().attributes.src.defaultValue
        }),
        style: new StyleAdapter({ title: i18n().attributes.style.title })
    },
    properties: {
        behavior: new DropDownListAdapter(
            {
                title: i18n().properties.behavior.title,
                defaultValue: 'none',
                enum: ['none', 'draggable', 'selectable']
            },
            {
                style: 'width: 100%;'
            }
        ),
        constant: new TextBoxAdapter({
            title: i18n().properties.constant.title
        })
    },

    /**
     * getAssets
     * @method getAssets
     * @param component
     * @returns {{audio: Array, image: Array, video: Array}}
     */
    getAssets(component) {
        assert.instanceof(
            PageComponent,
            component,
            assert.format(
                assert.messages.instanceof.default,
                'component',
                'kidoju.data.PageComponent'
            )
        );
        return {
            audio: [],
            image: [component.get('attributes.src')],
            video: []
        };
    },

    /**
     * getHtmlContent
     * @method getHtmlContent
     * @param component
     * @param mode
     * @returns {*}
     */
    getHtmlContent(component, mode) {
        const that = this;
        assert.instanceof(
            Image,
            that,
            assert.format(assert.messages.instanceof.default, 'this', 'Image')
        );
        assert.instanceof(
            PageComponent,
            component,
            assert.format(
                assert.messages.instanceof.default,
                'component',
                'kidoju.data.PageComponent'
            )
        );
        assert.enum(
            Object.values(CONSTANTS.STAGE_MODES),
            mode,
            assert.format(
                assert.messages.enum.default,
                'mode',
                Object.values(CONSTANTS.STAGE_MODES)
            )
        );
        assert.instanceof(
            ToolAssets,
            assets.image,
            assert.format(
                assert.messages.instanceof.default,
                'assets.image',
                'kidoju.ToolAssets'
            )
        );
        const tmpl = template(that.templates.default);
        $.extend(component, {
            // The class$ function adds the kj-interactive class to draggable components
            class$() {
                return `kj-image${
                    component.properties.behavior === 'draggable'
                        ? ` ${CONSTANTS.INTERACTIVE_CLASS}`
                        : ''
                }`;
            },
            // The id$ function returns the component id for components that have a behavior
            id$() {
                return component.properties.behavior !== 'none' &&
                    $.type(component.id) === CONSTANTS.STRING &&
                    component.id.length
                    ? component.id
                    : '';
            },
            // ns is required for data-* declarations
            ns,
            // The src$ function resolves urls with schemes like cdn://sample.jpg
            src$() {
                const src = component.attributes.get('src');
                return assets.image.scheme2http(src);
            }
        });

        return tmpl(component);
    },

    /**
     * onResize
     * @method onResize
     * @param e
     * @param component
     */
    onResize(e, component) {
        const stageElement = $(e.currentTarget);
        assert.ok(
            stageElement.is(`${CONSTANTS.DOT}${CONSTANTS.ELEMENT_CLASS}`),
            format('e.currentTarget is expected to be a stage element')
        );
        assert.instanceof(
            PageComponent,
            component,
            assert.format(
                assert.messages.instanceof.default,
                'component',
                'kidoju.data.PageComponent'
            )
        );
        const content = stageElement.children('img');
        // Assuming we can get the natural size of the image, we shall keep proportions
        // TODO Cannot get naturalHeight for SVG inages
        const { naturalHeight, naturalWidth } = content[0];
        if (naturalHeight && naturalWidth) {
            const height = component.get('height');
            const width = component.get('width');
            const rectLimitedByHeight = {
                height,
                width: (height * naturalWidth) / naturalHeight
            };
            /*
             // Note: comparing rectLimitedByHeight and rectLimitedByWidth does not work because
             // we are using the component size and not the mouse position
             // therefore, we can only reduce the size proportionnaly, not increase it
             var rectLimitedByWidth = {
             height: Math.round(width * naturalHeight / naturalWidth),
             width: Math.round(width)
             };
             // if (rectLimitedByHeight.height * rectLimitedByHeight.width <= rectLimitedByWidth.height * rectLimitedByWidth.width) {
             if (rectLimitedByHeight.width <= width) {
             */
            if (height !== rectLimitedByHeight.height) {
                // avoids a stack overflow
                component.set('height', rectLimitedByHeight.height);
            }
            if (width !== rectLimitedByHeight.width) {
                // avoids a stack overflow
                component.set('width', rectLimitedByHeight.width);
            }
            /*
             } else if(rectLimitedByWidth.height <= height) {
             if (height !== rectLimitedByWidth.height) {
             component.set('height', rectLimitedByWidth.height);
             }
             if (width !== rectLimitedByWidth.width) {
             component.set('width', rectLimitedByWidth.width);
             }
             }
             */
        }
        // Set content size
        content.outerHeight(
            component.get('height') -
                content.outerHeight(true) +
                content.outerHeight()
        );
        content.outerWidth(
            component.get('width') -
                content.outerWidth(true) +
                content.outerWidth()
        );
        // prevent any side effect
        e.preventDefault();
        // prevent event to bubble on stage
        e.stopPropagation();
    },

    /**
     * Component validation
     * @param component
     * @param pageIdx
     */
    validate(component, pageIdx) {
        const ret = BaseTool.fn.validate.call(this, component, pageIdx);
        const {
            description,
            i18n: { messages }
        } = this; // tool description
        if (
            !component.attributes ||
            !component.attributes.alt ||
            component.attributes.alt === i18n().attributes.alt.defaultValue ||
            !RX_TEXT.test(component.attributes.alt)
        ) {
            ret.push({
                type: CONSTANTS.WARNING,
                index: pageIdx,
                message: format(
                    messages.invalidAltText,
                    description,
                    pageIdx + 1
                )
            });
        }
        if (
            !component.attributes ||
            !component.attributes.src ||
            component.attributes.src === i18n().attributes.src.defaultValue ||
            !RX_IMAGE.test(component.attributes.src)
        ) {
            ret.push({
                type:
                    component.attributes.src ===
                    i18n().attributes.src.defaultValue
                        ? CONSTANTS.WARNING
                        : CONSTANTS.ERROR,
                index: pageIdx,
                message: format(
                    messages.invalidImageFile,
                    description,
                    pageIdx + 1
                )
            });
        }
        if (
            !component.attributes ||
            // Styles are only checked if there is any (optional)
            (component.attributes.style &&
                !RX_STYLE.test(component.attributes.style))
        ) {
            ret.push({
                type: CONSTANTS.ERROR,
                index: pageIdx,
                message: format(messages.invalidStyle, description, pageIdx + 1)
            });
        }
        // TODO: We should also check that there is a dropZone/Selector on the page if draggable/selectable
        return ret;
    }
});

/**
 * Registration
 */
tools.register(Image);
