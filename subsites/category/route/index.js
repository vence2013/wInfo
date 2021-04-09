const Router = require('koa-router');
var router = new Router();


router.get('/', async (ctx)=>{
    await ctx.render('subsites/category/view/index.html'); 
})

router.get('/expand', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req = ctx.query;
    var expand_ids = [0];
    if (typeof(req.expand_ids) == 'object') {
        for (i = 0; i < req.expand_ids.length; i++)  expand_ids.push(parseInt(req.expand_ids[i]));
    } else if (req.expand_ids) {
        expand_ids.push(parseInt(req.expand_ids));
    }

    var tree = await CategoryCtrl.tree_with_expand(ctx, expand_ids);
    ctx.body = {'error': 0, 'message': tree};
})


module.exports = router;