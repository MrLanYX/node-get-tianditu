var axios = require('axios')
var fs = require("fs");
var Bagpipe = require('bagpipe')
var { LOG_FUNCTION, EXIT_WRITE_ERR, EXIT_REQUEST_ERR, EXIT_LOG_LIMIT_SIZE, LOG_LIMIT_SIZE } = require('./config') // 引入环境变量
var { testLogPath, user_agent_list_2, token, zpath, speed, testType, testX, testY, testZ } = require('./config') // 引入参数

var currentDate = new Date(); //日期处理
var date = currentDate.getTime() // 计入启动时时间生成日志


var bag = new Bagpipe(speed, { timeout: 1000 })

function download(data) {
    let params = JSON.parse(data)
    var ip = Math.floor(Math.random() * 256) + "." + Math.floor(Math.random() * 256) + "." + Math.floor(Math.random() * 256) + "." + Math.floor(Math.random() * 256) //随机生成IP迷惑服务器
    var v = Math.floor(Math.random() * 9)
    var ts = Math.floor(Math.random() * 5) //随机生成0-7台服务器
    let imgurl = `http://t${ts}.tianditu.gov.cn/DataServer?T=${params.mapstyle}&x=${params.x}&y=${params.y}&l=${params.z}&tk=${token}`;
    var options = {
        method: 'GET',
        url: imgurl,
        headers: {
            'User-Agent': user_agent_list_2[v],
            'X-Forwarded-For': ip,
            "Connection": 'keep-alive'
        },
        timeout: 60000,
        responseType: 'stream',
        forever: true
    };
    axios(options).then(res => {
        res.data.pipe(fs.createWriteStream(`${zpath}/${params.mapstyle}/${params.z}/${params.x}/${params.y}.png`).on('finish', () => {
            console.log(`图片下载成功:${zpath}/${params.mapstyle}/${params.z}/${params.x}/${params.y}.png`);
            if (LOG_FUNCTION) appendLog('testWriteSuccess', {
                options: options
            }, date)
        }).on('error', (err) => {
            console.log('写入发生异常');
            if (LOG_FUNCTION) appendLog('testWriteErr', {
                err: err,
                options: options
            }, date)
            if (EXIT_WRITE_ERR) process.exit(1)
        }))
    }).catch(err => {
        console.log('请求异常:' + err);
        if (LOG_FUNCTION) appendLog('testRequestErr', {
            err: err,
            options: options
        }, date)
        if (EXIT_REQUEST_ERR) process.exit(1)
    });
}


/**
 * 
 * @param {String} cusid 参数1:表示要向那个文件追加内容,只一个文件的路径
 * @param {Object} body 参数2:表示要追加的内容
 * @param {Date} date 参数3:时间戳生成文件名字
 */
function appendLog(cusid, body, date) {

    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1;
    let day = currentDate.getDate();

    //封装保存内容，'\n'为换行符
    let text = currentDate.toLocaleString() + '\n' + cusid + '\n' + JSON.stringify(body) + '\n'

    let logFile = "./log/testLog_" + year + '_' + month + '_' + day + '_' + date + ".txt"
    //存在则追加，不存在则新建
    if (fs.existsSync(logFile)) {
        // 防止单日志文件大小过大
        if (fs.statSync(logFile).size > LOG_LIMIT_SIZE && EXIT_LOG_LIMIT_SIZE) process.exit(1);
        fs.appendFile(logFile, text, (error) => {});
    } else {
        console.log('该路径不存在');
        fs.writeFile(logFile, text, (error) => {});
    }
}





fs.mkdir('./log', null, (error) => {});
fs.readFile(testLogPath, 'utf-8', (err, stats) => {
    if (err) {
        // 文件不存在 测试某个图片的请求
        axios({
            method: 'GET',
            url: `http://t0.tianditu.gov.cn/DataServer?T=${testType}&x=${testX}&y=${testY}&l=${testZ}&tk=${token}`,
            headers: {
                'User-Agent': '"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0"',
                'X-Forwarded-For': '192.168.0.1',
                "Connection": 'keep-alive'
            },
            responseType: 'stream',
            forever: true
        }).then(res => {
            res.data.pipe(fs.createWriteStream('test.png').on('finish', () => {
                console.log('测试成功');
            }).on('error', (err) => {
                console.log('测试写入异常', err);
                if (EXIT_WRITE_ERR) process.exit(1)
            }))
        }).catch(err => {
            console.log('测试接口异常', err);
            if (EXIT_REQUEST_ERR) process.exit(1)
        });
    } else {
        // 文件存在开始进行修复或补全
        let urls = stats.split('\n')
        urls.pop()
        urls.forEach(data => {
            bag.push(download, data)
        })
    }
})