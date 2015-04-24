var http = require('http')
var async = require('async')
var client = require('./es.js')
var dom = require('./dom.js')

var sight = {
    main: function ($, url) {
        var id = Number(url.match(/\d+/)[0]);

        var location = [];

        $('.item').each(function () {
            location.push($(this).text().trim().split('\n')[0].replace(">", ""))
        })

        var name = $('.text h1').text();

        var tags = [];

        $('.m-impress .bd ul li').each(function () {
            var tag = {};
            var number = $(this).attr('title').match(/\d+/);
            if (number) {
                number = number[0];
            }
            var name = $(this).text().replace(number, '').trim();
            tag = {
                name: name,
                value: number
            }

            tags.push(tag);
        })

        var category = ["info", "tel", "cost", "tips", "in", "out", "crj", "festival", "highlight"];
        var baike = "http://www.mafengwo.cn/baike/$c$-" + id + ".html";
        var baikes = [];

        var count = category.length;
        async.eachSeries(category, function (url, cb) {
            http.get(baike.replace("$c$", url), function (res) {
                var buf = [];
                var size = 0;
                res.on('data', function (data) {
                    size += data.length;
                    buf.push(data);
                });

                res.on("end", function () {
                    var data = Buffer.concat(buf, size);
                    dom.make(data.toString(), function ($, url) {
                        $('.m-subTit').each(function () {
                            var title = $(this).text().trim();
                            var txt = $(this).next().text().trim();
                            baikes.push({
                                title: title,
                                txt: txt
                            })
                        })
                    });
                    count--;
                    cb();
                });
            });
        }, function (err) {
            if (err) {
                console.error(err);
                return;
            }

            if (count == 0) {
                var doc = {
                    id: id,
                    name: name,
                    tags: tags,
                    baikes: baikes
                }

                client.index({
                    index: "mafengwo",
                    type: "sight_tags",
                    body: doc
                }, function (err, resp) {
                    if (err)
                        console.error(err)
                })
            }

        });

        //var jd = "http://www.mafengwo.cn/jd/" + id + "/gonglve.html";


    }
}

module.exports = sight