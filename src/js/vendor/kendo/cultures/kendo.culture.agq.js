/** 
 * Kendo UI v2019.2.514 (http://www.telerik.com/kendo-ui)                                                                                                                                               
 * Copyright 2019 Progress Software Corporation and/or one of its subsidiaries or affiliates. All rights reserved.                                                                                      
 *                                                                                                                                                                                                      
 * Kendo UI commercial licenses may be obtained at                                                                                                                                                      
 * http://www.telerik.com/purchase/license-agreement/kendo-ui-complete                                                                                                                                  
 * If you do not own a commercial license, this file shall be governed by the trial license terms.                                                                                                      
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       
                                                                                                                                                                                                       

*/

(function(f){
    if (typeof define === 'function' && define.amd) {
        define(["kendo.core"], f);
    } else {
        f();
    }
}(function(){
(function( window, undefined ) {
    kendo.cultures["agq"] = {
        name: "agq",
        numberFormat: {
            pattern: ["-n"],
            decimals: 2,
            ",": " ",
            ".": ",",
            groupSize: [3],
            percent: {
                pattern: ["-n%","n%"],
                decimals: 2,
                ",": " ",
                ".": ",",
                groupSize: [3],
                symbol: "%"
            },
            currency: {
                name: "",
                abbr: "",
                pattern: ["-n$","n$"],
                decimals: 0,
                ",": " ",
                ".": ",",
                groupSize: [3],
                symbol: "FCFA"
            }
        },
        calendars: {
            standard: {
                days: {
                    names: ["tsuʔntsɨ","tsuʔukpà","tsuʔughɔe","tsuʔutɔ̀mlò","tsuʔumè","tsuʔughɨ̂m","tsuʔndzɨkɔʔɔ"],
                    namesAbbr: ["nts","kpa","ghɔ","tɔm","ume","ghɨ","dzk"],
                    namesShort: ["nts","kpa","ghɔ","tɔm","ume","ghɨ","dzk"]
                },
                months: {
                    names: ["ndzɔ̀ŋɔ̀nùm","ndzɔ̀ŋɔ̀kƗ̀zùʔ","ndzɔ̀ŋɔ̀tƗ̀dʉ̀ghà","ndzɔ̀ŋɔ̀tǎafʉ̄ghā","ndzɔ̀ŋèsèe","ndzɔ̀ŋɔ̀nzùghò","ndzɔ̀ŋɔ̀dùmlo","ndzɔ̀ŋɔ̀kwîfɔ̀e","ndzɔ̀ŋɔ̀tƗ̀fʉ̀ghàdzughù","ndzɔ̀ŋɔ̀ghǔuwelɔ̀m","ndzɔ̀ŋɔ̀chwaʔàkaa wo","ndzɔ̀ŋèfwòo"],
                    namesAbbr: ["nùm","kɨz","tɨd","taa","see","nzu","dum","fɔe","dzu","lɔm","kaa","fwo"]
                },
                AM: ["AM","am","AM"],
                PM: ["PM","pm","PM"],
                patterns: {
                    d: "d/M/yyyy",
                    D: "dddd d MMMM yyyy",
                    F: "dddd d MMMM yyyy HH:mm:ss",
                    g: "d/M/yyyy HH:mm",
                    G: "d/M/yyyy HH:mm:ss",
                    m: "MMMM d",
                    M: "MMMM d",
                    s: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
                    t: "HH:mm",
                    T: "HH:mm:ss",
                    u: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'",
                    y: "yyyy MMMM",
                    Y: "yyyy MMMM"
                },
                "/": "/",
                ":": ":",
                firstDay: 1
            }
        }
    }
})(this);
}));