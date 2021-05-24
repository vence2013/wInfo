const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.create = async (ctx, id, title, req) => 
{    
    const Requirement = ctx.models['se_requirement'];

    if (req.updatedAt)
    {
        let items = {};

        items['title'] = title;
        items['seRequirementCategoryId'] = req.category;
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

        items['desc']  = req.desc;
        items['comment']  = req.comment;
        items['importance'] = req.importance;
        items['sources'] = req.sources ? req.sources : '';

        let [ins, created] = await Requirement.findOrCreate({
            logging:false, 
            where: {'id':id, 'title':title, 'seRequirementCategoryId':req.category},
            defaults: items
        });
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

exports.search = async (ctx, category, ids, str) => 
{
    const Requirement = ctx.models['se_requirement'];
    const CategoryCtrl = ctx.controls['software_engineering/requirement_category'];
    let where_cond = {};

    /* 获取该节点的所有子节点 */
    let subs = await CategoryCtrl.get_sub_tree_nodes(ctx, category);
    let cat_ids = [category];
    for (let i = 0; i < subs.length; i++)
        cat_ids.push(subs[i]['id']);

    where_cond['seRequirementCategoryId'] = cat_ids;

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
        limit: 20
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
        where:{'id':ids}
    });

    return ret;
}