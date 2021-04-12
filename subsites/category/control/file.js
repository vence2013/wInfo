/* 获取满足以下任一条件的文件，长度为size条记录
 * 1. 不属于任何目录节点的文件；（categoryid = 0）
 * 2. 不属于某一子树的文件；
 */
exports.resource = async (ctx, categoryid, str, link, page, size) => {
    var sql, sqlCond = '';

    if (str && str.length) 
        str.map((x)=>{ sqlCond += " AND `name` LIKE '%"+x+"%' " });
    if (link && categoryid) /* belong a category */
        sqlCond += " AND `id` IN (SELECT `FileId` FROM `CategoryFile` WHERE `CategoryId`='"+categoryid+"') ";
    else if (categoryid) /* not belong a category */
        sqlCond += " AND `id` NOT IN (SELECT `FileId` FROM `CategoryFile` WHERE `CategoryId`='"+categoryid+"') ";
    sqlCond += " AND `id` IN (SELECT `FileId` FROM `TagFile`) ";
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
    sql = "SELECT * FROM `Files` "+sqlCond+" ORDER BY `createdAt` DESC LIMIT "+offset+", "+size+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});

    return {'total':total, 'page':page, 'list':res};
}

exports.relate = async(ctx, categoryid, link, fileids) => {
    const Category = ctx.models['Category'];

    var categoryIns = await Category.findOne({logging:false, where:{'id':categoryid}});
    if (!categoryIns) return false; // 无效的目录

    if (link)
        await categoryIns.removeFiles(fileids, {logging:false});
    else
        await categoryIns.addFiles(fileids, {logging:false});
    
    return true;
}