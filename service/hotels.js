var client = require('./es.js')
var http = require('http')

var hotel = {
    main: function (err, $, url, doc) {
        var id = Number(url.match(/\d+/)[0]);

        // 区域归属
        var location = [];

        $('.item').each(function () {
            location.push($(this).text().trim().split('\n')[0].replace(">", "").trim())
        })

        //酒店名称
        var title = $('.intro-title .t h1').text().trim();

        //酒店地址
        var address = $('.address p').text().trim();

        // 酒店评分
        var score = $('.score em').text().trim();

        // 酒店阅读重点
        var intro = $('.intro').text().trim();

        // 酒店攻略
        var desc = $('.m-desc dd').text().replace(/--/gi, '').trim();

        // 酒店服务
        var prop = {};
        $('.m-desc li').each(function () {
            var kv = $(this).text().trim().split('\n');
            prop[kv[0]] = kv[1];
        })

        var doc = {
            "id": id,
            "title": title,
            "location": location,
            "address": address,
            "score": score,
            "intro": intro,
            "desc": desc,
            "prop": prop
        }

        client.index(
            {
                index: "mafengwo",
                type: "hotel",
                body: doc
            }, function (err, resp) {
                if (err) {
                    console.log(err)
                    return;
                }
            }
        )
        hotel._h_comments($, id)
    },

    _h_comments: function ($, id) {
        var max = 0;
        $('.paginator a').each(function () {
            max = Math.max(max, Number($(this).attr('data-value')));
        });


        var comment = "http://www.mafengwo.cn/hotel/ajax.php?sAction=get_comment_html&hotel_id=$id$&page=".replace('$id$', id);

        var comments = [];
        for (var page = 1; page <= max; page++) {
            http.get(comment + page, function (res) {
                var buf = [];
                var size = 0;
                res.on('data', function (data) {
                    size += data.length;
                    buf.push(data);
                });

                res.on("end", function () {
                    var data = Buffer.concat(buf, size);
                    var commentHtml = JSON.parse(data.toString())["html"];
                    if (commentHtml) {
                        var ret = hotel._comment($, commentHtml);

                        ret.forEach(function (item) {
                            comments.push(item);
                        })
                    }
                })

            })
        }
        client.index({
            index: "mafengwo",
            type: "hotel_comments",
            body: {
                "id": id,
                "comments": comments
            }
        })
    },

    _comment: function ($, html) {

        var comments = [];
        $(html).find('.c-content').each(function () {
            var comment = {"comment": $(this).text().trim()}
            comments.push(comment)
        })

        var idx = 0;
        $(html).find('meta[itemprop="ratingValue"]').each(function () {
            comments[idx++]["rate"] = $(this).attr("content");
        })

        return comments;
    }

}

module.exports = hotel;