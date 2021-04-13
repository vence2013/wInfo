const Router = require('koa-router');
var router = new Router();


router.get('/backup', async (ctx)=>{
    const systemCtrl = ctx.controls['system'];

    var req2 = ctx.query;
    var filename = req2.filename;

    systemCtrl.backup(filename);
    ctx.body = {'error':0, 'message': 'SUCCESS'};
})

router.get('/backup/status', async (ctx)=>{
    const systemCtrl = ctx.controls['system'];

    let ret = systemCtrl.backup_status()
    ctx.body = {'error':0, 'message':ret};
})

router.get('/backup/fileinfo', async (ctx)=>{
    const systemCtrl = ctx.controls['system'];

    var ret = await systemCtrl.backup_fileinfo();
    ctx.body = {'error':ret ? 0 : -1, 'message':ret};
})


module.exports = router;