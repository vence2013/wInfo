const moment = require('moment');
const Sequelize = require('sequelize');
const { opts } = require('../route/filter');
const Op = Sequelize.Op; 


function where_date_range(values, db_key, val_key)
{
    let ret = {};
    let min = val_key+'_min', max = val_key+'_max';

    let year = (new Date).getFullYear();
    let year_min = moment((year - values[ min ]) + '-01-01', moment.ISO_8601),
        year_max = moment((year - values[ max ]) + '-01-01', moment.ISO_8601);

    if (values[ min ] && values[ max ])
        ret[ db_key ] = {[Op.lte]:year_min, [Op.gte]:year_max};
    else if (values[ min ])
        ret[ db_key ] = {[Op.lte]:year_min};
    else if (values[ max ])
        ret[ db_key ] = {[Op.gte]:year_max};

    return ret;
}

function where_value_range(values, db_key, val_key)
{
    let ret = {};
    let min = val_key+'_min', max = val_key+'_max';

    if (values[ min ] && values[ max ])
        ret[ db_key ] = {[Op.gte]:values[ min ], [Op.lte]:values[ max ]};
    else if (values[ min ])
        ret[ db_key ] = {[Op.gte]:values[ min ]};
    else if (values[ max ])
        ret[ db_key ] = {[Op.lte]:values[ max ]};

    return ret;
}

function where_count_range(values, db_key, val_key)
{
    let ret;
    let min = val_key+'_min', max = val_key+'_max';

    if (values[ min ] && values[ max ])
        ret = Sequelize.literal('count(*)>='+values[ min ]+' AND count(*)<='+values[ max ]);
    else if (values[ min ])
        ret = Sequelize.literal('count(*)>='+values[ min ]);
    else if (values[ max ])
        ret = Sequelize.literal('count(*)<='+values[ max ]);

    return ret;
}

/* 执行筛选 */
exports.apply = async (ctx, ops) =>
{
    const FundCompany = ctx.models['fund_company'];
    const FundInfo = ctx.models['fund_info'];
    const FundStatistic = ctx.models['fund_statistic'];
    const FundValue = ctx.models['fund_value'];
    let codes;

    let req = ops.request;

    /* 基金公司筛选 */
    let where_com = {};
    Object.assign(where_com, where_date_range(ops.company, 'createDate', 'create_year')); // 创建时间范围
    Object.assign(where_com, where_value_range(ops.company, 'moneyTotal', 'money')); // 基金总额
    Object.assign(where_com, where_value_range(ops.company, 'foundTotal', 'fund'));  // 基金数量 
    Object.assign(where_com, where_value_range(ops.company, 'managerTotal', 'manager')); // 经理人数
    let com_ret = await FundCompany.findAll({
        logging:false, raw:true, 
        attributes: ['code'],
        where: where_com
    });
    codes = com_ret.map((x)=>{ return x.code; });
    if ('company' == req)
        return await FundCompany.findAll({logging:false, raw:true, where:{'code':codes}});
    
    /* 基金筛选，基于上一步的结果 */
    let where_fund = {};
    where_fund['companyId'] = codes; // 属于指定基金公司（上一步的结果）的基金
    Object.assign(where_fund, where_date_range(ops.fund, 'createDate', 'create_year'));  // 创建时间范围
    Object.assign(where_fund, where_value_range(ops.fund, 'moneyUpdate', 'money'));  // 基金总额
    let fund_ret = await FundInfo.findAll({
        logging:false, raw:true, 
        attributes: ['code'],
        where:where_fund 
    });
    codes = fund_ret.map((x)=>{ return x.code; });
    if ('fund' == req)
        return await FundInfo.findAll({logging:false, raw:true, where:{'code':codes}});
    
    /* 统计值筛选，基于上一步的结果 */
    let where_stat = {};
    where_stat['code'] = codes; // 属于指定范围的基金（上一步的结果）
    Object.assign(where_stat, where_value_range(ops.statistic, 'lastWeek', 'week1'));  // 近1周
    Object.assign(where_stat, where_value_range(ops.statistic, 'lastMonth', 'month1'));  // 近1月
    Object.assign(where_stat, where_value_range(ops.statistic, 'lastQuarter', 'month3'));  // 近3月
    Object.assign(where_stat, where_value_range(ops.statistic, 'lastHalfYear', 'month6'));  // 近6月
    Object.assign(where_stat, where_value_range(ops.statistic, 'last1Year', 'year1'));  // 近1年
    Object.assign(where_stat, where_value_range(ops.statistic, 'last2Year', 'year2'));  // 近2年
    Object.assign(where_stat, where_value_range(ops.statistic, 'last3Year', 'year3'));  // 近3年
    Object.assign(where_stat, where_value_range(ops.statistic, 'fromCreate', 'from_start'));  // 成立来
    let stat_ret = await FundStatistic.findAll({
        logging:false, raw:true, 
        attributes: ['code'],
        where:where_stat
    });
    codes = stat_ret.map((x)=>{ return x.code; });
    if ('statistic' == req)
        return await FundInfo.findAll({logging:false, raw:true, where:{'code':codes}});

    /* 净值筛选，基于上一步的结果 */
    let year = (new Date).getFullYear();
    let min_having = where_count_range(ops.value, '', 'inc_min_count');
    if (min_having)
    {
        let min_year = moment((year - ops.value['inc_min_year']) + '-01-01', moment.ISO_8601);

        let min_ret = await FundValue.findAll({
            logging:false, raw:true, 
            attributes: ['code'], group:'code', having:min_having,
            where: {
                'date':{[Op.gte]:min_year},
                'jz_grate':{[Op.gte]: ops.value['inc_min']}, 
                'code':codes // 属于指定范围的基金（上一步的结果）
            }
        });
        codes = min_ret.map((x)=>{ return x.code; });
    }
    let max_having = where_count_range(ops.value, '', 'inc_max_count');
    if (max_having)
    {
        let min_year = moment((year - ops.value['inc_max_year']) + '-01-01', moment.ISO_8601);

        let max_ret = await FundValue.findAll({
            logging:false, raw:true, 
            attributes: ['code'], group:'code', having:min_having,
            where: {
                'date':{[Op.gte]:min_year},
                'jz_grate':{[Op.gte]: ops.value['inc_max']}, 
                'code':codes // 属于指定范围的基金（上一步的结果）
            } 
        });
        codes = max_ret.map((x)=>{ return x.code; });
    }

    return await FundInfo.findAll({logging:false, raw:true, where:{'code':codes}});
}

exports.add = async (ctx, title, value) =>
{
    const fund_filter = ctx.models['fund_filter'];

    let [ret, created] = await fund_filter.findOrCreate({
        logging:false, 
        where: {'father':0, 'name':'title', 'value':title}
    });
    let id_title = ret.get({plain:true}).id;

    /* 如果当前已存在，则删除之前的配置数据 */
    if (!created)
        await fund_filter.destroy({
            logging:false,
            where:{'father':id_title}
        });

    /* 将过滤配置转换为数组
     * 比如，['request']:x,  ['company.fund_min']:x, ...
     */
    let objs = [];
    for (l1 in value)
    {
        if ('object' == typeof(value[ l1 ]))
        {
            let obj2 = value[ l1 ];
            for (l2 in obj2)
            {
                let k2 = l1 + '.' + l2;
                objs.push({'father':id_title, 'name':k2, 'value':obj2[ l2 ]});
            }
        } else 
            objs.push({'father':id_title, 'name':l1, 'value':value[ l1 ]});
    }

    await fund_filter.bulkCreate(objs, {logging: false});
    return true;
}

exports.list = async (ctx) =>
{
    const fund_filter = ctx.models['fund_filter'];

    return await fund_filter.findAll({
        logging:false, raw:true,
        where:{'father':0}
    });
}

exports.detail = async (ctx, id) =>
{
    const fund_filter = ctx.models['fund_filter'];

    let ret = await fund_filter.findAll({
        logging:false, raw:true,
        where:{'father':id}
    });

    /* 将数组记录构建为对象 */
    let obj = {};
    for (i = 0; i < ret.length; i++)
    {
        let idx = ret[i]['name'];

        if (idx.indexOf('.') == -1)
            obj[ idx ] = ret[i]['value'];
        else 
        {
            let indexs = idx.split('.');
            let k1 = indexs[0], k2 = indexs[1];
            if (!obj[ k1]) obj[ k1] = {};
            obj[ k1 ][ k2] = ret[i]['value'];
        }
    }

    return obj;
}

exports.delete = async (ctx, id) =>
{
    const fund_filter = ctx.models['fund_filter'];

    /* 删除该配置的所有数据 */
    await fund_filter.destroy({
        logging:false, raw:true,
        where:{'father':id}
    });

    return await fund_filter.destroy({
        logging:false, raw:true,
        where:{'id':id}
    });
}