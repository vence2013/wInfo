const Router = require('koa-router');
var router = new Router();


/* 导出筛选出来的文档 */
router.get('/', async (ctx) => 
{
    const exportCtrl = ctx.controls['document/export'];
    const DocumentCtrl = ctx.controls['document/document'];
    const common = ctx.controls['document/common'];

    /* 提取有效参数 */
    let req2  = ctx.query;
    let query = common.reqCheck(req2);

    // 搜索符合条件的文档
    let doclist = await DocumentCtrl.searchall(ctx, query);
    let tarfile = await exportCtrl.export_part(doclist);

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

router.get('/info', async (ctx)=>{
    const exportCtrl = ctx.controls['document/export'];

    var ret = await exportCtrl.export_file_info();
    ctx.body = {'error':0, 'message':ret};
})


module.exports = router;