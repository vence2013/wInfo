const Router = require('koa-router');
const shell = require('shelljs');
const fssync = require('fs-sync');
const moment = require('moment');
var router = new Router();


router.get('/', async (ctx) => {
    /* 提取有效参数 */
    var req2  = ctx.query;
    var tag = req2.tag;

    var preset = '';
    if (tag)
    {
        preset += 'tag:'+tag;
    }
    await ctx.render('subsites/document/view/index.html', {'preset':preset}); 
})

/* 编辑页 */
router.get('/edit/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('subsites/document/view/edit.html', {'id':docid}); 
});

/* 显示页 */
router.get('/display/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('subsites/document/view/display.html', {'id':docid}); 
});


router.post('/:docid', async (ctx)=>{
    const TagCtrl = ctx.controls['tag/tag'];
    const DocumentCtrl = ctx.controls['document/document'];

    /* 提取有效参数 */
    var req = ctx.request.body;    
    var tags = req.tags;
    var content = req.content;

    var req2= ctx.params;
    var docid= parseInt(req2.docid);

    /* 查找&添加标签 */
    var tagInstances = await TagCtrl.create(ctx, tags);

    var ret = await DocumentCtrl.edit(ctx, docid, content, tagInstances);
    if (ret > 0)  ctx.body = {'error':  0, 'message': ret};
    else          ctx.body = {'error': -1, 'message': '文档编辑失败，请联系管理员！'};
});


/* 删除文档， 只有登录用户可以执行 */
router.delete('/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    var req2 = ctx.params;
    var docid = parseInt(req2.docid);
    
    await DocumentCtrl.delete(ctx, docid);

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});

/* 获取文档的详细信息：文档信息， 关联标签列表 */
router.get('/detail/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    var req2= ctx.params;
    var docid= parseInt(req2.docid);

    var ret = await DocumentCtrl.detail(ctx, docid);
    if (ret)
        ctx.body = {'error':  0, 'message': ret};
    else
        ctx.body = {'error': -1, 'message': '无效的文档！'};
})


function reqCheck(req2) {
    var query = {};

    query['page']     = parseInt(req2.page);
    query['size'] = parseInt(req2.size);
    query['tag'] = req2.tag;
    // 以空格分开的字符串
    var fields = ['str'];
    for (var i=0; i<fields.length; i++) {
        var key   = fields[i];
        var value = req2[key];
        // 检查是否含有效字符
        if (!value || !/^[\s]*.+[\s]*$/.test(value)) continue;
        query[key] = value.replace(/[\s]+/, ' ') // 将多个空格替换为一个
                          .replace(/(^\s*)|(\s*$)/g, "") // 删除字符串首尾的空格
                          .split(' ');
    }
    // 日期格式
    var dateExp = new RegExp(/^\d{4}(-)\d{1,2}\1\d{1,2}$/);
    if (req2.createget && dateExp.test(req2.createget)) { query['createget'] = req2.createget; }
    if (req2.createlet && dateExp.test(req2.createlet)) { query['createlet'] = req2.createlet; }
    // 排序
    switch (req2.order) {
        case '2': query['order'] = ['createdAt', 'ASC']; break;
        default: query['order'] = ['createdAt', 'DESC'];
    }

    return query;
}

router.get('/search', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];
    
    /* 提取有效参数 */
    var req2  = ctx.query;
    var query = reqCheck(req2);

    var res = await DocumentCtrl.search(ctx, query);
    ctx.body = {'error': 0, 'message': res};
})

router.get('/export', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];
    const CategoryCtrl = ctx.controls['document/category'];
    
    /* 提取有效参数 */
    var req2  = ctx.query;
    var query = reqCheck(req2);
    var categoryid = parseInt(req2.categoryid);

    // 搜索符合条件的文档
    var doclist = [];
    if (categoryid) 
        doclist = await CategoryCtrl.inall(ctx, categoryid, query);
    else 
        doclist = await DocumentCtrl.searchall(ctx, query);

    /* 提取文档中的文件，并更新文档中的文件路径 */
    var filelist = [];
    for (var i=0; i<doclist.length; i++) {
        var content = doclist[i]['content'];
        var arr = content.match(/\[[^\]]*\]\(\/data\/upload\/[^\)]+\)/g);
        for (var j=0; arr && j<arr.length; j++) {     
            // 取出 ![](filepath)格式中的filepath       
            var url = arr[j].replace(/\[[^\]]*\]\(([^\)]+)\)/, "$1");
            filelist.push(url);
            // 替换content中的路径
            content = content.replace(url, url.substr(6));
        }
        doclist[i]['content'] = content;
    }

    function deleteall(path) {
        var files = [];
        if(fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function(file, index) {
                var curPath = path + "/" + file;
                if(fs.statSync(curPath).isDirectory()) { // recurse
                    deleteall(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    var datadir = '/data/';
    var exportdir = datadir+'export/';
    
    /* 清除上一次的导出文件， export/, export*.tgz */
    var list = fs.readdirSync(datadir);
    list.forEach(function(file) {
        var filepath = datadir + file;
        var stat = fs.statSync(filepath)
        if (stat && stat.isDirectory()) {
            // 删除 export/ 目录
            if (file == 'export') 
                deleteall(filepath);
        } else if (/^export.*\.tgz$/.test(file)) {
            fs.unlinkSync(filepath);
        }
    })
    // 重建 export/ 目录
    if (!fs.existsSync(exportdir))
        fssync.mkdir(exportdir);
    
    // 复制文件
    for (var i=0; i<filelist.length; i++) {
        var dst = exportdir+filelist[i].substr(6);
        var obj = path.parse(dst);
        // 如果目录不存在，则创建目录
        if (!fs.existsSync(obj.dir)) 
            fssync.mkdir(obj.dir);

        fssync.copy(filelist[i], dst);
    }

    // 输出文档
    for (var i=0; i<doclist.length; i++) {
        var content = doclist[i]['content'];
        /* 提取文章标题 
        * 1. 去除开头的#和换行符(\n)
        * 2. 查找下一个换行符前的字符串
        */
        var title   = content.replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];
        var filename = exportdir+title+'.md';
        fs.writeFileSync(filename, content);
    }

    var datestr =  moment().format("YYYYMMDD");
    var tarfile = datadir+'export-'+datestr+'.tgz';
    shell.exec('tar -zvcf '+tarfile+' -C '+exportdir+' . ');
    
    // 生成打包文件
    ctx.body = {'error': 0, 'message': tarfile};
})

module.exports = router;