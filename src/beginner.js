const http = require('http') //http模块
const fs = require("fs") //fs模块
const cheerio = require('cheerio') //cheerio模块
const chapterUrl = `http://www.jinyongwang.com/tian/` //目标页面的url
const pageUrlPre = `http://www.jinyongwang.com`
const dist = `./dist/beginner/` //保存路径

//异步事件，采用async/await来处理
async function getArticle() {
    const chapters = await getPage(chapterUrl,getChapters)
    for(let i=0,len=chapters.length;i<len;i++){
        const content = await getPage(`${pageUrlPre}${chapters[i]}`, getContent)
         saveFile(content)
    }
}

//获取页面内容，由于不同页面处理方式不同，因此支持自定义callback函数
const getPage = (url, callback) => new Promise(resolve => {
    http.get(url, function(res) {
        let html = '';
        res.setEncoding('utf8');
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

const getChapters = (html)=>{
   if (html) {
        const $ = cheerio.load(html);
        const anchors = $(".mlist a")
        const lists = Array.prototype.slice.call(anchors).map((a) => $(a).attr("href"))
        return lists
    } else {
        console.log('无数据传入！');
    } 
}

//页面结构不同，采用的提取方式也不同。爬虫程序最灵活的部分
const getContent = (html) => {
    if (html) {
        const $ = cheerio.load(html);
        const title = $("h1.title").text().replace(/，/g, ',').replace(/　/g, ' ');
        const paragraph = $('.vcon p');
        const text = Array.prototype.slice.call(paragraph).reduce((a, b, c, d) => `${a}<p>${$(b).text()}</p>`, '')
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
    fs.writeFile(`${dist}${data.title}.html`, data.text, (err) => {
        if (err) throw err;
        console.log('文件已成功保存!');
    });
}

getArticle()