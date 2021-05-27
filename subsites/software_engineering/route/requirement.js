const Router = require('koa-router');
var router = new Router();


router.post('/', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    let req = ctx.request.body;
    let id = req.id.trim();
    let title = req.title.trim();

    let ret = await requirementCtrl.create(ctx, id, title, req);
    if (ret) ctx.body = {'error':  0, 'message': ret};
    else     ctx.body = {'error': -1, 'message': '添加失败！'};
})

router.get('/', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    let req = ctx.query;
    let page = parseInt(req.page);
    let category = parseInt(req.category);
    let ids = req.ids.replace(/\s+/g, ' ').split(' ');
    let str = req.str.replace(/\s+/g, ' ').split(' ');    

    let ret = await requirementCtrl.search(ctx, category, ids, str, page);
    ctx.body = {'error': 0, 'message': ret};
})

router.get('/ids', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    /* 提取有效的参数 */
    let req = ctx.query;

    let ids = [];
    /* 分割category_id, id */
    for (k in req) 
    {
        let ret = req[k].split('/');
        ids.push({'category_id':ret[0], 'id':ret[1]});
    }        

    let ret = await requirementCtrl.get_by_ids(ctx, ids);
    ctx.body = {'error': 0, 'message': ret};
})

router.delete('/:id', async (ctx) =>
{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    var req2 = ctx.params;
    var id = req2.id;
    
    await requirementCtrl.delete(ctx, id);

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});

router.get('/view/:id_prj', async (ctx)=>{
    const requirementCtrl = ctx.controls['software_engineering/requirement'];

    var req2 = ctx.params;
    var id_prj = req2.id_prj;

    /*
    let ret = {
        "nodes":[
          {"name":"a","width":60,"height":40},
          {"name":"b","width":60,"height":40},
          {"name":"c","width":60,"height":40},
          {"name":"d","width":60,"height":40},
          {"name":"e","width":60,"height":40},
          {"name":"f","width":60,"height":40},
          {"name":"g","width":60,"height":40}
        ],
        "links":[
          {"source":1,"target":2},
          {"source":2,"target":3},
          {"source":3,"target":4},
          {"source":0,"target":1},
          {"source":2,"target":0},
          {"source":3,"target":5},
          {"source":0,"target":5}
        ],
        "groups":[
          {"leaves":[0], "groups":[1]},
          {"leaves":[1,2]},
          {"leaves":[3,4]}
        ]
    };
    */
    let ret = await requirementCtrl.get_view_data(ctx, id_prj);
    ctx.body = {'error': 0, 'message': ret};
})


module.exports = router;