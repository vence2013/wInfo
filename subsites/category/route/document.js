const Router = require('koa-router');
var router = new Router();

router.post('/:categoryid', async (ctx) => {
    const DocumentCtrl = ctx.controls['category/document'];

    /* 提取有效的参数 */
    var req = ctx.params;
    var categoryid = req.categoryid;

    var req  = ctx.request.body;
    var id   = req.id;
    var link = req.link; 

    var ret = await DocumentCtrl.relate(ctx, categoryid, link, [id]);
    ctx.body = {'error': 0, 'message': ret};
})

router.get('/:categoryid', async (ctx) => {
    const DocumentCtrl = ctx.controls['category/document'];

    var req = ctx.params;
    var categoryid = req.categoryid;

    var req2 = ctx.query;
    var str = req2.str; 
    var link = (req2.link === 'true') ? true : false;
    var page = /^\d+$/.test(req2.page) ? parseInt(req2.page) : 0;
    var size = /^\d+$/.test(req2.size) ? parseInt(req2.size) : 0;       

    if (str && /^[\s]*.+[\s]*$/.test(str))
    {
        str = str.replace(/[\s]+/, ' ') // 将多个空格替换为一个
                 .replace(/(^\s*)|(\s*$)/g, "") // 删除字符串首尾的空格
                 .split(' ');
    }

    var ret = await DocumentCtrl.resource(ctx, categoryid, str, link, page, size);
    ctx.body = {'error': 0, 'message': ret};
})


module.exports = router;