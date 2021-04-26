/* 获取基金数据，支持的类型有：company, fund, statistic */
exports.get = async (ctx, type, code) => 
{
    const FundCompany = ctx.models['fund_company'];
    const FundInfo = ctx.models['fund_info'];
    const FundStatistic = ctx.models['fund_statistic'];

    switch (type)
    {
    case 'company':
        return await FundCompany.findOne({
            logging:false, raw:true, 
            where:{'code':code}
        });
    case 'statistic':
        return await FundStatistic.findOne({
            logging:false, raw:true, 
            where:{'code':code}
        });
    default:
        return await FundInfo.findOne({
            logging:false, raw:true, 
            where:{'code':code}
        });
    }
}