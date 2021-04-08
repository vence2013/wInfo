const Router = require('koa-router');
var router = new Router();


router.post('/:chipid', async (ctx, next)=>{
    const ChipCtrl = ctx.controls['chip/chip'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var req2= ctx.params;
    var name  = req.name;
    var width = /^\d+$/.test(req.width) ? parseInt(req.width) : 0;
    var chipid= /^\d+$/.test(req2.chipid) ? parseInt(req2.chipid) : 0;

    if (width) 
    {
        var ret = await ChipCtrl.edit(ctx, chipid, name, width);

        switch (ret) {
            case -1: ctx.body = {'error': -2, 'message': '该芯片已经存在'}; break;
            default: ctx.body = {'error':  0, 'message': 'SUCCESS'}; 
        }
    } else {
        ctx.body = {'error':  -1, 'message': '芯片位宽必须大于零！'}; 
    }
});


router.delete('/:chipid', async(ctx, next)=>{
    const ChipCtrl = ctx.controls['chip/chip'];
    
    var req2 = ctx.params;
    var chipid = /^\d+$/.test(req2.chipid) ? parseInt(req2.chipid) : 0;
    
    await ChipCtrl.delete(ctx, chipid);
    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});


router.get('/', async(ctx, next)=>{
    const ChipCtrl = ctx.controls['chip/chip'];
    
    var ret = await ChipCtrl.get(ctx);
    ctx.body = {'error': 0, 'message': ret};
});


module.exports = router;