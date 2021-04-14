const Router = require('koa-router');
var router = new Router();


router.get('/status', async (ctx)=>{
    const backupCtrl = ctx.controls['backup'];

    let ret = backupCtrl.backup_status()
    ctx.body = {'error':0, 'message':ret};
})

router.get('/info', async (ctx)=>{
    const backupCtrl = ctx.controls['backup'];

    var ret = await backupCtrl.backup_fileinfo();
    ctx.body = {'error':0, 'message':ret};
})

/* --------------------------- Backup -------------------------------------- */

router.get('/', async (ctx)=>{
    const backupCtrl = ctx.controls['backup'];

    var req2 = ctx.query;
    var filename = req2.filename;

    backupCtrl.backup(filename);
    ctx.body = {'error':0, 'message':'SUCCESS'};
})


/* ----------------------------- Restore ----------------------------------- */

/* 接收上传的备份文件 */
router.post('/restore', async (ctx, next) => {
    const backupCtrl = ctx.controls['backup'];

    var file = ctx.request.files.file;

    backupCtrl.backup_status_clear('Restore');
    await backupCtrl.upload(ctx, file);
    ctx.body = {'error':  0, 'message': 'SUCCESS'};
})

/* 触发后续的恢复过程 */
router.get('/restore', async(ctx, next) => {
    const backupCtrl = ctx.controls['backup'];

    var req2 = ctx.query;
    var filename = req2.filename;

    backupCtrl.restore(filename);
    ctx.body = {'error':0, 'message':'SUCCESS'};
})

module.exports = router;