const Router = require('koa-router');
var router = new Router();


router.post('/apply', async (ctx, next) => {
    const filterCtrl = ctx.controls['fund/filter'];

    let req = ctx.request.body;
    let ret = await filterCtrl.apply(ctx, req);
    console.log(req, ret);

    ctx.body = {'error':0, 'message':ret};
});


module.exports = router;