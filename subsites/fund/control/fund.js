/* 获取基金数据，支持的类型有：company, fund, statistic */
exports.get = async (ctx, type, code) => 
{
    const FundCompany = ctx.models['fund_company'];
    const FundInfo = ctx.models['fund_info'];
    const FundStatistic = ctx.models['fund_statistic'];
    let ret;

    if ('company' == type) 
    {
        ret = await FundCompany.findOne({
            logging:false, raw:true, 
            where:{'code':code}
        });
    } else if ('fund' == type) {
        ret = await FundInfo.findOne({
            logging:false, raw:true, 
            where:{'code':code}
        });
    } else if ('statistic' == type) {
        ret = await FundStatistic.findOne({
            logging:false, raw:true, 
            where:{'code':code}
        });
    }

    return ret;
}