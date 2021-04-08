const Router = require('koa-router');
var router = new Router();


router.get('/', async (ctx) => {
    await ctx.render('subsites/tag/view/index.html'); 
})

/* 搜索标签，参数为：{str, page, size } */
router.get('/search', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req = ctx.query;
    var str = req.str.replace(/^\s*(.*?)\s*$/, "$1"); // 去除首尾空格
    var page = /^\d+$/.test(req.page) ? req.page : 1;  // 当前的页面
    var size = /^\d+$/.test(req.size) ? req.size : 100; // 每页的记录条数

    var ret = await TagCtrl.search(ctx, str, page, size);
    ctx.body = {'error': 0, 'message': ret};
})

router.get('/check/:str', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req  = ctx.params;
    var tags = req.str.split(',');
    var ret = await TagCtrl.check(ctx, tags);
    ctx.body = {'error': 0, 'message': ret};
});


module.exports = router;