/****************************************************************************** 
 * 文件名称 ： Chip.js
 * 功能说明 ： 
 * 
 * 创建日期 ： 2019/5/27
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/5/27    - 创建文件。
 *****************************************************************************/ 

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Chip', {
        name: {
            type: DataTypes.STRING,  
            allowNull: false,
        }, 
        width: {
            type: DataTypes.INTEGER, 
            allowNull: false,
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}