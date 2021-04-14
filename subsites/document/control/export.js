const fs = require('fs');
const child_process = require('child_process');
const shelljs = require('shelljs');
const fssync = require('fs-sync');
const path = require('path');
const moment = require('moment');


const exportdir = '/data/export/';
var Export_state = {};

exports.state_reset = state_reset;
function state_reset()
{
    Export_state['timestamp_start']   = (new Date()).getTime();  // 服务器当前的时间

    Export_state['idx'] = -1; // 当前处理的文档序号
    Export_state['ids'] = []; // 所有文档ID列表

    Export_state['log-idx'] = 0;  // 当前日志序号
    Export_state['log-sys'] = [];
    Export_state['log-doc'] = [];
}

exports.state_get = state_get;
function state_get()
{
    let ret = {};

    ret['timestamp_start']   = Export_state['timestamp_start'];
    ret['timestamp_current'] = (new Date()).getTime();

    ret['log-idx'] = Export_state['log-idx'];
    ret['log-sys'] = Export_state['log-sys'];
    ret['log-doc'] = Export_state['log-doc'];
    return ret;
}

exports.export_start = async (ctx) =>
{
    const Document = ctx.models['Document'];
    let idx = Export_state['log-idx'];

    /* 1. 获取文档总数 */
    let ret = await Document.findAll({
        raw:true, logging:false,
        attributes:['id']
    });

    let ids = [];
    ret.map((e, i)=> { ids.push(e.id); });
    Export_state['idx'] = 0;
    Export_state['ids'] = [].concat(ids);
    Export_state['log-sys'][idx++] = '1. 总共有文档'+ids.length+'篇。';
    Export_state['log-idx']        = idx;

    /* 2. 执行导出准备脚本 */
    shelljs.exec('/web/script/export_prepare.sh');
    Export_state['log-sys'][idx++] = '2. 完成导出准备。';
    Export_state['log-idx']        = idx;

    export_meta(ctx);  // 继续后续步骤

    return state_get();
}

/* 导出标签和目录到meta.txt */
async function export_meta(ctx)
{
    const Tag = ctx.models['Tag'];
    const Document = ctx.models['Document'];
    const meta_filename = exportdir + 'meta.txt';
    let idx = Export_state['log-idx'];

    /* 获取所有标签 */
    let tags = await Tag.findAll({
        raw:true, logging:false,
        attributes: ['id', 'name']
    });
    fs.writeFileSync(meta_filename, "Tags:\n"+JSON.stringify(tags)+"\n\n", {flag:'a+'});

    /* 获取文档关联的标签 */
    let doc_tags = [];
    for (i = 0; i < Export_state['ids'].length; i++)
    {
        let id = Export_state['ids'][i];

        let doc_tag = await Document.findAll({
            raw:true, logging:false,
            attributes: ['id'],
            where: {'id':id},
            include: [{
                model: Tag,
                attributes: ['id']
            }]
        });
        if ((doc_tag.length > 1) || doc_tag[0]['Tags.id'])
        {
            let ids = doc_tag.map((ele)=>{ return ele['Tags.id']; });
            doc_tags.push({'doc_id':id, 'tag_ids':ids});
        }
    }
    fs.writeFileSync(meta_filename, "Document-Tags:\n"+JSON.stringify(doc_tags)+"\n\n", {flag:'a+'});

    Export_state['log-sys'][idx++] = '3. 完成元数据（标签，标签-文档）导出。';
    Export_state['log-idx']        = idx;

    export_document(ctx);
}

async function export_document(ctx)
{
    const Document = ctx.models['Document'];
    let doc_idx = Export_state['idx'];
    let doc_id  = Export_state['ids'][doc_idx];

    let doc = await Document.findOne({
        raw:true, logging:false,
        where:{'id':doc_id}
    });
    let content = doc['content'].toString();
    let title   = content.replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];

    // 替换文档中的文件应用路径
    content = content.replace(/(\!\[[^\]]*\]\()\/data\/upload([^\)]+\))/g, "$1upload$2");

    let filepath = exportdir + doc_id + '-' + title + '.md';
    fs.writeFileSync(filepath, content);

    Export_state['idx']++;
    if (Export_state['idx'] == Export_state['ids'].length)
    {
        let idx = Export_state['log-idx'];
        Export_state['log-sys'][idx++] = '4. 完成文档导出。';
        Export_state['log-idx']        = idx;

        export_post(ctx);
    } else {
        Export_state['log-doc'] = {'no':doc_idx, 'id':doc_id, 'title':title};
        export_document(ctx);
    }
}

/* 打包导出文档 */
async function export_post(ctx)
{
    let idx = Export_state['log-idx'];

    let datestr =  moment().format("YYYYMMDDHHmmss");
    let tarfile = '/data/export-'+datestr+'.tgz';
    child_process.exec('tar -zvcf '+tarfile+' -C '+exportdir+' /data/upload /data/export', (error, stdout, stderr) => {
        if (!error)
            shelljs.exec('rm -fr /data/backup');

        Export_state['log-sys'][idx++] = tarfile;
        Export_state['log-idx']        = 99;
    });
}


exports.export_part = async (doclist) => 
{
    shelljs.exec('/web/script/export_prepare.sh');

    /* 提取文档中的文件，并更新文档中的文件路径 */
    let filelist = [];
    for (i = 0; i < doclist.length; i++) {
        let content = doclist[i]['content'];
        let arr = content.match(/\[[^\]]*\]\(\/data\/upload\/[^\)]+\)/g);
        for (j = 0; arr && (j < arr.length); j++) {     
            // 取出 ![](filepath)格式中的filepath       
            let url = arr[j].replace(/\[[^\]]*\]\(([^\)]+)\)/, "$1");
            filelist.push(url);
            // 替换content中的路径
            content = content.replace(url, url.substr(6));
        }
        doclist[i]['content'] = content;
    }

    // 复制文件
    for (i = 0; i < filelist.length; i++) {
        let dst = exportdir + filelist[i].substr(6);
        let obj = path.parse(dst);
        // 如果目录不存在，则创建目录
        if (!fs.existsSync(obj.dir)) 
            fssync.mkdir(obj.dir);

        fssync.copy(filelist[i], dst);
    }

    // 输出文档
    for (i = 0; i < doclist.length; i++) {
        let content = doclist[i]['content'];
        /* 提取文章标题 
        * 1. 去除开头的#和换行符(\n)
        * 2. 查找下一个换行符前的字符串
        */
        let title   = content.replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];
        let filename = exportdir+title+'.md';
        fs.writeFileSync(filename, content);
    }

    let datestr =  moment().format("YYYYMMDDHHmmss");
    let tarfile = '/data/export-'+datestr+'.tgz';
    console.log('x', tarfile);
    /* 此处需要同步执行命令 */
    shelljs.exec('tar -zcvf '+tarfile+' -C /data /data/export');
    shelljs.exec('rm -fr /data/backup');
    return tarfile;
}


/* 查找现有备份文件 */
exports.export_file_info = async () => 
{
    var ret = null;

	var pa = fs.readdirSync('/data');
	pa.forEach(function(ele, index){
		var info = fs.statSync("/data/"+ele);        
		if(!info.isDirectory() && (/^export.*\.tgz/.test(ele))){
            ret = {'name':ele, 'path':"/data/"+ele, 'size':info.size, 'mtime':info.mtime};
		}
    })

    return ret;
}