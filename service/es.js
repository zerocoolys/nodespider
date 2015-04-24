var elasticsearch = require('elasticsearch')
//var pro = require('process')

var eshosts = process.argv.slice(2)
var client;

if (eshosts.length > 0) {
    client = new elasticsearch.Client({
        host: 'http://' + eshosts[0],
        sniffOnStart: true,
        sniffInterval: 30000,
        keepAlive: true
    })

} else {
    client = new elasticsearch.Client({
        host: '182.92.227.79:19200',
        sniffOnStart: true,
        sniffInterval: 30000,
        keepAlive: true
    })
}

module.exports = client