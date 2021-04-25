const Router = require('koa-router');
var router = new Router();

const config = require('../scripts/config.json');

router.get('/config', async (ctx, next) => {
    ctx.body = {'error':0, 'message':config.urls};
});

router.get('/info/:code', async (ctx, next) => {
    const fundCtrl = ctx.controls['fund/fund'];

    let req = ctx.params;
    let code= parseInt(req.code);
    let req2 = ctx.query;
    let type = req2.type;
    
    let ret = await fundCtrl.get(ctx, type, code);
    ctx.body = {'error':0, 'message':ret};
});


module.exports = router;