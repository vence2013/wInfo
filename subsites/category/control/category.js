const path = require('path');

/* 获取某个目录节点的子树数据，并以数组形式给出
 *    导出函数
 */
exports.get_sub_tree_nodes = get_sub_tree_nodes;
async function get_sub_tree_nodes(ctx, rootid) 
{
    const Category = ctx.models['Category'];

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
        return (a['order'] >= b['order']); 
    });

    return children;
}


/* 获取第1级目录及所有展开节点的目录树 */
exports.tree_with_expand = tree_with_expand;
async function tree_with_expand(ctx, ids_expand) 
{
    const Category = ctx.models['Category'];    

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

function build_tree_resource(nodes, father)
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
    {
        let sub = build_tree_resource(nodes2, children[j]['id']);
        children[j]['children'] = sub.concat(children[j]['res']);
    }        

    /* 为子节点排序 */
    children.sort((a, b)=> { 
        return (a['order'] >= b['order']); 
    });
 
    return children;
}

exports.tree_with_expand_resource = async (ctx, ids_expand) =>
{
    const File = ctx.models['File'];
    const Document = ctx.models['Document'];
    const Category = ctx.models['Category'];    

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

    /* 遍历查找所有目录的资源（document, file） */
    for (k = 0; k < nodes.length; k++)
    {
        let res = [];

        let docs = await Document.findAll({
            raw:true, logging:false, 
            include: [{
                model: Category,
                attributes: [],
                where: {'id':nodes[k]['id']}
            }]
        });
        docs.forEach(e => {
            var title = e.content.toString().replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];
            res.push({'id': e.id, 'father':nodes[k]['id'], 'name':title, 'type':'doc'});
        });

        var files = await File.findAll({
            raw:true, logging:false, 
            include: [{
                model: Category,
                attributes: [],
                where: {'id':nodes[k]['id']}
            }]
        });
        files.forEach(e => {
            let ext = path.extname(e.location);            
            res.push({'id': e.id, 'father':nodes[k]['id'], 'name':e.name, 'location':e.location, 'type':'file', 'ext':ext ? ext.substr(1) : ''});
        });

        nodes[k]['res'] = res;
    }    

    /* 构建树形结构 */
    return build_tree_resource(nodes, 0);
}