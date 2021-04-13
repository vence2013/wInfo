const Router = require('koa-router');
var router = new Router();


router.get('/', async (ctx) => {
    await ctx.render('subsites/file/view/index.html'); 
})

router.post('/upload', async (ctx, next) => {
    const TagCtrl = ctx.controls['tag/tag'];
    const FileCtrl = ctx.controls['file/file'];

    var req = ctx.request.body;
    var tags = req.tags ? JSON.parse(req.tags) : [];

    /* 新版本的koa-body通过ctx.request.files获取上传的文件，旧版本的koa-body通过ctx.request.body.files获取上传的文件 
     * https://blog.csdn.net/simple__dream/article/details/80890696
     */
    var file = ctx.request.files.file;

    // 添加标签
    var tagInstances = await TagCtrl.create(ctx, tags);
    var ret = await FileCtrl.create(ctx, file, tagInstances);
    if (ret)
        ctx.body = {'error':  0, 'message': 'SUCCESS'};
    else
        ctx.body = {'error': -1, 'message': '上传失败，文件已存在！'};
});


router.post('/tag/link', async (ctx, next)=>{
    const TagCtrl = ctx.controls['tag/tag'];
    const FileCtrl = ctx.controls['file/file'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var tag = req.tag;
    var fileids = req.fileids;

    var tagInstance = await TagCtrl.get(ctx, tag);
    await FileCtrl.tag_link(ctx, fileids, tagInstance);
    ctx.body = {'error':  0, 'message': 'SUCCESS'};
});

router.post('/tag/unlink', async (ctx, next)=>{
    const TagCtrl = ctx.controls['tag/tag'];
    const FileCtrl = ctx.controls['file/file'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var tag = req.tag;
    var fileids = req.fileids;

    var tagInstance = await TagCtrl.get(ctx, tag);
    await FileCtrl.tag_unlink(ctx, fileids, tagInstance);
    ctx.body = {'error':  0, 'message': 'SUCCESS'};
});

router.delete('/', async (ctx, next)=>{
    const FileCtrl = ctx.controls['file/file'];

    /* 提取有效参数 */
    var req = ctx.query;
    var fileids = req.fileids;

    await FileCtrl.delete(ctx, fileids);
    ctx.body = {'error': 0, 'message': 'SUCCESS'};
})


// 根据以下参数搜索文件： 名称，描述，有效标签， 扩展名， 文件大小范围， 创建日期范围
router.get('/search', async (ctx, next)=>{
    const FileCtrl = ctx.controls['file/file'];
    var query = {};

    /* 提取有效参数 */
    var req2  = ctx.query;
    var page     = parseInt(req2.page);
    var pageSize = parseInt(req2.pageSize); 
    
    query['tag'] = req2.tag;
    query['with_tag'] = (!req2.with_tag || (req2.with_tag == 'false')) ? false : true;
    ['str', 'ext'].map((x) => {
        var value = req2[ x ]; 
        // 分割多个由空格隔开的字符串
        if (value && /^[\s]*.+[\s]*$/.test(value))
            query[ x ] = value.replace(/[\s]+/, ' ').replace(/(^\s*)|(\s*$)/g, "").split(' ');
    });

    ['sizeget','sizelet'].map((x) => {
        var value = req2[ x ];
        if (value && /^[\s]*[\d\.]*[\s]*$/.test(value))
        {
            // 将单位为MB的浮点数转换为字节数
            var size = parseFloat(value) ? parseFloat(value).toFixed(4) : 0;
            query[ x ] = parseInt(size*1024*1024);
        }
    });

    var dateExp = new RegExp(/^\d{4}(-)\d{1,2}\1\d{1,2}$/);
    if (req2.createget && dateExp.test(req2.createget)) { query['createget'] = req2.createget; }
    if (req2.createlet && dateExp.test(req2.createlet)) { query['createlet'] = req2.createlet; }
    switch (req2.order) {    
        case '1': query['order'] = ['size', 'ASC']; break;
        case '2': query['order'] = ['size', 'DESC']; break;
        case '3': query['order'] = ['createdAt', 'ASC']; break;
        default: query['order'] = ['createdAt', 'DESC'];
    }

    var res = await FileCtrl.search(ctx, query, page, pageSize);
    ctx.body = {'error': 0, 'message': res};
})

router.get('/detail/:fid', async (ctx, next)=>
{
    const FileCtrl = ctx.controls['file/file'];

    /* 提取有效参数 */
    var req2    = ctx.params;
    var fid  = req2.fid;
    
    var ret = await FileCtrl.detail(ctx, fid);
    ctx.body = {'error':0, 'message':ret};
})

module.exports = router;