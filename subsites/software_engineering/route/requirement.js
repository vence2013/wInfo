const Router = require('koa-router');
var router = new Router();


router.post('/', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    let req = ctx.request.body;
    let id = req.id.trim();
    let title = req.title.trim();

    let ret = await requirementCtrl.create(ctx, id, title, req);
    if (ret) ctx.body = {'error':  0, 'message': ret};
    else     ctx.body = {'error': -1, 'message': '添加失败！'};
})

router.get('/', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    let req = ctx.query;
    let page = parseInt(req.page);
    let category = parseInt(req.category);
    let ids = req.ids.replace(/\s+/g, ' ').split(' ');
    let str = req.str.replace(/\s+/g, ' ').split(' ');    

    let ret = await requirementCtrl.search(ctx, category, ids, str, page);
    ctx.body = {'error': 0, 'message': ret};
})

router.get('/ids', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    let req = ctx.query;
    let ids = [];
    for (k in req) 
        ids.push(req[k]);

    let ret = await requirementCtrl.get_by_ids(ctx, ids);
    ctx.body = {'error': 0, 'message': ret};
})

router.delete('/:id', async (ctx) =>
{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    var req2 = ctx.params;
    var id = req2.id;
    
    await requirementCtrl.delete(ctx, id);

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});


module.exports = router;