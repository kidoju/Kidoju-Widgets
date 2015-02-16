/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint node: true, mocha: true, expr: true */

//http://redotheweb.com/2013/01/15/functional-testing-for-nodejs-using-mocha-and-zombie-js.html

'use strict';

var Browser = require('zombie');
var expect = require('chai').expect;

describe('kidoju.integration.designmode.test.js', function() {

    before(function(done) {
        console.log('Start http server');
        require('../../nodejs/http.server.js');
        console.log('Initialize browser');
        this.browser = new Browser();
        console.log('Visit url');
        this.browser.visit('http://localhost:8080/src/kidoju.integration.designmode.html', done);
    });

    describe('When page is loaded', function() {
        it('It should have navigation and stages', function() {
            expect(this.browser.query('[data-role="navigation"]')).to.be.ok;
            expect(this.browser.query('[data-role="stage"]')).to.be.ok;
        });
    });

    //after(function(done) {
        //this.server.close(done);
    //});

});




