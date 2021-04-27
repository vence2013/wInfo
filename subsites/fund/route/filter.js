const Router = require('koa-router');
var router = new Router();


router.post('/', async (ctx, next) => {
    const filterCtrl = ctx.controls['fund/filter'];

    let req = ctx.request.body;
    let title = req.title;
    let filter = req.filter;

    let ret = await filterCtrl.add(ctx, title, filter);

    ctx.body = {'error':0, 'message':'SUCCESS'};
});

router.get('/', async (ctx, next) => {
    const filterCtrl = ctx.controls['fund/filter'];

    let ret = await filterCtrl.list(ctx);
    ctx.body = {'error':0, 'message':ret};
});

router.get('/detail/:id', async (ctx, next) => {
    const filterCtrl = ctx.controls['fund/filter'];

    /* 提取有效参数 */
    let req = ctx.params;
    let id = req.id;

    let ret = await filterCtrl.detail(ctx, id);

    ctx.body = {'error':0, 'message':ret};
});

router.delete('/:id', async (ctx, next)=>{
    const filterCtrl = ctx.controls['fund/filter'];

    /* 提取有效参数 */
    let req = ctx.params;
    let id = req.id;
    await filterCtrl.delete(ctx, id);

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
})

router.post('/apply', async (ctx, next) => {
    const filterCtrl = ctx.controls['fund/filter'];

    let req = ctx.request.body;
    let ret = await filterCtrl.apply(ctx, req);

    ctx.body = {'error':0, 'message':ret};
});


module.exports = router;