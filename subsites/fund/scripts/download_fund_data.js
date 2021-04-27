const Sequelize = require('sequelize');
/* Custom Reference */
const company = require('./company');
const fund    = require('./fund');
const fund_value = require('./fund_value');
const fund_statistic = require('./fund_statistic');

const config = require('./config.json');
const config_env = require('dotenv').config({ path: config.env_file }).parsed;


/* 
 * Function     : date_format
 * Description  : 
 * 对Date的扩展，将Date转化为指定格式的String。
 *     月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 *     年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * 例子：
 *     (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 *     (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 * 
 * Parameter    : 
 * Return       : 用户可访问的接口列表
 */

global.date_format = (fmt, date)=>{
    var o = {   
        "M+" : date.getMonth()+1,                 //月份   
        "d+" : date.getDate(),                    //日   
        "h+" : date.getHours(),                   //小时   
        "m+" : date.getMinutes(),                 //分   
        "s+" : date.getSeconds(),                 //秒   
        "q+" : Math.floor((date.getMonth()+3)/3), //季度   
        "S"  : date.getMilliseconds()             //毫秒   
    };

    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)) { 
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }

    return fmt;   
}


/* ------------------------ Database Connection ---------------------------- */

let cmd = {"type":"unknow"};
/* paras
 *   没有参数时，从头开始执行（清空数据表，重新获取所有数据） 
 *   from <n>, 从第n步开始执行
 */
var paras = process.argv.slice(2);
if (paras.length > 0)
{
    if ('from' == paras[0])
    {
        cmd['type'] = 'from';
        cmd['para'] = (paras.length > 1) ? parseInt(paras[1]) : 0;
    } else if ('clear' == paras[0]) {
        cmd['type'] = 'clear';
    }
}

if ('unknow' == cmd['type'])
{
    let help = "unkown command!\n"+
               "supported list:\n"+
               "- from [step]\n"+
               "- clear\n";
    console.log(help);
    process.exit(1);
}

async function download_entry()
{
    console.log('Fund data download starting!');

    if ('from' == cmd['type'])
    {
        switch (cmd['para'])
        {
            case 0:  company.get(DB_connection, config);   break; // 重新获取所有数据
            case 1:  fund.get(DB_connection, config);      break; // 重新获取基金信息数据
            case 2:  fund.info_list(DB_connection, config); break; // 更新基金信息数据
            case 3:  fund_value.get(DB_connection, config); break; // 重新获取基金净值数据
            case 4:  fund_statistic.get(DB_connection, config); break; // 重新获取基金统计数据
            default: console.log("Unkown operation, exit!");
        }
    } else if ('clear' == cmd['type']) {
        /* 清空所有数据 */
        await DB_connection['db'].query("DELETE FROM `fund_companies`;");
        await DB_connection['db'].query("DELETE FROM `fund_infos`;");
        await DB_connection['db'].query("DELETE FROM `fund_statistics`;");
        await DB_connection['db'].query("DELETE FROM `fund_values`;");
        console.log("all fund data cleared!");
        process.exit( 0 );
    }
}

var DB_connection = {};

// 创建ORM对象
DB_connection['db'] = 
    new Sequelize(
        config_env.SYSNAME, config_env.SYSNAME, config_env.MYSQL_ROOT_PASSWORD, 
        { 
            host: config_env.MYSQL_HOST, dialect:'mysql', 
            pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
        }
    );

DB_connection['db']
.authenticate()
.then(async () => {
    console.log('^_^ Connection has been established successfully.');  

    DB_connection['model'] = {};
    DB_connection['model']['fund_company']     = await DB_connection['db'].import(__dirname+"/../model/fund_company");
    DB_connection['model']['fund_info']        = await DB_connection['db'].import(__dirname+"/../model/fund_info");
    DB_connection['model']['fund_value']      = await DB_connection['db'].import(__dirname+"/../model/fund_value");
    DB_connection['model']['fund_statistic'] = await DB_connection['db'].import(__dirname+"/../model/fund_statistic");

    // 同步到数据库
    await DB_connection['db'].sync({logging: false});
    
    download_entry();           
}).catch(err => { 
    console.error('^~^ Unable to connect to the database:', err); 
});


/* ------------------------------------------------------------------------- */
