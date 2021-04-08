const Router = require('koa-router');
var router = new Router(); 


router.post('/:moduleid', async (ctx, next)=>{
    const RegisterCtrl = ctx.controls['chip/register'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var req2= ctx.params;
    var moduleid   = /^\d+$/.test(req2.moduleid) ? parseInt(req2.moduleid) : 0;
    var registerid = /^\d+$/.test(req.id) ? parseInt(req.id) : 0;
    var name = req.name;
    var fullname = req.fullname;
    var address = /^0[xX]{1}[0-9a-fA-F]+$/.test(req.address) ? req.address.toLowerCase() : '';
    var desc = req.desc;

    if (!moduleid || !name || !address) {
        ctx.body = {'error': -1, 'message': '无效的参数！'};
    } else {
        ret = await RegisterCtrl.edit(ctx, moduleid, registerid, name, fullname, address, desc);
        switch (ret) {
            case -1: ctx.body = {'error': -2, 'message': '无效的寄存器！'}; break;
            case -2: ctx.body = {'error': -3, 'message': '无效的模块！'}; break;
            case -3: ctx.body = {'error': -4, 'message': '该寄存器已经存在！'}; break;
            default: ctx.body = {'error': 0, 'message': 'SUCCESS'};
        }
    }
});


router.delete('/:registerid', async(ctx, next)=>{
    const RegisterCtrl = ctx.controls['chip/register'];
    
    var req2 = ctx.params;
    var registerid = req2.registerid;
    
    await RegisterCtrl.delete(ctx, registerid);
    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});


router.get('/module/:moduleid', async(ctx, next)=>{
    const RegisterCtrl = ctx.controls['chip/register'];
    
    var req2 = ctx.params;
    var moduleid = /^\d+$/.test(req2.moduleid) ? parseInt(req2.moduleid) : 0;

    if (moduleid) {
        var ret = await RegisterCtrl.list(ctx, moduleid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的模块参数！'};
    }
});


router.get('/:registerid', async(ctx, next)=>{
    const RegisterCtrl = ctx.controls['chip/register'];
    
    var req2 = ctx.params;
    var registerid = /^\d+$/.test(req2.registerid) ? parseInt(req2.registerid) : 0;

    if (registerid) {
        var ret = await RegisterCtrl.detail(ctx, registerid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的模块参数！'};
    }
});


router.get('/map/:moduleid', async (ctx)=>{
    const RegisterCtrl = ctx.controls['chip/register'];
    
    var req2 = ctx.params;
    var moduleid = /^\d+$/.test(req2.moduleid) ? parseInt(req2.moduleid) : 0;

    if (moduleid) {
        var ret = await RegisterCtrl.map(ctx, moduleid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的模块参数！'};
    }
})


module.exports = router;