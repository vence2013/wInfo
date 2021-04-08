const Router = require('koa-router');
var router = new Router(); 


router.post('/:chipid', async (ctx, next)=>{
    const ModuleCtrl = ctx.controls['chip/module'];

    /* 提取有效参数 */
    var req  = ctx.request.body;
    var req2 = ctx.params;
    var chipid = /^\d+$/.test(req2.chipid) ? parseInt(req2.chipid) : 0;
    var moduleid = /^\d+$/.test(req.id) ? parseInt(req.id) : 0;
    var name = req.name;
    var fullname = req.fullname;

    if (!chipid || !name) {
        ctx.body = {'error': -1, 'message': '无效的参数'};
    } else {
        var ret = await ModuleCtrl.edit(ctx, chipid, moduleid, name, fullname);
        switch (ret) {
            case -1: ctx.body = {'error': -2, 'message': '无效的模块！'}; break;
            case -2: ctx.body = {'error': -3, 'message': '无效的芯片！'}; break;
            case -3: ctx.body = {'error': -4, 'message': '该模块已经存在！'}; break;
            default: ctx.body = {'error': 0, 'message': 'SUCCESS'};
        }
    }
});


router.delete('/:moduleid', async(ctx, next)=>{
    const ModuleCtrl = ctx.controls['chip/module'];
    
    var req2 = ctx.params;
    var moduleid = /^\d+$/.test(req2.moduleid) ? parseInt(req2.moduleid) : 0;
    
    await ModuleCtrl.delete(ctx, moduleid);
    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});


router.get('/chip/:chipid', async(ctx, next)=>{
    const ModuleCtrl = ctx.controls['chip/module'];
    
    var req2 = ctx.params;
    var chipid = /^\d+$/.test(req2.chipid) ? parseInt(req2.chipid) : 0;

    if (chipid) {
        var ret = await ModuleCtrl.list(ctx, chipid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的芯片参数！'};
    }
});


router.get('/:moduleid', async(ctx, next)=>{
    const ModuleCtrl = ctx.controls['chip/module'];
    
    var req2 = ctx.params;
    var moduleid = /^\d+$/.test(req2.moduleid) ? parseInt(req2.moduleid) : 0;

    if (moduleid) {
        var ret = await ModuleCtrl.detail(ctx, moduleid);
        ctx.body = {'error': 0, 'message': ret};
    } else {
        ctx.body = {'error': -1, 'message': '无效的芯片参数！'};
    }
});


module.exports = router;