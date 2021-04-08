const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.create = async (ctx, tags) => 
{
    const Tag = ctx.models['Tag'];

    for (i=0; i<tags.length; i++)
        [instance, created] = await Tag.findOrCreate({where: {'name': tags[i]}, logging: false});
        
    var ret = await Tag.findAll({logging:false, where:{'name':tags}});
    return ret;
}

exports.delete = async (ctx, tagname) => {
    const Tag = ctx.models['Tag'];

    await Tag.destroy({logging: false, 'where': {'name': tagname}});
}

exports.get = async (ctx, tag) => 
{
    const Tag = ctx.models['Tag'];

    return await Tag.findOne({'where': {'name':tag}, 'logging': false});
}

exports.search = async (ctx, str, page, size) => 
{
    const Tag = ctx.models['Tag'];
    var queryCond = {'raw': true, 'logging': false, 'where': {}};

    if (str) { queryCond['where']['name'] = {[Op.like]: '%'+str+'%'}; }

    /* 查询符合条件的结果页数，更新有效的页数 */
    var total = await Tag.count(queryCond);
    var maxpage = Math.ceil(total/size);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page); // 更新为有效的页码

    /* 获取更新后分页的记录 */
    var offset = (page - 1) * size;
    queryCond['offset'] = offset;
    queryCond['limit']  = parseInt(size);
    queryCond['order']  = [['createdAt', 'DESC']];
    var list = await Tag.findAll(queryCond);

    return {'total':total, 'page':page, 'list':list};
}

exports.check = async (ctx, tags) => 
{
    const Tag = ctx.models['Tag'];

    return await Tag.findAll({'where': {'name':tags}, 'raw': true, 'logging': false});
}
