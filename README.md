# node-get-tianditu

利用nodejs爬取天地图各个类型的瓦片数据下载至本地

并且通过修改后的`天地图JavaScript API 4.0`去加载地图

`./tiandituMap.js`是修改后的源码

里面正常请求天地图的地址全部替换成了

网站根路径+`/changeTianDiTuUrl/${mapstyle}/${z}/${x}/${y}` 

对应下载文件夹 `./test/${mapstyle}/${z}/${x}/${y}`

需要替换后自行经过后台处理至正确的文件路径
