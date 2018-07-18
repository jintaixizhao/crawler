const http = require('http') //http模块
const fs = require("fs") //fs模块
const cheerio = require('cheerio') //cheerio模块
const path = require('path') //path模块
const url = `http://www.jinyongwang.com/tian/686.html` //目标页面的url
const dist = path.resolve(__dirname, `../dist/simple/`) //保存路径

//异步事件，采用async/await来处理
async function getArticle() {
    const content = await getPage(url, getContent)
    //虽然也是异步事件，但由于是最后一步，所以无需await
    saveFile(content)
}

//获取页面内容，由于不同页面处理方式不同，因此支持自定义callback函数
const getPage = (url, callback) => new Promise(resolve => {
    http.get(url, function(res) {
        let html = '';
        res.setEncoding('utf8'); //要设置字符编码格式，不然可能会有乱码
        res.on('data', function(data) {
            html += data
        });
        res.on('end', function() {
            const links = callback(html);
            //resolve的参数就是await处函数返回的值
            resolve(links)
        });
    }).on('error', function() {
        console.log('获取数据出错！');
    });
})

//页面结构不同，采用的提取方式也不同。爬虫程序最灵活的部分
const getContent = (html) => {
    if (html) {
        const $ = cheerio.load(html);
        const title = $("h1.title").text().replace(/，/g, ',').replace(/　/g, ' ');
        const paragraph = $('.vcon p');
        const text = Array.prototype.slice.call(paragraph).reduce((a, b, c, d) => `${a}<p>${$(b).text()}</p>`, '')
        //text = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Document</title><style>body{width:800px;margin:0 auto}p{text-indent:2em}</style></head><body>${text}</body></html>`
        return { title, text }
    } else {
        console.log('无数据传入！');
    }
}

//保存文件
const saveFile = (data) => {
    if (!data.title) {
        return false
    }
    //如果不存在保存路径，则立即新建
    if (!fs.existsSync(dist)) {
        fs.mkdirSync(dist);
    }
    fs.writeFile(`${dist}/${data.title}.html`, data.text, (err) => {
        if (err) throw err;
        console.log('文件已成功保存!');
    });
}

getArticle()