/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

import $ from 'jquery';
import chai from 'chai';
import sinon from 'sinon';
import 'sinon-chai';
import FileSystem from '../../../src/js/common/window.fs.es6';

const { before, describe, it, xdescribe, xit } = window;
const { expect } = chai;

describe('window.fs', () => {
    describe('Legacy export', () => {
        it('Check window.app.tts.*', () => {
            expect(window.app.FileSystem).to.equal(FileSystem);
        });
    });

    describe('Initialization', () => {
        it('it should init a window.TEMPORARY file system', done => {
            const fileSystem = new FileSystem();
            fileSystem
                ._initTemporary()
                .done(temporary => {
                    // expect(temporary).to.be.an('object');
                    expect(temporary).not.to.be.undefined;
                    fileSystem
                        ._initTemporary()
                        .done(fs => {
                            expect(fs).to.equal(temporary);
                            done();
                        })
                        .fail(done);
                })
                .fail(done);
        });

        it('it should init a window.PERSISTENT file system', done => {
            const fileSystem = new FileSystem();
            fileSystem
                ._initPersistent()
                .done(persistent => {
                    // expect(persistent).to.be.an('object');
                    expect(persistent).not.to.be.undefined;
                    fileSystem
                        ._initPersistent()
                        .done(fs => {
                            expect(fs).to.equal(persistent);
                            done();
                        })
                        .fail(done);
                })
                .fail(done);
        });

        it('it should init a file system (temporary and persistent)', done => {
            const fileSystem = new FileSystem();
            fileSystem
                .init()
                .done((temporary, persistent) => {
                    // expect(temporary).to.be.an('object');
                    // expect(persistent).to.be.an('object');
                    expect(temporary).not.to.be.undefined;
                    expect(persistent).not.to.be.undefined;
                    done();
                })
                .fail(done);
        });
    });

    describe('getDirectoryEntry', () => {
        it('it should fail to get a directoryEntry if FileSystem has not been initialized', () => {
            function fn() {
                const fileSystem = new FileSystem();
                const path = '/images';
                fileSystem.getDirectoryEntry(path, window.TEMPORARY);
            }
            expect(fn).to.throw;
        });

        it('it should get a directoryEntry in a temporary FileSystem', done => {
            const fileSystem = new FileSystem();
            fileSystem
                .init()
                .done(() => {
                    const path = '/images';
                    fileSystem
                        .getDirectoryEntry(path, window.TEMPORARY)
                        .done(directoryEntry => {
                            try {
                                expect(directoryEntry).not.to.be.undefined;
                                expect(directoryEntry.isDirectory).to.be.true;
                                expect(directoryEntry.fullPath).to.equal(path);
                                done();
                            } catch (ex) {
                                done(ex);
                            }
                        })
                        .fail(done);
                })
                .fail(done);
        });

        it('it should get a directoryEntry in a persistent FileSystem', done => {
            const fileSystem = new FileSystem();
            fileSystem
                .init()
                .done(() => {
                    const path = '/images/icons/office';
                    fileSystem
                        .getDirectoryEntry(path, window.PERSISTENT)
                        .done(directoryEntry => {
                            try {
                                expect(directoryEntry).not.to.be.undefined;
                                expect(directoryEntry.isDirectory).to.be.true;
                                expect(directoryEntry.fullPath).to.equal(path);
                                done();
                            } catch (ex) {
                                done(ex);
                            }
                        })
                        .fail(done);
                })
                .fail(done);
        });
    });

    describe('getFileEntry', () => {
        it('it should get a fileEntry in a temporary FileSystem', done => {
            const fileSystem = new FileSystem();
            const path = '/images';
            const fileName = 'temp.jpg';
            fileSystem
                .init()
                .done(() => {
                    fileSystem
                        .getDirectoryEntry(path, window.TEMPORARY)
                        .done(directoryEntry => {
                            fileSystem
                                .getFileEntry(directoryEntry, fileName)
                                .done(fileEntry => {
                                    try {
                                        expect(fileEntry).not.to.be.undefined;
                                        expect(fileEntry.isFile).to.be.true;
                                        expect(fileEntry.name).to.equal(
                                            fileName
                                        );
                                        expect(fileEntry.fullPath).to.equal(
                                            `${path}/${fileName}`
                                        );
                                        done();
                                    } catch (ex) {
                                        done(ex);
                                    }
                                })
                                .fail(done);
                        })
                        .fail(done);
                })
                .fail(done);
        });

        it('it should get a fileEntry in a persistent FileSystem', done => {
            const fileSystem = new FileSystem();
            const path = '/images';
            const fileName = 'temp.jpg';
            fileSystem
                .init()
                .done(() => {
                    fileSystem
                        .getDirectoryEntry(path, window.PERSISTENT)
                        .done(directoryEntry => {
                            fileSystem
                                .getFileEntry(directoryEntry, fileName)
                                .done(fileEntry => {
                                    try {
                                        expect(fileEntry).not.to.be.undefined;
                                        expect(fileEntry.isFile).to.be.true;
                                        expect(fileEntry.name).to.equal(
                                            fileName
                                        );
                                        expect(fileEntry.fullPath).to.equal(
                                            `${path}/${fileName}`
                                        );
                                        done();
                                    } catch (ex) {
                                        done(ex);
                                    }
                                })
                                .fail(done);
                        })
                        .fail(done);
                })
                .fail(done);
        });
    });

    // window.FileTransfer is now deprecated
    // @see https://cordova.apache.org/blog/2017/10/18/from-filetransfer-to-xhr2.html
    xdescribe('download with window.FileTransfer (now deprecated)', () => {
        const transfer = sinon.spy();

        before(() => {
            class FileTransfer {
                // eslint-disable-next-line class-methods-use-this
                download(
                    remoteUrl,
                    fileUrl,
                    successCallback
                    // errorCallback,
                    // trueAllHosts
                    // options
                ) {
                    window.resolveLocalFileSystemURL =
                        window.resolveLocalFileSystemURL ||
                        window.webkitResolveLocalFileSystemURL;
                    window.resolveLocalFileSystemURL(fileUrl, fileEntry => {
                        transfer(fileUrl);
                        successCallback(fileEntry);
                    });
                }
            }

            // Create a stub for window.FileTransfer
            window.FileTransfer = FileTransfer;
        });

        it('it should download a remote url to a temporary FileSystem', done => {
            const fileSystem = new FileSystem();
            const remoteUrl = 'https://cdn.kidoju.com/kidoju/kidoju.logo.png';
            const path = '/images';
            const fileName = 'logo.png';
            fileSystem
                .init()
                .done(() => {
                    fileSystem
                        .getDirectoryEntry(path, window.TEMPORARY)
                        .done(directoryEntry => {
                            fileSystem
                                .getFileEntry(directoryEntry, fileName)
                                .done(fileEntry => {
                                    fileSystem
                                        .download(remoteUrl, fileEntry)
                                        .done(entry => {
                                            try {
                                                expect(transfer).to.have.been
                                                    .calledOnce;
                                                expect(
                                                    transfer
                                                ).to.have.been.calledWith(
                                                    entry.toURL()
                                                );
                                                done();
                                            } catch (ex) {
                                                done(ex);
                                            }
                                        })
                                        .fail(done);
                                })
                                .fail(done);
                        })
                        .fail(done);
                })
                .fail(done);
        });
    });

    describe('download with XHR2', () => {
        function download(remoteUrl, fileName) {
            const dfd = $.Deferred();
            const fileSystem = new FileSystem();
            const path = '/images';
            fileSystem
                .init()
                .done(() => {
                    fileSystem
                        .getDirectoryEntry(path, window.TEMPORARY)
                        .done(directoryEntry => {
                            expect(directoryEntry).not.to.be.undefined;
                            expect(directoryEntry.isDirectory).to.be.true;
                            fileSystem
                                .getFileEntry(directoryEntry, fileName)
                                .done(fileEntry => {
                                    expect(fileEntry).not.to.be.undefined;
                                    expect(fileEntry.isFile).to.be.true;
                                    fileSystem
                                        .download(remoteUrl, fileEntry)
                                        .done(dfd.resolve)
                                        .fail(dfd.reject);
                                })
                                .fail(dfd.reject);
                        })
                        .fail(dfd.reject);
                })
                .fail(dfd.reject);
            return dfd.promise();
        }

        function test(remoteUrl, fileName, done) {
            download(remoteUrl, fileName)
                .done(e => {
                    try {
                        if (
                            /Chrome/.test(navigator.userAgent) &&
                            /Google Inc/.test(navigator.vendor)
                        ) {
                            // Only on Chrome - https://caniuse.com/#feat=filesystem
                            expect(e).to.be.an.instanceof(window.ProgressEvent);
                            expect(e.type).to.equal('writeend');
                            expect(e.loaded).to.equal(e.total);
                        } else {
                            // On other platforms we use https://github.com/ebidel/idb.filesystem.js/
                            // Which does not report a ProgressEvent - see https://github.com/ebidel/idb.filesystem.js/issues/23
                            expect(e).to.be.undefined;
                        }
                        done();
                    } catch (ex) {
                        done(ex);
                    }
                })
                .fail(done);
        }

        it('it should download a remote url to a temporary FileSystem', done => {
            const remoteUrl = 'https://cdn.kidoju.com/kidoju/kidoju.logo.png';
            const fileName = 'logo.png';
            test(remoteUrl, fileName, done);
        });

        it('it should grab a profile picture from Facebook', done => {
            // var remoteUrl = 'https://lookaside.facebook.com/platform/profilepic/?asid=357323574748619&height=50&width=50&ext=1524312400&hash=AeS041AQDB6qcqqu'; // Fly Flyerson
            const remoteUrl =
                'https://graph.facebook.com/v2.8/357323574748619/picture'; // Fly Flyerson
            // var remoteUrl = 'https://graph.facebook.com/v2.8/168077410636906/picture'; // Hai Chan (default)
            // var remoteUrl = 'https://graph.facebook.com/v2.8/10154518601432883/picture'; //
            const fileName = 'picture.jpg';
            test(remoteUrl, fileName, done);
        });

        it('it should grab the default profile picture from Google', done => {
            const remoteUrl =
                'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg';
            const fileName = 'picture.jpg';
            test(remoteUrl, fileName, done);
        });

        it('it should grab a custom profile picture from Google', done => {
            const remoteUrl =
                'https://lh3.googleusercontent.com/-3ZCodtNM7jE/AAAAAAAAAAI/AAAAAAABcuo/s-E1n4YTpik/photo.jpg';
            const fileName = 'picture.jpg';
            test(remoteUrl, fileName, done);
        });

        it('it should grab a profile picture from Twitter', done => {
            const remoteUrl =
                'https://pbs.twimg.com/profile_images/681812478876119042/UQ6KWVL8_normal.jpg'; // JLC
            // var remoteUrl = 'https://pbs.twimg.com/profile_images/2259969465/iPhoto_Library_Twitt_normal.jpg'; // PJ
            const fileName = 'picture.jpg';
            test(remoteUrl, fileName, done);
        });

        // This fails
        xit('it should grab a profile picture from Windows Live', done => {
            const remoteUrl =
                'https://apis.live.net/v5.0/afe934f8913d4112/picture?type=medium';
            // var remoteUrl = 'https://cid-afe934f8913d4112.users.storage.live.com/users/0xafe934f8913d4112/myprofile/expressionprofile/profilephoto:UserTileStatic';
            const fileName = 'picture.jpg';
            test(remoteUrl, fileName, done);
        });

        it('it should fail if remote url is forbidden (403)', done => {
            const remoteUrl = 'https://cdn.kidoju.com/foo/bar';
            const fileName = 'bar.png';
            download(remoteUrl, fileName)
                .done(() => {
                    done(new Error('Should have caught a status error'));
                })
                .fail(err => {
                    try {
                        expect(err.message).to.equal(
                            'XMLHttpRequest status 403'
                        );
                        done();
                    } catch (ex) {
                        done(ex);
                    }
                });
        });

        it('it should fail if remote url is not found (404)', done => {
            const remoteUrl = 'https://www.memba.com/foo.png';
            const fileName = 'foo.png';
            download(remoteUrl, fileName)
                .done(() => {
                    done(new Error('Should have caught a status error'));
                })
                .fail(err => {
                    try {
                        // expect(err.message).to.equal('XMLHttpRequest status 404');
                        expect(err.message).to.equal('XMLHttpRequest error');
                        done();
                    } catch (ex) {
                        done(ex);
                    }
                });
        });
    });

    describe('download with jQuery', () => {
        $.ajaxPrefilter('arraybuffer', options => {
            /* eslint-disable no-param-reassign */
            options.xhrFields = { responseType: 'arraybuffer' };
            options.responseFields.arraybuffer = 'response';
            options.converters['binary arraybuffer'] = true;
            /* eslint-enable no-param-reassign */
        });

        function downloadFile(remoteUrl) {
            const dfd = $.Deferred();
            $.ajax({
                cache: true,
                // crossDomain: true,
                dataType: 'arraybuffer',
                type: 'GET',
                url: remoteUrl
            })
                .done((response, status, xhr) => {
                    if (xhr.status === 200) {
                        const blob = new window.Blob([response], {
                            type: xhr.getResponseHeader('content-type')
                        });
                        blob.name = remoteUrl.split('/').pop();
                        dfd.resolve(blob);
                    } else {
                        dfd.reject(xhr, status, 'error');
                    }
                })
                .fail(dfd.reject); // Note: cross domain $.get from localhost is not allowed in Google Chrome and will end up here
            return dfd.promise();
        }

        function test(remoteUrl, done) {
            downloadFile(remoteUrl)
                .done(blob => {
                    try {
                        expect(blob).to.have.property('name'); // , 'picture');
                        expect(blob)
                            .to.have.property('size')
                            .that.is.a('number')
                            .gt(0);
                        expect(blob).to.have.property('type'); // , 'image/jpeg');
                        done();
                    } catch (ex) {
                        done(ex);
                    }
                })
                .fail(done);
        }

        it('it should grab a profile picture from Facebook', done => {
            const remoteUrl =
                'https://graph.facebook.com/v2.8/357323574748619/picture';
            // var remoteUrl = 'https://lookaside.facebook.com/platform/profilepic/?asid=357323574748619&height=50&width=50&ext=1524312400&hash=AeS041AQDB6qcqqu';
            // var remoteUrl = 'https://apis.live.net/v5.0/afe934f8913d4112/picture?suppress_response_code=true';
            // var remoteUrl = 'https://cid-afe934f8913d4112.users.storage.live.com/users/0xafe934f8913d4112/myprofile/expressionprofile/profilephoto:UserTileStatic';
            test(remoteUrl, done);
        });

        it('it should grab the default profile picture from Google', done => {
            const remoteUrl =
                'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg';
            test(remoteUrl, done);
        });

        it('it should grab a custom profile picture from Google', done => {
            const remoteUrl =
                'https://lh3.googleusercontent.com/-3ZCodtNM7jE/AAAAAAAAAAI/AAAAAAABcuo/s-E1n4YTpik/photo.jpg';
            test(remoteUrl, done);
        });

        it('it should grab a profile picture from Twitter', done => {
            const remoteUrl =
                'https://pbs.twimg.com/profile_images/681812478876119042/UQ6KWVL8_normal.jpg'; // JLC
            // var remoteUrl = 'https://pbs.twimg.com/profile_images/2259969465/iPhoto_Library_Twitt_normal.jpg'; // PJ
            test(remoteUrl, done);
        });

        // It fails
        xit('it should grab a profile picture from Windows Live', done => {
            const remoteUrl =
                'https://apis.live.net/v5.0/afe934f8913d4112/picture?type=medium';
            // var remoteUrl = 'https://cid-afe934f8913d4112.users.storage.live.com/users/0xafe934f8913d4112/myprofile/expressionprofile/profilephoto:UserTileStatic';
            test(remoteUrl, done);
        });
    });

    // TODO describe('download with Canvas', () => {});
});