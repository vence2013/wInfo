const fs = require('fs');
const cheerio = require('cheerio');
const Request = require('request');
/* Custom Reference */
const fund_statistic = require('./fund_statistic');


var failed_fund_value = [];

exports.get = async (conn, cfg) =>
{
    const fund_info = conn.model['fund_info'];

    /* 清空所有后续数据 */
    await conn['db'].query("DELETE FROM `fund_values`;");
    console.log("all fund value data cleared!");

    /* 1. 获取数据库中所有的基金代码 */
    let ret = await fund_info.findAll({
        logging:true, raw:true,
        attributes: ['code']
    });

    let codes = ret.map((x) => { return x.code; });
    fund_value_next(conn, cfg, codes);
}

function fund_value_next(conn, cfg, fund_codes)
{
    let fcode = fund_codes.shift();
    let url = cfg.urls['fund_value'].replace(/\*/, fcode)+"&_="+Date.now();
    console.log("[fund], value(left %d) - %s.", fund_codes.length, url);    

    function next_step()
    {
        if (0 == fund_codes.length)
        {
            if (failed_fund_value.length > 0)
            {
                let codes_retry = [].concat(failed_fund_value);

                console.log("[fund], info(failed:%d) - %s\n\n", failed_fund_value.length, JSON.stringify(failed_fund_value));
                /* 将数组写入到文件 */
                //fs.writeFileSync(cfg.fails_file, "fund info fails\n"+JSON.stringify(failed_fund_value), {flag: 'a'});

                failed_fund_value = [];
                fund_value_next(conn, cfg, codes_retry);
            } else
                fund_statistic.get(conn, cfg); // 下一步：遍历所有基金获取基金统计数据
        } else
            setTimeout(() => { fund_value_next(conn, cfg, fund_codes); }, cfg.next_interval);
    }

    Request
    .get({
        'url': url, 
        timeout: cfg.request_timeout,
        headers: {
            'referer': 'http://fundf10.eastmoney.com'
        }
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            failed_fund_value.push(fcode);
            next_step(); // 继续下一步处理

            console.log("[fund], value(error) - err:%o, res:%o, body:%o.", err, res, body);
        } else {
            let ret = JSON.parse(body);
            let list = ret.Data.LSJZList;

            /* 分批添加数据。 避免数据太大无法一次添加
             */
            do 
            {
                /* 构建最大1000的数据对象 */
                let objs = [];
                for (i = 0; (i < 1000) && (list.length > 0); i++)
                {
                    let x = list.shift();
                    let value = x.DWJZ ? x.DWJZ : 0;
                    let value2 = x.LJJZ ? x.LJJZ : 0;
                    let value3 = x.JZZZL ? x.JZZZL : 0;
                    objs.push({'code': fcode, 'date': x.FSRQ, 'jz_unit': value, 'jz_acc': value2, 'jz_grate': value3});                    
                }

                const fund_value = conn.model['fund_value'];
                await fund_value.bulkCreate(objs, {logging: false});
            } while (list.length > 0);

            next_step(); // 继续下一步处理
        }
    })
}