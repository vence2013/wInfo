/****************************************************************************** 
 * 文件名称 ： fund_filter.js
 * 功能说明 ： 过滤器参数
 * 近一周， 近一月， 近半年， 近一年， 近两年， 近三年， 今年来， 成立来
 * 
 * 创建日期 ： 2019/2/23
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/2/23    - 创建文件。
 *****************************************************************************/ 

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fund_filter', {
        father: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING(255),
        },
        value: {
            type: DataTypes.STRING(255),
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}