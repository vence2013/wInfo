const Router = require('koa-router');
var router = new Router();


router.post('/', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    var req = ctx.request.body;
    console.log(req);
    var cat = req.name;

    //var ret = await CategoryCtrl.create(ctx, father, name);
    if (ret) ctx.body = {'error':  0, 'message': ret};
    else     ctx.body = {'error': -1, 'message': '添加失败！'};
})


module.exports = router;