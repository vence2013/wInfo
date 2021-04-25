const fs = require('fs');
const cheerio = require('cheerio');
const Request = require('request');
/* Custom Reference */
const fund_value = require('./fund_value');

var failed_fund_info = [];
var failed_fund_company = [];

exports.get = async (conn, cfg) => 
{
    const fund_company = conn.model['fund_company'];

    /* 清空所有后续数据 */
    await conn['db'].query("DELETE FROM `fund_infos`;");
    console.log("all fund info data cleared!");

    /* 1. 获取数据库中所有的公司代码 */
    var ret = await fund_company.findAll({
        logging:true, raw:true,
        attributes: ['code']
    });

    var codes = ret.map((x) => { return x.code; });
    company_fund_next(conn, cfg, codes);
}

/* 遍历所有公司代码，获取公司所属的基金代码
 */
function company_fund_next(conn, cfg, company_codes)
{
    let ccode = company_codes.shift();
    let url = cfg.urls['fund'].replace(/\*/, ccode)
    console.log("[fund], company(left %d) - %s", company_codes.length, url);

    function next_step()
    {
        if (0 == company_codes.length)
        {
            if (failed_fund_company.length > 0)
            {
                let codes_retry = [].concat(failed_fund_company);

                console.log("[fund], company(failed:%d) - %s\n\n", failed_fund_company.length, JSON.stringify(failed_fund_company));
                /* 将数组写入到文件 */
                //fs.writeFileSync(cfg.fails_file, "fund company fails\n"+JSON.stringify(failed_fund_company), {flag: 'a'});

                failed_fund_company = [];
                company_fund_next(conn, cfg, codes_retry);
            } else
                info_list(conn, cfg); // 下一步：遍历所有基金获取详细信息
        } else
            setTimeout(() => { company_fund_next(conn, cfg, company_codes); }, cfg.next_interval);
    }

    Request
    .get({
        'url': url,
        'timeout': cfg.request_timeout,
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            failed_fund_company.push(ccode);
            next_step(); // 继续下一步处理

            console.log("[fund], company(error) - err:%o, res:%o, body:%o.", err, res, body);
        } else {
            let fcodes = [];
            let $ = cheerio.load(body);            

            /* 1. 解析页面中公司包含的基金代码 */
            $(".third-block").map((i, e)=>{
                if ($(e).find('.tab-title').text() != "开放式基金") return ;

                $(e).find('.code').map((i2, e2)=>{
                    let code = $(e2).text();

                    if (/^\d+$/.test(code)) 
                        fcodes.push(code);
                    else
                        console.log("[fund], company(error) - Unknown founds, code:%s.", code);
                }) 
            })
            console.log("[fund], company(%d) - codes:%s.", fcodes.length, JSON.stringify(fcodes));

            /* 2. 添加到数据库  */
            const fund_info = conn.model['fund_info'];

            let objs = fcodes.map((x)=>{ return {'code': x, 'companyId': ccode}; }); // 构造数据库实例
            await fund_info.bulkCreate(objs, {logging: false});

            next_step(); // 继续下一步处理
        }
    })
}


/* ---------------------------- Fund Information --------------------------- */


/* 获取基金列表 */
exports.info_list = info_list;

async function info_list(conn, cfg)
{
    const fund_info = conn.model['fund_info'];

    /* 1. 获取数据库中所有的基金代码 */
    var ret = await fund_info.findAll({
        logging:true, raw:true,
        attributes: ['code']
    });

    var codes = ret.map((x) => { return x.code; });
    info_next(conn, cfg, codes);
}

async function info_next(conn, cfg, fund_codes)
{
    var fcode = fund_codes.shift();
    let url = cfg.urls['fund_info'].replace(/\*/, fcode)
    console.log("[fund] info(left %d) - %s.", fund_codes.length, url);

    function next_step()
    {
        if (0 == fund_codes.length)
        {
            if (failed_fund_info.length > 0)
            {
                let codes_retry = [].concat(failed_fund_info);

                console.log("[fund], info(failed:%d) - %s\n\n", failed_fund_info.length, JSON.stringify(failed_fund_info));
                /* 将数组写入到文件 */
                //fs.writeFileSync(cfg.fails_file, "fund info fails\n"+JSON.stringify(failed_fund_info), {flag: 'a'});

                failed_fund_info = [];
                info_next(conn, cfg, codes_retry);
            } else
                fund_value.get(conn, cfg); // 下一步：遍历所有基金获取基金净值
        } else
            setTimeout(() => { info_next(conn, cfg, fund_codes); }, cfg.next_interval);
    }

    Request
    .get({
        'url': url, 
        'timeout': cfg.request_timeout
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            failed_fund_info.push( fcode );
            next_step(); // 继续下一记录处理

            console.log("[fund], info(error) - err:%o, res:%o, body:%o.", err, res, body);
        } else {
            let info = {};
            var $ = cheerio.load(body);

            /* 1. 解析页面的基金信息数据 */
            $(".txt_in").find('th').map((i, e)=>{
                var name = $(e).text();
                var value = $(".txt_in").find('td').eq(i).text();

                switch (name) {
                case "基金全称": info['fullname'] = value; break;
                case "基金类型": info['type'] = value; break;
                case "成立日期/规模": 
                    var arr = value.split('/');
                    if (arr && (arr.length>=2)) {
                        var ret = arr[1].match(/[\d\.]+/);
                        info['shareCreateDate']  = arr[0].replace(/[^\d]*(\d+)[^\d]*(\d+)[^\d]*(\d+).*/, '$1-$2-$3');
                        if (ret) { info['shareCreate'] = parseFloat(ret[0]); }
                    }                
                    break;
                case "资产规模": 
                    var arr = value.split('（');
                    if (arr && (arr.length>=2)) {
                        var ret = arr[0].match(/[\d\.]+/);
                        if (ret) { info['moneyUpdate'] =  parseFloat(ret[0]); }
                        info['moneyUpdateDate'] = arr[1].replace(/[^\d]*(\d+)[^\d]*(\d+)[^\d]*(\d+).*/, '$1-$2-$3');                        
                    }
                    break;
                case "份额规模":
                    var arr = value.split('（');
                    if (arr && (arr.length>=2)) {
                        var ret = arr[0].match(/[\d\.]+/);
                        if (ret) { info['shareUpdate'] =  parseFloat(ret[0]); }                    
                        info['shareUpdateDate'] = arr[1].replace(/[^\d]*(\d+)[^\d]*(\d+)[^\d]*(\d+).*/, '$1-$2-$3');                           
                    }                 
                    break;
                }
            })

            /* 2. 添加到数据库 */
            if (info['fullname'])
            {
                const fund_info = conn.model['fund_info'];

                await fund_info.update({
                    'fullname': info.fullname, 'type': info.type, 'createDate': info.shareCreateDate,
                    'createShare': info.shareCreate, 'moneyUpdate': info.moneyUpdate, 'moneyUpdateDate': info.moneyUpdateDate, 
                    'shareUpdate': info.shareUpdate, 'shareUpdateDate': info.shareUpdateDate
                }, {
                    logging:false,
                    where: {'code':fcode}
                });
            }

            next_step(); // 继续下一步
        }
    })
}


/* ------------------------------------------------------------------------- */