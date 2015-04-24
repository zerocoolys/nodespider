var Crawler = require('simplecrawler');
var querystring = require('querystring')
var es = require('elasticsearch')
var http = require('http')

var dom = require('./service/dom.js')

var hotel = require('./service/hotels.js')
var sight = require('./service/sight.js')

var client = new es.Client({
    host: '192.168.100.5:19200',
    log: 'warning'
});

var host = "www.mafengwo.cn";
var crawler = new Crawler(host, "/travel-scenic-spot/mafengwo/11228.html", 80, 1000);

crawler.maxConcurrency = 1;
crawler.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';
crawler.scanSubdomains = true;
crawler.downloadUnsupported = false;

crawler.addFetchCondition(function (url) {
    return !url.path.match(/\.(pdf|jpg|jpeg|bmp|png|css|js|doc|excel|mp3|wav)$/);
})


crawler.on("fetchcomplete", function (queueItem, buf, response) {

    console.log(queueItem.url)
    var array = queueItem.url.match(/.*\/(i|hotel|cy|jd|yj|xc|travel\-scenic\-spot)\/.*/)


    if (array) {
        var type = array[1];
        var html = buf.toString();
        if (type == 'i') {
            dom.make(html, _i, queueItem.url);
        } else if (type == 'travel-scenic-spot') {
            dom.make(html, sight.main, queueItem.url);
        } else if (type == 'hotel') {
            dom.make(html, hotel.main, queueItem.url);
        }
    } else {
    }
});


function makeDom(html, callback, url, doc) {
    jsdom.env({
        html: html,
        src: [jquery],
        done: function (errors, window) {
            var $ = window.$;
            callback(errors, $, url, doc);
            window.close();   // 释放window相关资源，否则将会占用很高的内存
        }
    });
}

function _i($, url) {
    var title = $('title').text();
    var body = $('.cont').text();
    var repls = $('.reply');

    var dest = $('.txt').text();

    var lvl = $('.crumb').text().trim().split('>');


    var document = {
        "title": title,
        "text": body,
        "dest": dest,
        "level": lvl
    }

    var replarray = [];
    repls.each(function () {
        var replyer = {
            "text": $(this).text().trim(),
            "owner": $(this).attr('owner')
        }
        replarray.push(replyer);
    })
    document["repls"] = replarray;

    var uhref = $($('a[class="name"]')[0]).attr('href');

    if (uhref)
        document["userid"] = uhref.replace("/u/", "").replace(".html", "");

    client.index({
        index: "mafengwo",
        type: "i",
        body: document
    }, function (error, response) {
        if (error) {
            console.log(error);
        }
    });


}

function _tss(err, $, url) {

}

function _h(err, $, url) {


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
                    var ret = _comment($, commentHtml);

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
}

function _comment($, html) {

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

crawler.on("complete", function () {
    process.exit(0)
});

crawler.start();
