const cheerio = require('cheerio');
const Request = require('request');

var failed_fund_codes = [];
var failed_fund_company = [];

exports.get_by_company = get_by_company;

/* 遍历所有公司代码，获取公司所属的基金代码
 */
function get_by_company(conn, cfg, company_codes)
{
    let ccode = company_codes.shift();
    let url = cfg.urls['fund'].replace(/\*/, ccode)
    console.log("[fund], company(left %d) - %s", company_codes.length, url);

    Request
    .get({
        'url': url,
        'timeout': 60000,
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
        {
            failed_fund_company.push(ccode);
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
            fund_info
            .bulkCreate(objs, {logging: false})
            .then(()=>{
                if (0 == company_codes.length)
                {
                    console.log("[fund], company(failed) - %s", JSON.stringify(failed_fund_company));
                    /* 3. 下一步：遍历所有基金获取详细信息 */

                } else
                    setTimeout(() => { get_by_company(conn, cfg, company_codes); }, 500);
            })
        }
    })
}