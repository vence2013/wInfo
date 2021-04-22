/****************************************************************************** 
 * 文件名称 ： fund_info.js
 * 功能说明 ： 基金信息
 * 
 * 创建日期 ： 2019/2/12
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/2/12    - 创建文件。
 *  2021/4/22    - 修改表名称
 *****************************************************************************/ 

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fund_info', {
        code: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true,
            autoIncreament: false,
        },      
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },           
        fullname: {
            type: DataTypes.STRING(255)
        },
        type: {
            type: DataTypes.STRING(255)
        },
        createDate: {
            type: DataTypes.DATE
        },
        createShare: { 
            type: DataTypes.FLOAT
        },        
        moneyUpdate: { 
            type: DataTypes.FLOAT
        },
        moneyUpdateDate: { 
            type: DataTypes.DATE
        },
        shareUpdate: {
            type: DataTypes.FLOAT  
        },
        shareUpdateDate: {
            type: DataTypes.DATE
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}