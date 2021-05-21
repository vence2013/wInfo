const Router = require('koa-router');
var router = new Router();


router.post('/', async (ctx)=>{
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];

    /* 提取有效的参数 */
    var req = ctx.request.body;
    var name = req.name;
    var father  = req.father;

    var ret = await CategoryCtrl.create(ctx, father, name);
    if (ret) ctx.body = {'error':  0, 'message': ret};
    else     ctx.body = {'error': -1, 'message': '添加失败！'};
})

router.get('/project', async (ctx)=>{
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];

    var roots = await CategoryCtrl.project(ctx);
    ctx.body = {'error': 0, 'message': roots};
})

router.get('/category/:prj', async (ctx)=>{
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var prj = req2.prj;

    var list = await CategoryCtrl.category_list(ctx, prj);
    ctx.body = {'error': 0, 'message': list};
})

/* 获取目录树结构（已展开节点） */
router.get('/:rootid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var rootid = req2.rootid;

    var req = ctx.query;
    var expand_ids = [];
    if (typeof(req.expand_ids) == 'object') {
        for (i = 0; i < req.expand_ids.length; i++)  expand_ids.push(parseInt(req.expand_ids[i]));
    } else if (req.expand_ids) {
        expand_ids.push(parseInt(req.expand_ids));
    }

    var tree = await CategoryCtrl.tree_with_expand(ctx, rootid, expand_ids);
    ctx.body = {'error': 0, 'message': tree};
})

router.put('/:id', async (ctx)=>{
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var id = parseInt(req2.id);

    var req = ctx.request.body;
    var name   = req.name;
    
    var ret = await CategoryCtrl.edit(ctx, id, name);
    ctx.body = {'error':0, 'message':ret ? '修改失败！' : 'SUCCESS'};
})

router.delete('/:id', async (ctx)=>{
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;    
    var id = /^\d+$/.test(req2.id) ? req2.id : 0;

    await CategoryCtrl.delete(ctx, id);
    ctx.body = {'error': 0, 'message': "SUCCESS"};
})


module.exports = router;