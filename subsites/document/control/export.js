const shelljs = require('shelljs');


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

    export_meta();  // 继续后续步骤

    return state_get();
}

/* 导出标签和目录到meta.txt */
async function export_meta()
{
    let idx = Export_state['log-idx'];

    export_document();
}

async function export_document()
{
    let idx = Export_state['log-idx'];

    export_post();
}

/* 打包导出文档 */
async function export_post()
{
    let idx = Export_state['log-idx'];

    console.log('export complete');
    Export_state['log-sys'][idx++] = '导出成功！';
    Export_state['log-idx']        = 99;
}