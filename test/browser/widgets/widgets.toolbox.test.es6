/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'jquery.simulate';
import 'kendo.binder';
import chai from 'chai';
import chaiJquery from 'chai-jquery';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import '../../../src/js/widgets/widgets.toolbox.es6';

const { afterEach, before, beforeEach, describe, it } = window;
const { expect } = chai;
const {
    attr,
    bind,
    data: { DataSource },
    destroy,
    init,
    observable,
    ui: { ToolBox }
} = window.kendo;
const FIXTURES = '#fixtures';
const ELEMENT = '<input>';
const ROLE = 'toolbox';

chai.use((c, u) => chaiJquery(c, u, $));
chai.use(sinonChai);

var kidoju = window.kidoju;
var CLICK = 'click';
var ICON_PATH = '../../src/styles/images/';
var TOOLBOX2 = '<div id="toolbox2" data-role="toolbox" data-size="48" data-icon-path="' + ICON_PATH + '"></div>';

describe('widgets.toolbox', function () {

    before(function () {
        if (window.__karma__ && $(FIXTURES).length === 0) {
            $(CONSTANTS.BODY).append('<div id="fixtures"></div>');
        }
    });

    describe('Availability', function () {

        it('requirements', function () {
            expect($).not.to.be.undefined;
            expect(kendo).not.to.be.undefined;
            expect(kendo.version).to.be.a('string');
            expect(kidoju).not.to.be.undefined;
            expect(kidoju.tools).not.to.be.undefined;
            expect($.fn.kendoToolBox).to.be.a(CONSTANTS.FUNCTION);
        });

    });

    describe('Initialization', function () {

        it('from code', function () {
            var element = $(ELEMENT).appendTo(FIXTURES);
            var toolbox = element.kendoToolBox({ iconPath: ICON_PATH }).data('kendoToolBox');
            expect(toolbox).to.be.an.instanceof(ToolBox);
            expect(element.hasClass('k-widget')).to.be.true;
            expect(element.hasClass('kj-toolbox')).to.be.true;
            expect(element.find('a.kj-tool')).to.be.an.instanceof($).with.property('length').that.is.gte(1);
            expect(Math.round(10 * element.find('a.kj-tool > img').width()) / 10).to.equal(32);
            expect(Math.round(10 * element.find('a.kj-tool > img').height()) / 10).to.equal(32);
        });

        it('from code with options', function () {
            var element = $(ELEMENT).appendTo(FIXTURES);
            var toolbox = element.kendoToolBox({ iconPath: ICON_PATH, size: 64 }).data('kendoToolBox');
            expect(toolbox).to.be.an.instanceof(ToolBox);
            expect(element.hasClass('k-widget')).to.be.true;
            expect(element.hasClass('kj-toolbox')).to.be.true;
            expect(element.find('a.kj-tool')).to.be.an.instanceof($).with.property('length').that.is.gte(1);
            expect(Math.round(10 * element.find('a.kj-tool > img').width()) / 10).to.equal(64);
            expect(Math.round(10 * element.find('a.kj-tool > img').height()) / 10).to.equal(64);
        });

        it('from markup', function () {
            var element = $(TOOLBOX2).appendTo(FIXTURES);
            init(FIXTURES);
            var toolbox = element.data('kendoToolBox');
            expect(toolbox).to.be.an.instanceof(ToolBox);
            expect(element.hasClass('k-widget')).to.be.true;
            expect(element.hasClass('kj-toolbox')).to.be.true;
            expect(element.find('a.kj-tool')).to.be.an.instanceof($).with.property('length').that.is.gte(1);
            expect(Math.round(10 * element.find('a.kj-tool > img').width()) / 10).to.equal(48);
            expect(Math.round(10 * element.find('a.kj-tool > img').height()) / 10).to.equal(48);
        });

    });

    describe('Methods', function () {

        var element;
        var toolbox;

        beforeEach(function () {
            element = $(ELEMENT).appendTo(FIXTURES);
            toolbox = element.kendoToolBox({ iconPath: ICON_PATH }).data('kendoToolBox');
        });

        it('Set/Get the current tool with valid values', function () {
            expect(toolbox).to.be.an.instanceof(ToolBox);
            expect(kidoju.tools).to.be.an.instanceof(kendo.data.ObservableObject).with.property('active', 'pointer');
            expect(toolbox.tool()).to.equal('pointer');
            toolbox.tool('label');
            expect(toolbox.tool()).to.equal('label');
            expect(kidoju.tools).to.have.property('active', 'label');
            toolbox.tool('textbox');
            expect(toolbox.tool()).to.equal('textbox');
            expect(kidoju.tools).to.have.property('active', 'textbox');
        });

        it('Set/Get the current tool with invalid values', function () {
            function fn1() {
                toolbox.tool(0);
            }
            function fn2() {
                toolbox.tool('dummy');
            }
            expect(toolbox).to.be.an.instanceof(ToolBox);
            expect(fn1).to.throw(TypeError);
            expect(fn2).to.throw(RangeError);
        });

        it('Reset', function () {
            expect(toolbox).to.be.an.instanceof(ToolBox);
            toolbox.tool('label');
            expect(kidoju.tools).to.have.property('active', 'label');
            toolbox.reset();
            expect(kidoju.tools).to.have.property('active', 'pointer');
            toolbox.tool('textbox');
            expect(kidoju.tools).to.have.property('active', 'textbox');
            toolbox.reset();
            expect(kidoju.tools).to.have.property('active', 'pointer');
        });

    });

    describe('MVVM (and UI interactions)', function () {

        var element;
        var toolbox;

        beforeEach(function () {
            element = $(ELEMENT).appendTo(FIXTURES);
            toolbox = element.kendoToolBox({ iconPath: ICON_PATH }).data('kendoToolBox');
        });

        it('A change of tool raises a change in the toolbox', function () {
            expect(toolbox).to.be.an.instanceof(ToolBox);
            toolbox.reset();
            expect(kidoju.tools).to.be.an.instanceof(kendo.data.ObservableObject).with.property('active', 'pointer');
            expect(toolbox.tool()).to.equal('pointer');
            kidoju.tools.set('active', 'label');
            expect(toolbox.tool()).to.equal('label');
            expect(element.find('a.k-state-selected').attr(kendo.attr('tool'))).to.equal('label');
        });

        it('A selection in the toolbox raises a change of tool', function () {
            expect(toolbox).to.be.an.instanceof(ToolBox);
            toolbox.reset();
            expect(kidoju.tools).to.be.an.instanceof(kendo.data.ObservableObject).with.property('active', 'pointer');
            expect(toolbox.tool()).to.equal('pointer');
            element.find('[data-tool="label"]').simulate(CLICK);
            expect(kidoju.tools.get('active')).to.equal('label');
            expect(toolbox.tool()).to.equal('label');
            expect(element.find('a.k-state-selected').attr(kendo.attr('tool'))).to.equal('label');
        });

    });

    describe('Events', function () {

        var element;
        var toolbox;

        beforeEach(function () {
            element = $(ELEMENT).appendTo(FIXTURES);
            toolbox = element.kendoToolBox({ iconPath: ICON_PATH }).data('kendoToolBox');
        });

        it('Change event', function () {
            var change = sinon.spy();
            expect(toolbox).to.be.an.instanceof(ToolBox);
            toolbox.reset();
            expect(kidoju.tools).to.be.an.instanceof(kendo.data.ObservableObject).with.property('active', 'pointer');
            toolbox.bind('change', function (e) {
                change(e.value);
            });
            toolbox.tool('label');
            expect(change).to.have.been.calledWith('label');
        });

        it('Click event', function () {
            var click = sinon.spy();
            expect(toolbox).to.be.an.instanceof(ToolBox);
            toolbox.reset();
            expect(kidoju.tools).to.be.an.instanceof(kendo.data.ObservableObject).with.property('active', 'pointer');
            toolbox.bind('click', function (e) {
                click(e.value);
            });
            element.find('a[data-tool=textbox]').simulate('click');
            expect(click).to.have.been.calledWith('textbox');
        });

    });

    afterEach(function () {
        var fixtures = $(FIXTURES);
        destroy(fixtures);
        fixtures.find('*').off();
        fixtures.empty();
    });

});
