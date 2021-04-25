const fs = require('fs');
const cheerio = require('cheerio');
const Request = require('request');


exports.get = async (conn, cfg) =>
{
    let url = cfg.urls['fund_statistic']+"&v="+Date.now();

    /* 清空所有后续数据 */
    await conn['db'].query("DELETE FROM `fund_statistics`;");
    console.log("all fund statistic data cleared!");

    console.log("[fund], statistic - %s.", url);
    Request
    .get({
        'url': url,
        'timeout': cfg.request_timeout,
        headers: {
            'referer': 'http://fundf10.eastmoney.com'
        }
    }, async (err, res, body)=>{
        if (err || (res.statusCode != 200))
            console.log("[fund], statistic(error) - err:%o, res:%o, body:%o.", err, res, body);
        else {
            eval(body);  // 获取数据 rankData
            let list = rankData.datas;

            /* 将数据添加到数据库 */
            do
            {
                let objs = [];
                for (i = 0; (i < 1000) && (list.length > 0); i++)
                {
                    var x = list.shift();
                    var arr = x.split(',');
    
                    var lastWeek   = arr[7] ? arr[7] : null;
                    var lastMonth  = arr[8] ? arr[8] : null;
                    var lastQuarter  = arr[9] ? arr[9] : null;
                    var lastHalfYear = arr[10] ? arr[10] : null;
                    var last1Year  = arr[11] ? arr[11] : null;
                    var last2Year  = arr[12] ? arr[12] : null;
                    var last3Year  = arr[13] ? arr[13] : null;
                    var thisYear   = arr[14] ? arr[14] : null;
                    var fromCreate = arr[15] ? arr[15] : null;
                    var obj = {'code':arr[0], 'lastWeek':lastWeek, 'lastMonth':lastMonth, 'lastQuarter':lastQuarter, 'lastHalfYear':lastHalfYear, 
                        'last1Year':last1Year, 'last2Year':last2Year, 'last3Year':last3Year, 'thisYear': thisYear, 'fromCreate':fromCreate};
                        objs.push(obj);
                }

                const fund_statistic = conn.model['fund_statistic'];
                await fund_statistic.bulkCreate(objs, {logging: false});
            } while (list.length > 0);

            console.log('[fund], statistic - complete!');
            process.exit(0);
        }
    })
}

