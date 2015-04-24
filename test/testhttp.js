var http = require('http')

http.get("http://www.mafengwo.cn/hotel/ajax.php?sAction=get_comment_html&page=2&hotel_id=2709", function (res) {
    //console.log(res);
    var buf = [];
    var size = 0;
    res.on('data', function (data) {
        size += data.length;
        buf.push(data);
    });

    res.on("end", function () {
        var data = Buffer.concat(buf, size);
        return JSON.parse(data.toString());
    })

})