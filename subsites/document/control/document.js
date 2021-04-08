
exports.edit = async (ctx, docid, content, tagInstances)=>{
    const Document = ctx.models['Document'];

    if (docid) {
        var docIns = await Document.findOne({logging: false, 
            where: {'id':docid}
        });
        if (!docIns) 
            return -1; // 无效文档

        await docIns.update({'content':content}, {logging:false});
    } else {
        var [docIns, created] = await Document.findOrCreate({logging: false,
            where: {'content':content}
        });
        docid = docIns.get({plain: true}).id;
    }
    // 关联标签
    await docIns.setTags(tagInstances, {logging:false});

    return docid;
}

exports.delete = async(ctx, docid)=>{
    const Document = ctx.models['Document'];

    // 文件有效， 且创建者为当前用户
    await Document.destroy({logging: false, 'where': {'id': docid}});
}

/* 返回文档的详细信息：content, ... , tagnames */
exports.detail = async (ctx, docid)=>{
    const Document = ctx.models['Document'];

    var docIns = await Document.findOne({logging:false, where:{'id':docid}});
    if (!docIns) return null;

    var docObj = docIns.get({plain:true});
    docObj['content'] = docObj['content'].toString();
    // 关联标签名称列表
    var tagObjs = await docIns.getTags({raw:true, logging:false});
    docObj['tagnames'] = tagObjs.map((x)=>{ return x.name; });

    return docObj;
}

/* 搜索，返回当前页的数据 */
exports.search = async (ctx, query) => {
    const Tag  = ctx.models['Tag']; 
    var sql, sqlCond = '';

    // 根据搜索条件构建SQL条件
    if (query.str && query.str.length) {
        query.str.map((x)=>{ sqlCond += " AND `content` LIKE '%"+x+"%' " });
    }
    if (query.createget)  { sqlCond += " AND `createdAt`>='"+query.createget+"' "; }
    if (query.createlet)  { sqlCond += " AND `createdAt`<='"+query.createlet+"' "; }
    // 查找同时关联多个标签的文档。
    if (query.tag && query.tag.length) {
        var tagObjs = await Tag.findAll({raw: true, logging: false, where: {'name': query.tag}});
        // 只搜索有效的标签。
        if (tagObjs && tagObjs.length) {
            var idstr = '';
            tagObjs.map((x)=>{ idstr += ', '+x.id; });        
            var sql2 = "SELECT `DocumentId` FROM `TagDocument` WHERE `TagId` IN ("+idstr.substr(1)+
                       ") GROUP BY `DocumentId` HAVING COUNT(*)>="+tagObjs.length;
            sqlCond += " AND `id` IN ("+sql2+") "; 
        }
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    var page = query.page;
    var size = query.size;
    // 计算分页数据
    sql = "SELECT COUNT(*) AS num FROM `Documents` "+sqlCond;
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var total = res[0]['num'];
    var maxpage  = Math.ceil(total/size);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page);

    // 查询当前分页的列表数据
    var offset = (page - 1) * size;
    sql = "SELECT * FROM `Documents` "+sqlCond+" ORDER BY "+query.order.join(' ')+" LIMIT "+offset+", "+size+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var doclist = res.map((x)=>{
        // 将buffer转换为字符串
        x['content'] = x.content ? x.content.toString() : '';
        return x;
    });

    return {'total':total, 'page':page, 'list':doclist};
}

/* 搜索，返回所有结果 */
exports.searchall = async (ctx, query) => {
    const Tag  = ctx.models['Tag']; 
    var sql, sqlCond = '';

    // 根据搜索条件构建SQL条件
    if (query.str && query.str.length) {
        query.str.map((x)=>{ sqlCond += " AND `content` LIKE '%"+x+"%' " });
    }
    if (query.createget)  { sqlCond += " AND `createdAt`>='"+query.createget+"' "; }
    if (query.createlet)  { sqlCond += " AND `createdAt`<='"+query.createlet+"' "; }
    // 查找同时关联多个标签的文档。
    if (query.tag && query.tag.length) {
        var tagObjs = await Tag.findAll({raw: true, logging: false, where: {'name': query.tag}});
        // 只搜索有效的标签。
        if (tagObjs && tagObjs.length) {
            var idstr = '';
            tagObjs.map((x)=>{ idstr += ', '+x.id; });        
            var sql2 = "SELECT `DocumentId` FROM `TagDocument` WHERE `TagId` IN ("+idstr.substr(1)+
                       ") GROUP BY `DocumentId` HAVING COUNT(*)>="+tagObjs.length;
            sqlCond += " AND `id` IN ("+sql2+") "; 
        }
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    sql = "SELECT * FROM `Documents` "+sqlCond+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var doclist = res.map((x)=>{
        // 将buffer转换为字符串
        x['content'] = x.content ? x.content.toString() : '';
        return x;
    });

    return doclist;
}