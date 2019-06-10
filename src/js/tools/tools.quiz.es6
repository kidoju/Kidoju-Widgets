/**
 * Copyright (c) 2013-2019 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import assets from '../app/app.assets.es6';
import __ from '../app/app.i18n.es6';
import assert from '../common/window.assert.es6';
import CONSTANTS from '../common/window.constants.es6';
import { PageComponent } from '../data/data.pagecomponent.es6';
import BooleanAdapter from './adapters.boolean.es6';
import DropDownListAdapter from './adapters.dropdownlist.es6';
import ImageListAdapter from './adapters.imagelist.es6';
import NumberAdapter from './adapters.number.es6';
import QuestionAdapter from './adapters.question.es6';
import QuizAdapter from './adapters.quiz.es6';
import ReadOnlyAdapter from './adapters.readonly.es6';
import StyleAdapter from './adapters.style.es6';
import ValidationAdapter from './adapters.validation.es6';
import tools from './tools.es6';
import BaseTool from './tools.base.es6';
import ToolAssets from './util.assets.es6';
import TOOLS from './util.constants.es6';
import { genericLibrary } from './util.libraries.es6';
import { questionValidator, scoreValidator } from './util.validators.es6';

const { format, ns, roleSelector, template } = window.kendo;
const ScoreAdapter = NumberAdapter;

/**
 * Template
 * @type {string}
 */
const TEMPLATE = `<div data-${ns}role="quiz" data-${ns}mode="#: attributes.mode #" data-${ns}source="#: data$() #" style="#: attributes.groupStyle #" data-${ns}item-style="#: attributes.itemStyle #" data-${ns}selected-style="#: attributes.selectedStyle #" {0}></div>`;

/**
 * QuizTool
 * @class QuizTool
 * @extends BaseTool
 */
const QuizTool = BaseTool.extend({
    id: 'quiz',
    cursor: CONSTANTS.CROSSHAIR_CURSOR,
    description: __('tools.quiz.description'),
    height: 120,
    help: __('tools.quiz.help'),
    icon: 'radio_button_group',
    menu: [
        'attributes.data',
        'attributes.mode',
        '', // separator
        'properties.question',
        'properties.solution'
    ],
    name: __('tools.quiz.name'),
    weight: 1,
    width: 490,
    templates: {
        design: format(TEMPLATE, `data-${ns}enable="false"`),
        play: format(
            TEMPLATE,
            `data-${ns}bind="value: #: properties.name #.value" data-${ns}shuffle="#: attributes.shuffle #"`
        ),
        review:
            format(
                TEMPLATE,
                `data-${ns}bind="value: #: properties.name #.value" data-${ns}enable="false"`
            ) + BaseTool.fn.getHtmlCheckMarks()
    },
    attributes: {
        mode: new DropDownListAdapter(
            {
                defaultValue: 'button',
                help: __('tools.quiz.attributes.mode.help'),
                source: __('tools.quiz.attributes.mode.source'),
                title: __('tools.quiz.attributes.mode.title')
            },
            { style: 'width: 100%;' }
        ),
        shuffle: new BooleanAdapter({
            title: __('tools.quiz.attributes.shuffle.title')
        }),
        groupStyle: new StyleAdapter({
            defaultValue: 'font-size:60px;',
            title: __('tools.quiz.attributes.groupStyle.title')
        }),
        itemStyle: new StyleAdapter({
            title: __('tools.quiz.attributes.itemStyle.title')
        }),
        selectedStyle: new StyleAdapter({
            title: __('tools.quiz.attributes.selectedStyle.title')
        }),
        data: new ImageListAdapter({
            defaultValue: __('tools.quiz.attributes.data.defaultValue'),
            help: __('tools.quiz.attributes.data.help'),
            title: __('tools.quiz.attributes.data.title')
        })
    },
    properties: {
        name: new ReadOnlyAdapter({
            title: __('tools.quiz.properties.name.title')
        }),
        question: new QuestionAdapter({
            help: __('tools.quiz.properties.question.help'),
            title: __('tools.quiz.properties.question.title'),
            validation: questionValidator
        }),
        solution: new QuizAdapter({
            help: __('tools.quiz.properties.solution.help'),
            title: __('tools.quiz.properties.solution.title')
            // TODO validation: solutionValidator
        }),
        validation: new ValidationAdapter({
            defaultValue: `${TOOLS.LIB_COMMENT}${genericLibrary.defaultKey}`,
            library: genericLibrary.library,
            title: __('tools.quiz.properties.validation.title')
        }),
        success: new ScoreAdapter({
            title: __('tools.quiz.properties.success.title'),
            defaultValue: 1,
            validation: scoreValidator
        }),
        failure: new ScoreAdapter({
            title: __('tools.quiz.properties.failure.title'),
            defaultValue: 0,
            validation: scoreValidator
        }),
        omit: new ScoreAdapter({
            title: __('tools.quiz.properties.omit.title'),
            defaultValue: 0,
            validation: scoreValidator
        })
    },

    /**
     * Get Html or jQuery content
     * @method getHtmlContent
     * @param component
     * @param mode
     * @returns {*}
     */
    getHtmlContent(component, mode) {
        const that = this;
        assert.instanceof(
            QuizTool,
            that,
            assert.format(
                assert.messages.instanceof.default,
                'this',
                'QuizTool'
            )
        );
        assert.instanceof(
            PageComponent,
            component,
            assert.format(
                assert.messages.instanceof.default,
                'component',
                'PageComponent'
            )
        );
        assert.enum(
            Object.values(TOOLS.STAGE_MODES),
            mode,
            assert.format(
                assert.messages.enum.default,
                'mode',
                Object.keys(TOOLS.STAGE_MODES)
            )
        );
        assert.instanceof(
            ToolAssets,
            assets.image,
            assert.format(
                assert.messages.instanceof.default,
                'assets.image',
                'ToolAssets'
            )
        );
        const tmpl = template(that.templates[mode]);
        // The data$ function resolves urls with schemes like cdn://sample.jpg
        $.extend(component, {
            data$() {
                const data = component.attributes.get('data').map(item => {
                    return {
                        text: item.text,
                        url: assets.image.scheme2http(item.url)
                    };
                });
                // Adding a space is a workaround to https://github.com/telerik/kendo-ui-core/issues/2849
                return ` ${JSON.stringify(data)}`;
            }
        });
        return tmpl(component);
    },

    /**
     * onEnable Event Handler
     * @param e
     * @param component
     */
    onEnable(e, component) {
        // TODO ????
        $.noop();
    },

    /**
     * onResize Event Handler
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
                'PageComponent'
            )
        );
        const content = stageElement.children(`div${roleSelector('quiz')}`);
        if ($.type(component.width) === CONSTANTS.NUMBER) {
            content.outerWidth(
                component.get('width') -
                    content.outerWidth(true) +
                    content.outerWidth()
            );
        }
        if ($.type(component.height) === CONSTANTS.NUMBER) {
            content.outerHeight(
                component.get('height') -
                    content.outerHeight(true) +
                    content.outerHeight()
            );
        }
        /*
         // Auto-resize algorithm is not great so let's wait until we find a better solution
         var data = component.attributes.data;
         var length = data.trim().split('\n').length || 1;
         switch (component.attributes.mode) {
         case 'button':
         content.css('font-size', Math.floor(0.57 * component.height));
         break;
         case 'dropdown':
         content.css('font-size', Math.floor(0.5 * component.height));
         break;
         case 'radio':
         var h = component.height / (length || 1);
         content.css('font-size', Math.floor(0.9 * h));
         content.find('input')
         .height(0.6 * h)
         .width(0.6 * h);
         break;
         }
         */
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
        const toolName = this.name;
        if (
            !component.attributes ||
            // Styles are only checked if there is any (optional)
            (component.attributes.groupStyle &&
                !TOOLS.RX_STYLE.test(component.attributes.groupStyle)) ||
            (component.attributes.itemStyle &&
                !TOOLS.RX_STYLE.test(component.attributes.itemStyle)) ||
            (component.attributes.selectedStyle &&
                !TOOLS.RX_STYLE.test(component.attributes.selectedStyle))
        ) {
            ret.push({
                type: CONSTANTS.ERROR,
                index: pageIdx,
                message: format(__('tools.messages.invalidStyle'), toolName, pageIdx + 1)
            });
        }
        if (
            !component.attributes ||
            !component.attributes.data ||
            !TOOLS.RX_DATA.test(component.attributes.data)
        ) {
            ret.push({
                type: CONSTANTS.ERROR,
                index: pageIdx,
                message: format(__('tools.messages.invalidData'), toolName, pageIdx + 1)
            });
        }
        // TODO: Check that solution matches one of the data
        return ret;
    }
});

/**
 * Registration
 */
tools.register(QuizTool);
