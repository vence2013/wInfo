exports.create = async (ctx, fid, name) => {    
    const Category = ctx.models['Category'];

    /* 新增目录自动排序到最后 */
    let cnt = await Category.count({
        raw: true, logging:false,
        where: {'father': fid}
    });

    var [ins, created] = await Category.findOrCreate({
        logging:false, 
        where: {'name':name, 'father':fid, 'order':cnt+1}
    });

    return ins.get({plain: true});
}

/* 编辑目录 */
exports.edit = async (ctx, id, fid, name, order) => {
    const Category = ctx.models['Category'];
    
    if (order == 0) {
        let cnt = await Category.count({
            raw: true, logging:false,
            where: {'father': fid}
        });

        order = cnt;  // 排序设置为最后
    }

    await  Category.update({
        'father':fid, 'name':name, 'order':order
    }, {
        logging: false, 
        where: {'id': id}
    });

    return await Category.findOne({
        raw:true, logging:false, 
        where:{'id':id} 
    });
}

/* 查找并删除子树所有节点 */
exports.delete = async (ctx, id)=>{
    const Category = ctx.models['Category'];
    const CategoryCtrl = ctx.controls['category/category'];
    var ids = [ id ];

    var list = await CategoryCtrl.get_sub_tree_nodes(ctx, id);
    for (var i in list) 
        ids.push(list[i]['id']);

    await Category.destroy({
        logging: false, 
        where: {'id': ids}
    });
}