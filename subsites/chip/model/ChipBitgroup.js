/****************************************************************************** 
 * 文件名称 ： ChipBits.js
 * 功能说明 ： 
 *     位组以列表的形式表现，在前端进行后续处理。
 * 
 * 创建日期 ： 2019/5/27
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/5/27    - 创建文件。
 *****************************************************************************/ 

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ChipBitgroup', {
        name: {
            type: DataTypes.STRING,  
            allowNull: false,
        }, 
        fullname: {
            type: DataTypes.STRING,  
        },
        bitlist: {  /* 位序号列表， 比如"1,2,3"  */
            type: DataTypes.STRING, 
            allowNull: false,
        },
        valuelist: {  /* 复位值列表， 比如"1,0,1,1,1,0,0" */
            type: DataTypes.STRING, 
        },
        rw: {  /* 读写权限 */
            type: DataTypes.STRING, 
        },
        desc: {
            type: DataTypes.BLOB, 
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}