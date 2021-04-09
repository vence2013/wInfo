/* 获取满足以下任一条件的文档，长度为size条记录
 * 1. 不属于任何目录节点的文档；（categoryid = 0）
 * 2. 不属于某节点的文档（不是子树，允许一个文档属于同一子树的多个节点）；
 */
exports.resource = async (ctx, categoryid, str, link, page, size) => {
    var sql, sqlCond = '';

    if (str && str.length) {
        str.map((x)=>{ sqlCond += " AND `content` LIKE '%"+x+"%' " });
    }
    if (link && categoryid) /* belong a category */
    {
        sqlCond += " AND `id` IN (SELECT `DocumentId` FROM `CategoryDocument` WHERE `CategoryId`='"+categoryid+"') ";
    }
    else if (categoryid) /* not belong a category */
    {
        sqlCond += " AND `id` NOT IN (SELECT `DocumentId` FROM `CategoryDocument` WHERE `CategoryId`='"+categoryid+"') ";
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    // 计算分页数据
    sql = "SELECT COUNT(*) AS num FROM `Documents` "+sqlCond;
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var total = res[0]['num'];
    var maxpage  = Math.ceil(total/size);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page);

    // 查询当前分页的列表数据
    var offset = (page - 1) * size;
    sql = "SELECT * FROM `Documents` "+sqlCond+" ORDER BY `createdAt` DESC LIMIT "+offset+", "+size+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var doclist = res.map((x)=>{
        // 将buffer转换为字符串
        x['content'] = x.content ? x.content.toString() : '';
        return x;
    });

    return {'total':total, 'page':page, 'list':doclist};
}

exports.relate = async(ctx, categoryid, link, docids) => {
    const Category = ctx.models['Category'];

    var categoryIns = await Category.findOne({logging:false, where:{'id':categoryid}});
    if (!categoryIns) return false; // 无效的目录

    if (link)
        await categoryIns.removeDocuments(docids, {logging:false});
    else
        await categoryIns.addDocuments(docids, {logging:false});
    
    return true;
}