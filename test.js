// An highlighted block
var axios = require('axios')
var fs = require("fs");
var { bou, Minlevel, Maxlevel, token, zpath, speed, mapstyles } = require('./config') // 引入参数

var type = 'vec_w';
var x = '1';
var y = '1';
var z = '1';

// 用于测试某个图片的请求
axios({
    method: 'GET',
    url: `http://t0.tianditu.gov.cn/DataServer?T=${type}&x=${x}&y=${y}&l=${z}&tk=${token}`,
    headers: {
        'User-Agent': '"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0"',
        'X-Forwarded-For': '182.11.56.20',
        "Connection": 'keep-alive'
    },
    responseType: 'stream',
    forever: true
}).then(res => {
    res.data.pipe(fs.createWriteStream(`test.png`).on('finish', () => {
        console.log('成功');
    }).on('error', (err) => {
        console.log('写入异常', err);
    }))
}).catch(err => {
    console.log('接口异常', err);
});