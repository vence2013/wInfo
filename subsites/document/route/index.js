const Router = require('koa-router');
var router = new Router();


router.get('/', async (ctx) => {
    /* 提取有效参数 */
    var req2  = ctx.query;
    var tag = req2.tag;

    var preset = '';
    if (tag)
    {
        preset += 'tag:'+tag;
    }
    await ctx.render('subsites/document/view/index.html', {'preset':preset}); 
})

/* 编辑页 */
router.get('/edit/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('subsites/document/view/edit.html', {'id':docid}); 
});

/* 显示页 */
router.get('/display/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('subsites/document/view/display.html', {'id':docid}); 
});


router.post('/:docid', async (ctx)=>{
    const TagCtrl = ctx.controls['tag/tag'];
    const DocumentCtrl = ctx.controls['document/document'];

    /* 提取有效参数 */
    var req = ctx.request.body;    
    var tags = req.tags;
    var content = req.content;

    var req2= ctx.params;
    var docid= parseInt(req2.docid);

    /* 查找&添加标签 */
    var tagInstances = await TagCtrl.create(ctx, tags);

    var ret = await DocumentCtrl.edit(ctx, docid, content, tagInstances);
    if (ret > 0)  ctx.body = {'error':  0, 'message': ret};
    else          ctx.body = {'error': -1, 'message': '文档编辑失败，请联系管理员！'};
});


/* 删除文档， 只有登录用户可以执行 */
router.delete('/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    var req2 = ctx.params;
    var docid = parseInt(req2.docid);
    
    await DocumentCtrl.delete(ctx, docid);

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});

/* 获取文档的详细信息：文档信息， 关联标签列表 */
router.get('/detail/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    var req2= ctx.params;
    var docid= parseInt(req2.docid);

    var ret = await DocumentCtrl.detail(ctx, docid);
    if (ret)
        ctx.body = {'error':  0, 'message': ret};
    else
        ctx.body = {'error': -1, 'message': '无效的文档！'};
})

router.get('/search', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];
    const common = ctx.controls['document/common'];
    
    /* 提取有效参数 */
    var req2  = ctx.query;
    var query = common.reqCheck(req2);

    var res = await DocumentCtrl.search(ctx, query);
    ctx.body = {'error': 0, 'message': res};
})


module.exports = router;