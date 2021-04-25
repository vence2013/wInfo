const Sequelize = require('sequelize');
const Op = Sequelize.Op; 

function year_clac(num)
{
    let year = (new Date).getFullYear();

    year -= num;
    return year+'-01-01';
}

function company_where_construct(options)
{
    let where = {};

    /* 创建时间范围 */
    if (options['create_year_min'] && options['create_year_max'])
        where['createDate'] = {[Op.lte]:year_clac( options['create_year_min'] ), [Op.gte]:year_clac( options['create_year_max'] )};
    else if (options['create_year_min'])
        where['createDate'] = {[Op.lte]:year_clac( options['create_year_min'] )};
    else if (options['create_year_max'])
        where['createDate'] = {[Op.gte]:year_clac( options['create_year_max'] )};
    
    /* 基金总额 */
    if (options['money_min'] && options['money_max'])
        where['moneyTotal'] = {[Op.gte]:options['money_min'], [Op.lte]:options['money_max']};
    else if (options['money_min'])
        where['moneyTotal'] = {[Op.gte]:options['money_min']};
    else if (options['money_max'])
        where['moneyTotal'] = {[Op.lte]:options['money_max']};
    
    /* 基金数量 */
    if (options['fund_min'] && options['fund_max'])
        where['foundTotal'] = {[Op.gte]:options['fund_min'], [Op.lte]:options['fund_max']};
    else if (options['fund_min'])
        where['foundTotal'] = {[Op.gte]:options['fund_min']};
    else if (options['fund_max'])
        where['foundTotal'] = {[Op.lte]:options['fund_max']};
    
    /* 经理人数 */
    if (options['manager_min'] && options['manager_max'])
        where['managerTotal'] = {[Op.gte]:options['manager_min'], [Op.lte]:options['manager_max']};
    else if (options['manager_min'])
        where['managerTotal'] = {[Op.gte]:options['manager_min']};
    else if (options['manager_max'])
        where['managerTotal'] = {[Op.lte]:options['manager_max']};
    
    return where;
}

function fund_where_construct(options, company_res)
{
    let where = {};

    /* 创建时间范围 */
    if (options['create_year_min'] && options['create_year_max'])
        where['createDate'] = {[Op.lte]:year_clac( options['create_year_min'] ), [Op.gte]:year_clac( options['create_year_max'] )};
    else if (options['create_year_min'])
        where['createDate'] = {[Op.lte]:year_clac( options['create_year_min'] )};
    else if (options['create_year_max'])
        where['createDate'] = {[Op.gte]:year_clac( options['create_year_max'] )};

    /* 基金总额 */
    if (options['money_min'] && options['money_max'])
        where['moneyUpdate'] = {[Op.gte]:options['money_min'], [Op.lte]:options['money_max']};
    else if (options['money_min'])
        where['moneyUpdate'] = {[Op.gte]:options['money_min']};
    else if (options['money_max'])
        where['moneyUpdate'] = {[Op.lte]:options['money_max']};
    
    /* 属于指定基金公司（上一步的结果）的基金 */
    let codes = company_res.map((x)=>{ return x.code; });
    where['companyId'] = codes;

    return where;
}

/* 执行筛选 */
exports.apply = async (ctx, ops) =>
{
    const FundCompany = ctx.models['fund_company'];
    const FundInfo = ctx.models['fund_info'];
    const FundStatistic = ctx.models['fund_statistic'];
    const FundValue = ctx.models['fund_value'];

    let req = ops.request;

    /* 基金公司筛选 */
    let com_ret = await FundCompany.findAll({
        logging:false, raw:true,
        where: company_where_construct(ops.company)
    });
    if ('company' == req)
        return com_ret;
    
    /* 基金筛选，基于上一步的结果 */
    let fund_ret = await FundInfo.findAll({
        logging:true, raw:true,
        where: fund_where_construct(ops.fund, com_ret)
    });
    if ('fund' == req)
        return fund_ret;
    
    /* 统计值筛选，基于上一步的结果 */
    
}