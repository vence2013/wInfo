const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const fssync = require('fs-sync');
const moment = require('moment');
const Router = require('koa-router');
var router = new Router();


/* 导出筛选出来的文档 */
router.get('/', async (ctx) => 
{
    const DocumentCtrl = ctx.controls['document/document'];
    const common = ctx.controls['document/common'];
    const exportdir = '/data/export/';

    /* 提取有效参数 */
    var req2  = ctx.query;
    var query = common.reqCheck(req2);

    // 搜索符合条件的文档
    var doclist = await DocumentCtrl.searchall(ctx, query);

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

    shelljs.exec('/web/script/export_prepare.sh');
    
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
    var tarfile = '/data/export-'+datestr+'.tgz';
    shelljs.exec('tar -zvcf '+tarfile+' -C '+exportdir+' .');
    
    // 生成打包文件
    ctx.body = {'error': 0, 'message': tarfile};
})


router.get('/all', async (ctx)=>{
    const exportCtrl = ctx.controls['document/export'];

    exportCtrl.state_reset();
    let ret = await exportCtrl.export_start(ctx);
    ctx.body = {'error':0, 'message':ret};
})

router.get('/state', async (ctx) => 
{
    const exportCtrl = ctx.controls['document/export'];

    let ret = exportCtrl.state_get();
    ctx.body = {'error':0, 'message':ret};
})


module.exports = router;