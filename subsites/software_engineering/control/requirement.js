const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.create = async (ctx, id, title, req) => 
{    
    const Requirement = ctx.models['se_requirement'];

    if (req.updatedAt)
    {
        let items = {};

        items['title'] = title;
        items['desc']  = req.desc;
        items['comment']  = req.comment;
        items['importance'] = req.importance;
        items['sources'] = req.sources ? req.sources : '';
        
        let ins = await Requirement.update(items,{
            logging:false, 
            where:{'id':id}
        });
    } else {
        let items = {};

        items['title'] = title;
        items['desc']  = req.desc;
        items['comment']  = req.comment;
        items['importance'] = req.importance;
        items['sources'] = req.sources ? req.sources : '';

        let [ins, created] = await Requirement.findOrCreate({
            logging:false, 
            where: {'id':id, 'category_id':req.category},
            defaults: items
        });

        if (!created)  return ;
    }

    return await Requirement.findOne({
        raw:true, logging:false,
        where:{'id':id}
    });
}

exports.delete = async(ctx, id) =>
{
    const Requirement = ctx.models['se_requirement'];

    await Requirement.destroy({
        logging: false, 
        where:{'id': id}
    });
}

exports.search = async (ctx, category, ids, str, page) => 
{
    const Requirement = ctx.models['se_requirement'];
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];
    let where_cond = {};

    /* 获取该节点的所有子节点 */
    let subs = await CategoryCtrl.get_sub_tree_nodes(ctx, category);
    let cat_ids = [category];
    for (let i = 0; i < subs.length; i++)
        cat_ids.push(subs[i]['id']);

    where_cond['category_id'] = cat_ids;

    /* {'id': {
     *   [Op.or]:[
     *     {[Op.like]: '%x%'}, 
     *     ...
     *    ]
     * }} 
     */
    let id_objs = [];
    for (let i = 0; i < ids.length; i++)
        id_objs.push({[Op.like]: '%'+ids[i]+'%'});
    where_cond['id'] = {[Op.or]:id_objs};

    /* {[Op.and]:[
     *   {[Op.or]:[
     *     {'title':{[Op.like]:'%x%'}},
     *     {'desc':{[Op.like]:'%x%'}},
     *     {'comment' :{[Op.like]:'%x%'}},
     *   ]},
     *   ...
     * ]}
     */
    let str_objs = [];
    for (let i = 0; i < str.length; i++)
        str_objs.push({[Op.or]: [
            {'title'  :{[Op.like]:'%'+str[i]+'%'}}, 
            {'desc'   :{[Op.like]:'%'+str[i]+'%'}}, 
            {'comment':{[Op.like]:'%'+str[i]+'%'}}
        ]});
    where_cond[Op.and] = str_objs;

    let ret = await Requirement.findAll({
        raw:true, logging:false,
        where:where_cond,
        order:[['updatedAt', 'DESC']],
        limit: page
    });

    /* 将数组转换为字符串 */
    for (let i = 0; i < ret.length; i++)
    {
        ret[i]['desc'] = ret[i]['desc'] ? ret[i]['desc'].toString() : '';
        ret[i]['comment'] = ret[i]['comment'] ? ret[i]['comment'].toString() : '';
    }

    return ret;
}

exports.get_by_ids = async (ctx, ids) => 
{
    const Requirement = ctx.models['se_requirement'];

    let ret = await Requirement.findAll({
        raw:true, logging:false,
        where:{[Op.or]:ids}
    });

    /* 转换desc和comment为字符串 */
    for (let i = 0; i < ret.length; i++)
    {
        ret[i]['desc'] = ret[i]['desc'].toString();
        ret[i]['comment'] = ret[i]['comment'].toString();
    }

    return ret;
}


exports.get_view_data = async (ctx, id_prj) =>
{
    const Requirement = ctx.models['se_requirement'];
    const Category = ctx.models['se_requirement_category'];

    /* 按深度搜索目录（广度搜索） */
    let fathers = [id_prj];
    let category_all = [ id_prj ];
    let category_of_depth = [];
    for (let depth = 0; fathers.length > 0; depth++)
    {
        let ret = await Category.findAll({
            raw:true, logging:false,
            where:{'father':fathers}
        });

        fathers = [];
        for (let i = 0; i < ret.length; i++)
            fathers.push(ret[i]['id']);

        if (fathers.length == 0)
            break;
        else 
        {
            category_of_depth[ depth ] = ret;
            category_all = category_all.concat(fathers);
        }
    }

    /* 搜索所有需求 */
    let nodes_org = await Requirement.findAll({
        raw:true, logging:false,
        where:{'category_id':category_all}
    });
    let nodes = [];
    let nodes_idx = [];
    for (let i = 0; i < nodes_org.length; i++)
    {
        nodes_idx.push(nodes_org[i]['category_id']+'/'+nodes_org[i]['id']);
        nodes.push({
            'name':nodes_org[i]['id'], 
            'label':nodes_org[i]['title'], 
            'category_id':nodes_org[i]['category_id'], 
            'importance':nodes_org[i]['importance']
        });
    }

    /* 查找该目录包含的子目录 
     * 1. 查找该目录的深度
     * 2. 在下一个深度查找该目录的子目录
     * 3. 在目录列表中查找对应的索引
     */
    function sub_categories(cat_id)
    {
        let depth = -1;

        for (let i = 0; (i < category_of_depth.length) && (depth == -1); i++)
            for (let j = 0; j < category_of_depth[i].length; j++)
            {
                if (category_of_depth[i][j]['id'] != cat_id) continue;
                depth = i;
                break;
            }

        if ((depth == -1) || (depth >= (category_of_depth.length - 1)))
            return [];

        // 2
        let subs = [];
        depth++;
        for (let i = 0; i < category_of_depth[depth].length; i++)
            if (category_of_depth[depth][i]['father'] == cat_id)
                subs.push(category_of_depth[depth][i]['id']);
        
        return subs;
    }

    /* 构造分组 */
    let groups = [];
    let category_no_root = [].concat(category_all);
    category_no_root.shift();

    for (let i = 0; i < category_no_root.length; i++)
    {
        let id  = category_no_root[i];
        let obj = {};

        /* 查找属于该目录的节点 */
        let leaves = [];
        let ret = await Requirement.findAll({
            raw:true, logging:false,
            attributes:['id'], 
            where:{'category_id':id}
        });
        for (let j = 0; j < ret.length; j++)
        {
            let v = id+'/'+ret[j]['id'];
            leaves.push(nodes_idx.indexOf(v));
        }
            
        if (leaves.length > 0)
            obj['leaves'] = leaves;

        let sub = sub_categories(id);

        let sub_groups = [];
        for (let j = 0; j < sub.length; j++)
        {
            let idx = category_no_root.indexOf(sub[j]);

            sub_groups.push(idx);
        }
        if (sub_groups.length > 0)
            obj['groups'] = sub_groups;

        if (obj['leaves'] || obj['groups'])
            groups.push(obj);
    }

    /* 查找连接 */
    let links = [];
    for (let i = 0; i < nodes_org.length; i++)
    {
        let src = nodes_org[i]['sources'];

        if (!src) continue;
        let arr = src.trim().replace(/\s+/g, ' ').split(' ');
        for (let j = 0; j < arr.length; j++)
        {
            let idx = nodes_idx.indexOf(arr[j]);
            if (idx != -1)
                links.push({'source':i, 'target':idx});
        }        
    }

    return {'nodes':nodes, 'links':links, 'groups':groups};
}