/****************************************************************************** 
 * 文件名称 ： fund_value.js
 * 功能说明 ： 基金净值
 * 
 * 创建日期 ： 2019/2/12
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/2/12    - 创建文件。
 *  2021/4/22    - 修改表名称
 *****************************************************************************/ 

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fund_value', {
        code: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },        
        date: {
            type: DataTypes.DATE
        },
        jz_unit: {
            type: DataTypes.FLOAT  // 单位净值
        }, 
        jz_acc: {
            type: DataTypes.FLOAT  // 累计净值
        },
        jz_grate: {
            type: DataTypes.FLOAT  // 净值增长率
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}