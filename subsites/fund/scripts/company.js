const fs = require('fs');
const cheerio = require('cheerio');
const Request = require('request');
/* Custom Reference */
const fund = require('./fund');


var failed_company_info = [];

exports.get = async (conn, cfg) => 
{
    let url = cfg.urls.company;
    console.log("[company], list - ", url);

    /* 清空所有后续数据 */
    await conn['db'].query("DELETE FROM `fund_companies`;");
    console.log("all fund data cleared!");

    Request
    .get({
        'url': url,
        'timeout': cfg.request_timeout,
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            console.log("[company], list(error) - err:%o, res:%o, body:%o.", err, res, body);
            console.log("Cannot continue, please retry!");
        } else {
            let codes = [];            
            let $ = cheerio.load(body);

            /* 1. 解析页面的公司列表 */
            let list = $(".sencond-block").find('a');
            list.map((i, e)=>{
                let href = $(e).attr('href');
                if (href.length > 0) {
                    let code = href.match(/\/(\d+)\.html/g);
                    if (code.length) { codes.push(code[0].substr(1, 8)); }
                }
            })
            console.log("[company], list(%d): %s", codes.length, JSON.stringify(codes));

            /* 2. 添加到数据库 */
            const fund_company = conn.model['fund_company'];
            let objs = codes.map((x)=>{ return {'code': x}; }); // 构造数据库实例

            await fund_company.bulkCreate(objs, {logging: false});
            company_next(conn, cfg, codes);
        }
    })
}

function company_next(conn, cfg, codes)
{
    let ccode = codes.shift();
    let url = cfg.urls['company_info'].replace(/\*/, ccode);
    console.log("[company], info(left %d) - %s", codes.length, url);

    function next_step()
    {
        if (0 == codes.length)
        {
            if (failed_company_info.length > 0)
            {
                let codes_retry = [].concat(failed_company_info);

                console.log("[company], info(failed:%d) - %s\n\n", failed_company_info.length, JSON.stringify(failed_company_info));
                /* 将数组写入到文件 */
                //fs.writeFileSync(cfg.fails_file, "company info fails\n"+JSON.stringify(failed_company_info), {flag: 'a'});

                failed_company_info = [];
                company_next(conn, cfg, codes_retry);
            } else
                fund.get(conn, cfg);  // 下一步：获取基金公司所属的基金
        }
        else
            setTimeout(() => { company_next(conn, cfg, codes); }, cfg.next_interval);
    }

    Request
    .get({
        'url': url,
        'timeout': 60000,
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            failed_company_info.push( ccode );
            next_step(); // 继续下一记录处理

            console.log("[company], info(error) - err:%o, res:%o, body:%o.", err, res, body);
        } else {
            let info = {};
            let $ = cheerio.load(body);

            /* 1. 解析页面的公司信息 */
            $(".company-info")
            .find(".category-item")
            .map((i, e)=>{
                $(e).find('.category-name').map((i2, e2)=>{
                    let name  = $(e2).text();
                    let value = $(e).find('.category-value').eq(i2).text();
                    let ret;

                    switch(name) {
                    case "法定名称": info['name'] = value; break;
                    case "公司属性": info['attr'] = value; break;
                    case "成立日期": info['createDate']  = value; break;
                    case "注册资本": 
                        ret = value.match(/[0-9\.]+/);
                        if (ret) { info['createMoney'] = parseFloat(ret[0]); }
                        break;
                    case "管理规模": 
                        ret = value.match(/[0-9\.]+/);
                        if (ret) { info['moneyTotal']  = parseFloat(ret[0]); }
                        break;
                    case "基金数量": 
                        ret = value.match(/\d+/);
                        if (ret) { info['foundTotal']  = parseInt(ret[0]); }
                        break;
                    case "经理人数": 
                        ret = value.match(/\d+/);
                        if (ret) { info['managerTotal']  = parseInt(ret[0]); }                    
                        break;
                    }
                })
            })

            /* 2. 添加到数据库 */
            if (info['name'])
            {
                const fund_company = conn.model['fund_company'];

                await fund_company.update({
                    'name': info.name, 'attr': info.attr, 'createDate': info.createDate, 'managerTotal': info.managerTotal, 
                    'createMoney': info.createMoney, 'foundTotal': info.foundTotal, 'moneyTotal': info.moneyTotal
                }, {
                    logging: false,
                    'where': {'code': ccode}
                });
            }

            next_step(); // 继续下一步
        }
    })
}