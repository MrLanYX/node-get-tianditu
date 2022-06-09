# node-get-tianditu

> 利用nodejs爬取天地图各个类型的瓦片数据下载至本地,并且通过修改后的`天地图JavaScript API 4.0`去加载地图

## npm run dev

1. `./tiandituMap.js`是修改后的源码
    - 里面正常请求天地图的地址全部替换成了 --> 网站根路径+`/changeTianDiTuUrl/${mapstyle}/${z}/${x}/${y}` 
2. 对应下载文件夹 `./test/${mapstyle}/${z}/${x}/${y}`
    - 需要替换后自行经过后台处理至正确的文件路径
3. 优化使用
    - 异常停止运行
    - 跳过已存在文件
    - 空白文件重新下载

## npm run test

- 填写需要测试图片的 `mapstyles` `x` `y` `z`
- 运行查看结果
- 新增修复或补录能力 `date:2022-06-09 16:23:57`
  - 填写因为报错而产生的 `log_*_supplement_urlLists.txt` 文件地址
  - 根据 `txt` 文件中的参数尝试进行下载，并放入目标位置

## 建议

1. 确定好下载要求后层数最好分段下载，例：要下 `1-15` 层级，可以分成 `1-8`、`8-11`、`11-12`、`13-13`、`14-14`、`15-15` 多次下载。原因是 `token` 一天无法下载那么多，不分批次改区间，隔天检索跳过过多的重复文件需要花费过多时间
2. 上述每次分层的第一次建议把所有 `process.exit(1)` 注释掉，这是异常停止代码，通常异常了也许后面还能正常下载，先跑完全部队列。后后续下载再打开注释看异常情况
3. 要是不想看异常可以完全把 `process.exit(1)` 注释掉。放任它自行下载
4. 新增功能：可停用 `process.exit(1)` 功能，增加日志写入查看异常
5. 单次操作异常文件大于 `100Kb` 停止进程
6. **当需要跳过的文件占大多数，今日请求又会失败且并不是很多的情况下**，可以将限制文件大小而退出的 `process.exit(1)` 注释掉，生成改层级全部报错日志，利用 `npm run test` 跑日志记录完成剩余的文件，省去了每次跳过文件的时间