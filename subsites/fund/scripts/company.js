const cheerio = require('cheerio');
const Request = require('request');
/* Custom Reference */
const fund = require('./fund');


var failed_company_codes = [];
var company_codes = [];

exports.get = (conn, cfg) => 
{
    let url = cfg.urls.company;
    console.log("[company], list - ", url);

    Request
    .get({
        'url': url,
        'timeout': 60000,
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
            console.log("[company], list(error) - err:%o, res:%o, body:%o.", err, res, body);
        else {
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
            company_codes = [].concat(codes);
            console.log("[company], list(%d): %s", codes.length, JSON.stringify(codes));

            if (skips.indexOf('2') == -1)
            {
                /* 2. 添加到数据库 */
                const fund_company = conn.model['fund_company'];
                let objs = codes.map((x)=>{ return {'code': x}; }); // 构造数据库实例

                fund_company
                .bulkCreate(objs, {logging: false})
                .then(()=>{
                    company_next(conn, cfg, codes);
                });
            } else 
                fund.get_by_company(conn, cfg, company_codes);
        }
    })
}

function company_next(conn, cfg, codes)
{
    let ccode = codes.shift();
    let url = cfg.urls['company_info'].replace(/\*/, ccode);
    console.log("[company], info(left %d) - %s", codes.length, url);

    Request
    .get({
        'url': url,
        'timeout': 60000,
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            failed_company_codes.push( ccode );
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
            //console.log('company info', info);

            /* 2. 添加到数据库 */
            if (info['name'])
            {
                const fund_company = conn.model['fund_company'];

                await fund_company.findOne({
                    logging: false,
                    'where': {'code': ccode}
                })
                .then((res)=>{
                    res.update({'name': info.name, 'attr': info.attr, 'createDate': info.createDate,
                        'createMoney': info.createMoney, 'foundTotal': info.foundTotal, 'moneyTotal': info.moneyTotal, 
                        'managerTotal': info.managerTotal}, {logging: false});
                })
            }

            if (0 == codes.length)
            {
                if (failed_company_codes.length > 0)
                    console.log("[company], info(failed) - %s", JSON.stringify(failed_company_codes));

                fund.get_by_company(conn, cfg, company_codes);
            }
            else
                setTimeout(() => { company_next(conn, cfg, codes); }, 500);
        }
    })
}