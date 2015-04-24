var jsdom = require('jsdom')
var jquery = require("fs").readFileSync("./jquery.js", "utf-8");

var dom = {
    make: function (html, callback, url, doc) {
        jsdom.env({
            html: html,
            src: [jquery],
            done: function (errors, window) {
                var $ = window.$;
                callback($, url);
                window.close();   // 释放window相关资源，否则将会占用很高的内存
            }
        });
    }
}

module.exports = dom