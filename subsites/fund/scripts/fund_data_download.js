const Sequelize = require('sequelize');
/* Custom Reference */
const company = require('./company');
const config = require('./config.json');
const config_env = require('dotenv').config({ path: config.envfile }).parsed;

/* 可跳过的步骤定义如下：
 * '1': all_fund_data_reset(), fund_data_download.js
 * '2': company_next(), company.js
 */
global.skips = process.argv.slice(2);


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


/* ------------------------ Clear/Reset all data --------------------------- */

function all_fund_data_reset(conn)
{
    if (skips.indexOf('1') != -1)
        return company.get(conn, config);

    conn['db']
    .query("DELETE FROM `fund_companies`;")
    .then(async () => { return conn['db'].query("DELETE FROM `fund_infos`;"); })
    .then(async () => { return conn['db'].query("DELETE FROM `fund_values`;"); })
    .then(async () => { return conn['db'].query("DELETE FROM `fund_statistics`;"); })
    .then(() => {
        console.log("all fund data cleared (reset) complete!");

        company.get(conn, config);
    });
}


/* ------------------------ Database Connection ---------------------------- */

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
    DB_connection['model']['fund_statistics'] = await DB_connection['db'].import(__dirname+"/../model/fund_statistics");

    // 同步到数据库
    DB_connection['db']
    .sync({logging: false})
    .then(()=>{
        console.log('Fund data download starting!');

        all_fund_data_reset( DB_connection );
    })               
}).catch(err => { 
    console.error('^~^ Unable to connect to the database:', err); 
});


/* ------------------------------------------------------------------------- */
