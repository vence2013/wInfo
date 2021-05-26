exports.create = async (ctx, fid, name) => {    
    const Category = ctx.models['se_requirement_category'];

    var [ins, created] = await Category.findOrCreate({
        logging:false, 
        where: {'name':name, 'father':fid}
    });

    return ins.get({plain: true});
}

function build_tree(nodes, father)
{
    let i, j, nodes2 = [], children = [];

    /* 寻找该节点的子节点 */
    for (i = 0; i < nodes.length; i++) 
    {
        if (nodes[i]['father'] == father)
            children.push(nodes[i]);
        else
            nodes2.push(nodes[i]);
    }
    if (children.length == 0) return [];

    /* 递归子节点构建子树 */
    for (j = 0; j < children.length; j++) 
        children[j]['children'] = build_tree(nodes2, children[j]['id']);

    /* 为子节点排序 */
    children.sort((a, b)=> { 
        return (a['name'] > b['name']); 
    });

    return children;
}

/* 获取第1级目录及所有展开节点的目录树 */
exports.tree_with_expand = tree_with_expand;
async function tree_with_expand(ctx, rootid, ids_expand) 
{
    const Category = ctx.models['se_requirement_category'];    

    /* 剔除所有除了rootid的第1级节点 */
    if (rootid != 0)
    {
        let ret = await Category.findAll({
            raw:true, logging:false,
            attributes: ['id'],
            where: {'father':0}
        });
        console.log('tt', ret);
        /* 未完 */
    }
    ids_expand.push(rootid);

    /* 获取展开目录的2级子目录（ID）（为了正确显示） */
    var ids_sub = [].concat(ids_expand);
    for (i = 0; i < 2; i++) {
        let ret = await Category.findAll({
            raw:true, logging:false,
            attributes: ['id'],
            where: {'father': ids_sub}
        });

        for (j =0; ret && (j < ret.length); j++) 
            if (ids_sub.indexOf(ret[j]['id']) == -1) 
                ids_sub.push(ret[j]['id']);
    }

    /* 获取所有目录数据 */
    let nodes = await Category.findAll({
        raw:true, logging:false,
        where: {'id': ids_sub},
        order:[['updatedAt', 'ASC']]
    });

    /* 构建树形结构 */
    return build_tree(nodes, 0);
}

exports.edit = async (ctx, id, name) => 
{
    const Category = ctx.models['se_requirement_category'];

    await  Category.update({
        'name':name
    }, {
        logging: false, 
        where: {'id': id}
    });

    return await Category.findOne({
        raw:true, logging:false, 
        where:{'id':id} 
    });
}

/* 获取某个目录节点的子树数据，并以数组形式给出
 */
exports.get_sub_tree_nodes = get_sub_tree_nodes;
async function get_sub_tree_nodes(ctx, rootid) 
{
    const Category = ctx.models['se_requirement_category'];

    var list = await Category.findAll({
        raw: true, logging: false, 
        where: { 'father': rootid}
    });
    for (var i=0; i<list.length; i++) 
    {
        var sub = await get_sub_tree_nodes(ctx, list[i]['id']);
        list = list.concat(sub);
    }

    return list;
}

/* 查找并删除子树所有节点 */
exports.delete = async (ctx, id) =>
{
    const Category = ctx.models['se_requirement_category'];
    var ids = [ id ];

    var list = await get_sub_tree_nodes(ctx, id);
    for (var i in list) 
        ids.push(list[i]['id']);

    await Category.destroy({
        logging: false, 
        where: {'id': ids}
    });
}


exports.project = async (ctx) =>
{
    const Category = ctx.models['se_requirement_category'];

    var list = await Category.findAll({
        raw: true, logging: false, 
        where: { 'father':0}
    });

    return list;
}

async function tree_to_list(ctx, rootid, depth)
{
    const Category = ctx.models['se_requirement_category'];
    let list = [];

    let sub = await Category.findAll({
        raw: true, logging: false, 
        where: {'father':rootid}
    });
    if (sub.length == 0)
        return list;

    for (let i = 0; i < sub.length; i++)
    {
        let obj = {'id':sub[i]['id'], 'name':sub[i]['name'], 'depth':depth};
        list.push(obj);

        let ret = await tree_to_list(ctx, sub[i]['id'], depth + 1);
        if (ret.length > 0)
            list = list.concat(ret);
    }

    return list;
}

exports.category_list = async (ctx, prj) =>
{
    let ret = await tree_to_list(ctx, prj, 0);

    return ret;
}