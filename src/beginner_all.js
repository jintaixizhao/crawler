const http = require('http') //http模块
const fs = require("fs") //fs模块
const cheerio = require('cheerio') //cheerio模块
const bookUrl = `http://www.jinyongwang.com/book/` //目标页面的url
const pageUrlPre = `http://www.jinyongwang.com`
const dist = `./dist/beginner_all/` //保存路径

//异步事件，采用async/await来处理
async function getArticle() {
    const books = await getPage(bookUrl,getBooks)
    for(let j=0,l=books.length;j<l;j++){
        const chapters = await getPage(`${pageUrlPre}${books[j][0]}`,getChapters)
        for(let i=0,len=chapters.length;i<len;i++){
            const content = await getPage(`${pageUrlPre}${chapters[i]}`, getContent)
            await saveFile(content,books[j][1])
        }
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

const getBooks= (html)=>{
   if (html) {
        const $ = cheerio.load(html);
        const anchors = $(".list").eq(1).find(".title a")
        const lists = Array.prototype.slice.call(anchors).map((a) => [$(a).attr("href"),$(a).text().slice(0,-2)])
        console.log(lists)
        return lists
    } else {
        console.log('无数据传入！');
    } 
}

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
const saveFile = (data,name) => {
    if (!data.title) {
        return false
    }
    const bookDist = `${dist}${name}/`
    //如果不存在保存路径，则立即新建
    if (!fs.existsSync(bookDist)) {
        fs.mkdirSync(bookDist);
    }
    fs.writeFile(`${bookDist}${data.title}.html`, data.text, (err) => {
        if (err) throw err;
        console.log(`${name}:${data.title}  已成功保存!`);
    });
}

getArticle()