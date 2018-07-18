const request = require('request') //http模块
const fs = require("fs") //fs模块
const cheerio = require('cheerio') //cheerio模块
const path = require('path') //path模块
const url = `http://v.ifeng.com/video_18607230.shtml` //目标页面的url
const dist = path.resolve(__dirname, `../dist/video/`) //保存路径

//异步事件，采用async/await来处理
async function getImages() {
    const links = await getPage(url, getLinks)
    console.log(links);
    await downloadImg(links[0], new Date().getTime())
}

//获取页面内容，由于不同页面处理方式不同，因此支持自定义callback函数
const getPage = (url, callback) => new Promise(resolve => {
    request.get(url, function(err, res, body) {
        const links = callback(body);
        //resolve的参数就是await处函数返回的值
        resolve(links)
    }).on('error', function() {
        console.log('获取数据出错！');
    });
})

//页面结构不同，采用的提取方式也不同。爬虫程序最灵活的部分
const getLinks = (html) => {
    if (html) {
        const links = []
        html.replace(/"http.*?\.mp4"/g,m=>{
            links.push(m)
        })
        //const links = Array.prototype.slice.call(imgs).map((a) => $(a).attr('src'))
        return Array.from(new Set(links)).map(i=>i.slice(1,-1))
    } else {
        console.log('无数据传入！');
    }
}

const downloadImg = (url, name) => {
    if (!fs.existsSync(dist)) {
        fs.mkdirSync(dist);
    }
    request(url).pipe(fs.createWriteStream(`${dist}/${name}.mp4`))
    console.log("下载完毕");
}

getImages()