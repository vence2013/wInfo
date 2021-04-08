const Router = require('koa-router');

var router = new Router(); 


router.post('/:registerid', async (ctx, next)=>{
    const BitgroupCtrl = ctx.controls['chip/bitgroup'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var req2= ctx.params;
    var registerid   = /^\d+$/.test(req2.registerid) ? parseInt(req2.registerid) : 0;
    var bitsid = /^\d+$/.test(req.id) ? parseInt(req.id) : 0;
    var name = req.name;
    var fullname = req.fullname;
    var rw = req.rw;
    var desc = req.desc;
    var bitlist = req.bitlist;
    var valuelist = req.valuelist;

    if (!registerid || !name || !rw || !bitlist || !valuelist) {
        ctx.body = {'error': -1, 'message': '无效的参数！'};
    } else {
        ret = await BitgroupCtrl.edit(ctx, registerid, bitsid, name, fullname, rw, desc, bitlist, valuelist);
        switch (ret) {
            case -1: ctx.body = {'error': -2, 'message': '无效的位组！'}; break;
            case -2: ctx.body = {'error': -3, 'message': '无效的寄存器！'}; break;
            case -3: ctx.body = {'error': -4, 'message': '该位组已经存在！'}; break;
            default: ctx.body = {'error': 0, 'message': 'SUCCESS'};
        }
    }
});


router.delete('/:bitsid', async(ctx, next)=>{
    const BitgroupCtrl = ctx.controls['chip/bitgroup'];
    
    var req2 = ctx.params;
    var bitsid = req2.bitsid;
    
    await BitgroupCtrl.delete(ctx, bitsid);
    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});


router.get('/register/:registerid', async(ctx, next)=>{
    const BitgroupCtrl = ctx.controls['chip/bitgroup'];
    
    var req2 = ctx.params;
    var registerid = /^\d+$/.test(req2.registerid) ? parseInt(req2.registerid) : 0;

    if (registerid) {
        var ret = await BitgroupCtrl.list(ctx, registerid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的模块参数！'};
    }
});


router.get('/:bitsid', async(ctx, next)=>{
    const BitgroupCtrl = ctx.controls['chip/bitgroup'];
    
    var req2 = ctx.params;
    var bitsid = /^\d+$/.test(req2.bitsid) ? parseInt(req2.bitsid) : 0;

    if (bitsid) {
        var ret = await BitgroupCtrl.detail(ctx, bitsid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的模块参数！'};
    }
});


module.exports = router;