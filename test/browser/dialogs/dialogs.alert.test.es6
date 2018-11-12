/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import 'jquery.simulate';
import chai from 'chai';
import chaiJquery from 'chai-jquery';
import JSC from 'jscheck';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import { tryCatch } from '../_misc/test.util.es6';
import {
    openAlert,
    openOKCancelAlert,
    openYesNoAlert
} from '../../../src/js/dialogs/dialogs.alert.es6';

const { afterEach, describe, it } = window;
const { destroy, htmlEncode, ns } = window.kendo;
const { expect } = chai;

// const FIXTURES = '#fixtures';
const TYPES = [
    { name: 'error', title: 'Error' },
    { name: 'info', title: 'Information' },
    { name: 'success', title: 'Success' },
    { name: 'warning', title: 'Warning' }
];
const SELECTORS = {
    TITLE: '.k-dialog .k-dialog-titlebar .k-dialog-title',
    MESSAGE: '.k-dialog .k-notification .k-notification-wrap',
    PRIMARY_BUTTON: '.k-dialog .k-dialog-buttongroup .k-button.k-primary',
    OTHER_BUTTON: '.k-dialog .k-dialog-buttongroup .k-button:not(.k-primary)'
};

chai.use((c, u) => chaiJquery(c, u, $));

describe('dialogs.alert', () => {
    describe('openAlert', () => {
        it('It should open an alert with valid options', done => {
            const TYPE = JSC.one_of(TYPES)();
            const type = TYPE.name;
            const message = JSC.string()();
            const action = JSC.string(
                JSC.integer(1, 8),
                JSC.character('a', 'z')
            )();
            const text = JSC.string()();
            openAlert({
                type,
                message,
                actions: [{ action, text, primary: true }]
            })
                .then(
                    tryCatch(done)(resp => {
                        expect(resp.action).to.equal(action);
                    })
                )
                .catch(done);
            // Check that a failed expect fails test without done
            // expect(true).to.be.false;
            expect($(SELECTORS.TITLE)).to.have.text(TYPE.title);
            expect($(SELECTORS.MESSAGE)).to.have.text(message);
            $(SELECTORS.PRIMARY_BUTTON).simulate(CONSTANTS.CLICK);
        });

        it('It should htmlEncode', done => {
            const TYPE = JSC.one_of(TYPES)();
            const type = TYPE.name;
            const message = '"><script>alert("XSS");</script><"';
            const action = JSC.string(
                JSC.integer(1, 8),
                JSC.character('a', 'z')
            )();
            const text = '"><script>alert("Hello");</script><"';
            openAlert({
                type,
                message,
                actions: [{ action, text, primary: true }]
            })
                .then(
                    tryCatch(done)(resp => {
                        expect(resp.action).to.equal(action);
                    })
                )
                .catch(done);
            expect($(SELECTORS.TITLE)).to.have.text(TYPE.title);
            expect($(SELECTORS.MESSAGE)).to.have.text(message);
            $(SELECTORS.PRIMARY_BUTTON).simulate(CONSTANTS.CLICK);
        });
    });

    describe('openOKCancelAlert', () => {
        it('It should respond ok when pressed', done => {
            const TYPE = JSC.one_of(TYPES)();
            const type = TYPE.name;
            const message = JSC.string()();
            openOKCancelAlert({ type, message })
                .then(
                    tryCatch(done)(resp => {
                        expect(resp.action).to.equal('ok');
                    })
                )
                .catch(done);
            expect($(SELECTORS.TITLE)).to.have.text(TYPE.title);
            expect($(SELECTORS.MESSAGE)).to.have.text(message);
            $(SELECTORS.PRIMARY_BUTTON).simulate(CONSTANTS.CLICK);
        });

        it('It should respond cancel when pressed', done => {
            const TYPE = JSC.one_of(TYPES)();
            const type = TYPE.name;
            const message = JSC.string()();
            openOKCancelAlert({ type, message })
                .then(
                    tryCatch(done)(resp => {
                        expect(resp.action).to.equal('cancel');
                    })
                )
                .catch(done);
            expect($(SELECTORS.TITLE)).to.have.text(TYPE.title);
            expect($(SELECTORS.MESSAGE)).to.have.text(message);
            $(SELECTORS.OTHER_BUTTON).simulate(CONSTANTS.CLICK);
        });
    });

    describe('openYesNoAlert', () => {
        it('It should respond yes when pressed', done => {
            const TYPE = JSC.one_of(TYPES)();
            const type = TYPE.name;
            const message = JSC.string()();
            openYesNoAlert({ type, message })
                .then(
                    tryCatch(done)(resp => {
                        expect(resp.action).to.equal('yes');
                    })
                )
                .catch(done);
            expect($(SELECTORS.TITLE)).to.have.text(TYPE.title);
            expect($(SELECTORS.MESSAGE)).to.have.text(message);
            $(SELECTORS.PRIMARY_BUTTON).simulate(CONSTANTS.CLICK);
        });

        it('It should respond no when pressed', done => {
            const TYPE = JSC.one_of(TYPES)();
            const type = TYPE.name;
            const message = JSC.string()();
            openYesNoAlert({ type, message })
                .then(
                    tryCatch(done)(resp => {
                        expect(resp.action).to.equal('no');
                    })
                )
                .catch(done);
            expect($(SELECTORS.TITLE)).to.have.text(TYPE.title);
            expect($(SELECTORS.MESSAGE)).to.have.text(message);
            $(SELECTORS.OTHER_BUTTON).simulate(CONSTANTS.CLICK);
        });
    });

    afterEach(() => {
        const dialog = $(`[data-${ns}role="dialog"]`);
        destroy(dialog);
        dialog.remove();
    });
});