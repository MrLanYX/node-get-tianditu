// An highlighted block
var axios = require('axios')
var Bagpipe = require('bagpipe')
var fs = require("fs");
var { user_agent_list_2, bou, Minlevel, Maxlevel, token, zpath, speed, mapstyles } = require('./config') // 引入参数
var currentDate = new Date(); //日期处理
var date = currentDate.getTime() // 计入启动时时间生成日志

var sum = 0;
var requestTotal = 0;
var all = [];

/**
 * 计算经纬度转换成瓦片坐标
 * @param {Number} lng 经度 
 * @param {Number} lat 纬度
 * @param {Number} level 层级 
 */
function calcXY(lng, lat, level) {
    let x = (lng + 180) / 360
    let title_X = Math.floor(x * Math.pow(2, level))
    let lat_rad = lat * Math.PI / 180
    let y = (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2
    let title_Y = Math.floor(y * Math.pow(2, level))
    return { title_X, title_Y }
}
/**
 * 计算每个层级的瓦片坐标
 * @param {Arr} bounding 范围
 * @param {Number} Minlevel 最小层级
 * @param {Number} Maxlevel 最大层级
 */
function mainnAllXY(bounding, Minlevel, Maxlevel) {
    for (i = Minlevel; i <= Maxlevel; i++) {
        alli = {}
        let p1 = calcXY(bounding[2], bounding[3], i);
        let p2 = calcXY(bounding[0], bounding[1], i);
        alli.t = i // 层级
        alli.x = [p2.title_X, p1.title_X] // 瓦片横坐标范围（左至右）
        alli.y = [p1.title_Y, p2.title_Y] // 瓦片纵坐标范围（下至上）
        all.push(alli)
    }

    createDir()
}

function createDir() {
    fs.access(zpath, fs.constants.F_OK, err => {
        // 创建tiles文件夹
        if (err) fs.mkdir(zpath, err => {})
        for (const mapstyle of mapstyles) {
            fs.access(`${zpath}/${mapstyle}`, fs.constants.F_OK, err => {
                // 创建 tiles/mapstyle瓦片类型文件夹
                if (err) fs.mkdir(`${zpath}/${mapstyle}`, err => {})
                for (let z = 0; z <= all.length - 1; z++) {
                    fs.access(`${zpath}/${mapstyle}/${all[z].t}`, fs.constants.F_OK, err => {
                        // 创建 tiles/mapstyle/Z 文件夹 ,Z是层级
                        if (err) fs.mkdir(`${zpath}/${mapstyle}/${all[z].t}`, err => {})
                        for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
                            fs.access(`${zpath}/${mapstyle}/${all[z].t}/${x}`, fs.constants.F_OK, err => {
                                // 创建 tiles/mapstyle/Z/X 文件夹 ,X是瓦片横坐标
                                if (err) fs.mkdir(`${zpath}/${mapstyle}/${all[z].t}/${x}`, err => {})
                            })
                        }
                    })
                }
            })
        }
        // 文件夹可能较多，等待5s开始下载
        setTimeout(() => {
            task()
        }, 5000)
    })
}

/**
 * 创建下载队列
 */

var bag = new Bagpipe(speed, { timeout: 1000 })

function task() {
    for (const mapstyle of mapstyles) {
        for (let z = 0; z <= all.length - 1; z++) {
            for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
                for (let y = all[z].y[0]; y <= all[z].y[1]; y++) {
                    // 将下载任务推入队列
                    ++sum
                    bag.push(download, x, y, all[z].t, mapstyle)
                }
            }
        }
    }
}



/**
 * 下载图片方法
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @param {Number} mapstyle 
 */
function download(x, y, z, mapstyle) {
    fs.stat(`${zpath}/${mapstyle}/${z}/${x}/${y}.png`, (err, stats) => {
        if (err || stats.size == 0) {
            // 文件不存在 或者 文件大小为零
            var ts = Math.floor(Math.random() * 5) //随机生成0-7台服务器
            let imgurl = `http://t${ts}.tianditu.gov.cn/DataServer?T=${mapstyle}&x=${x}&y=${y}&l=${z}&tk=${token}`;
            var ip = Math.floor(Math.random() * 256) //随机生成IP迷惑服务器
                +
                "." + Math.floor(Math.random() * 256) +
                "." + Math.floor(Math.random() * 256) +
                "." + Math.floor(Math.random() * 256)
            var v = Math.floor(Math.random() * 9)
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
                res.data.pipe(fs.createWriteStream(`${zpath}/${mapstyle}/${z}/${x}/${y}.png`).on('finish', () => {
                    --sum
                    console.log(`图片下载成功:${zpath}/${mapstyle}/${z}/${x}/${y}.png,目前下载数量` + ++requestTotal);
                }).on('error', (err) => {
                    --sum
                    console.log('写入发生异常');
                    appendLog('writeErr', {
                        err: err,
                        num: sum,
                        downloadNum: requestTotal,
                        options: options,
                        mapstyle: mapstyle,
                        z: z,
                        x: x,
                        y: y
                    }, date)
                    // process.exit(1)
                }))
            }).catch(err => {
                --sum
                console.log('请求异常:' + err);
                appendLog('requestErr', {
                    err: err,
                    num: sum,
                    downloadNum: requestTotal,
                    options: options,
                    mapstyle: mapstyle,
                    z: z,
                    x: x,
                    y: y
                }, date)
                // process.exit(1)
            });
        } else {
            // 文件存在跳过
            console.log('跳过:' + --sum)
        }
    })
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
    let text = currentDate.toLocaleString() + '\n' + cusid + '\n' + JSON.stringify(body) + '\n';
    let supplementTest = JSON.stringify({
        mapstyle: body.mapstyle,
        z: body.z,
        x: body.x,
        y: body.y
    }) + '\n';

    let logFile = "./log/log_" + year + '_' + month + '_' + day + '_' + date + ".txt"; // 标准日志文件
    let supplementFile = "./log/log_" + year + '_' + month + '_' + day + '_' + date + "_supplement_urlLists.txt"; // 修复补全文件
    //存在则追加，不存在则新建
    if (fs.existsSync(logFile)) {
        // 防止单日志文件大小过大
        if (fs.statSync(logFile).size > 102400) process.exit(1);
        fs.appendFile(logFile, text, (error) => {});
        fs.appendFile(supplementFile, supplementTest, (error) => {});
    } else {
        console.log('该路径不存在');
        fs.writeFile(logFile, text, (error) => {});
        fs.writeFile(supplementFile, supplementTest, (error) => {});
    }
}

fs.mkdir('./log', null, (error) => {});
mainnAllXY(bou, Minlevel, Maxlevel)