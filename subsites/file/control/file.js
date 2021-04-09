const fs = require('fs');
const moment = require('moment');
const mkdirp = require('mkdirp');

exports.create = async (ctx, file, tagInstances) => {
    const File = ctx.models['File'];

    var size = file.size;
    var name = file.name.replace(/(^\s*)|(\s*$)/g, "");
    var ext  = (name.indexOf('.')!=-1) ? name.split('.').pop().toLowerCase() : '';
    // 生成（创建）上传后的存储路径
    var datestr =  moment().format("YYYYMMDD");
    var directory = '/data/upload/'+datestr+'/';
    if (!fs.existsSync(directory)) { mkdirp.sync(directory); } // 如果目录不存在，则创建该目录。
    var location = directory+name;
    
    // 添加数据库信息， 默认权限为任何人可读
    var [fileIns, created] = await File.findOrCreate({logging: false,
        where: {'name': name, 'size': size, 'ext': ext},
        defaults: {'location': location}
    });
    // 关联标签
    await fileIns.setTags(tagInstances, {logging:false});

    if (created) { // 移动上传的文件到指定路径
        const reader = fs.createReadStream(file.path);
        const upStream = fs.createWriteStream(location);
        reader.pipe(upStream);
    }
    
    return created;
}

exports.tag_link = async (ctx, fileids, tagInstance) =>
{
    const File = ctx.models['File'];

    var fileInstances = await File.findAll({logging: false, where: {'id':fileids}});
    // 关联标签
    await tagInstance.addFiles(fileInstances, {logging:false});
}

exports.tag_unlink = async (ctx, fileids, tagInstance) =>
{
    const File = ctx.models['File'];

    var fileInstances = await File.findAll({logging: false, where: {'id':fileids}});
    // 关联标签
    await tagInstance.removeFiles(fileInstances, {logging:false});
}

exports.delete = async (ctx, ids) =>
{
    const File = ctx.models['File'];

    var fileObjs = await File.findAll({'logging':false, 'raw':true, 'where': {'id': ids}});

    // 删除文件系统中的实体
    for (i=0; i<fileObjs.length; i++)
    {
        // 文件不存在，则不处理
        if (!fs.existsSync(fileObjs[i].location)) continue;

        fs.unlinkSync(fileObjs[i].location);
        console.log("  [Notice] File(location: %s ) was deleted.", fileObjs[i].location);
    }

    // 删除数据库记录
    await File.destroy({'logging':false, 'where': {'id': ids}});
}

exports.detail = async (ctx, fid) =>
{
    const File = ctx.models['File'];

    var fileIns = await File.findOne({logging: false, where: {'id': fid}});
    if (!fileIns) return null;

    var fileObj = fileIns.get({plain:true});
    // 关联标签名称列表
    var tagObjs = await fileIns.getTags({raw:true, logging:false});
    fileObj['tags'] = tagObjs.map((x)=>{ return x.name; });

    return fileObj;
}


exports.search = async (ctx, query, page, pageSize) =>
{
    const Tag  = ctx.models['Tag']; 
    var sql, sqlCond = '';

    // 根据搜索条件构建SQL条件
    if (query.str && query.str.length) 
        query.str.map((x)=>{ sqlCond += " AND `name` LIKE '%"+x+"%' " });
    if (query.ext && query.ext.length) 
    {
        var extstr = '';
        query.ext.map((x)=>{ extstr += ", '"+x+"' "; });
        sqlCond += " AND `ext` IN ("+extstr.substr(1)+") ";
    }
    if (query.sizeget)
        sqlCond += " AND `size`>="+query.sizeget+" ";
    if (query.sizelet)
        sqlCond += " AND `size`<="+query.sizelet+" ";
    if (query.createget)
        sqlCond += " AND `createdAt`>='"+query.createget+"' "; 
    if (query.createlet)
        sqlCond += " AND `createdAt`<='"+query.createlet+"' ";
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : '';

    if (query.tag)
    {
        var tagObjs = await Tag.findAll({raw: true, logging: false, where: {'name': query.tag}});
        // 只搜索有效的标签。
        if (tagObjs && tagObjs.length) {
            var idstr = '';
            tagObjs.map((x)=>{ idstr += ', '+x.id; });        
            var sql2 = "SELECT `FileId` FROM `TagFile` WHERE `TagId` IN ("+idstr.substr(1)+
                       ") GROUP BY `FileId` HAVING COUNT(*)>="+tagObjs.length;
            var sql3 = " `id` IN ("+sql2+") "; 
            sqlCond += sqlCond ? " AND "+sql3 : " WHERE "+sql3;
        }
    }

    // 计算分页数据
    sql = "SELECT COUNT(*) AS num FROM `Files` "+sqlCond;
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var total = res[0]['num'];
    var maxpage  = Math.ceil(total/pageSize);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page);

    // 查询当前分页的列表数据
    var offset = (page - 1) * pageSize;
    sql = "SELECT * FROM `Files` "+sqlCond+" ORDER BY "+query.order.join(' ')+" LIMIT "+offset+", "+pageSize+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});

    return {'total':total, 'page':page, 'list':res};
}