/* 
 * 文件名称 ： Relations.js
 * 功能说明 ： 
 * 
 * 创建日期 ： 2019/5/27
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/5/27    - created.
 */

exports.link = async (models)=>{
    // 芯片/模块/寄存器/位组的关系
    models['ChipModule'].belongsTo(models['Chip'], {onDelete: 'CASCADE'});
    models['ChipRegister'].belongsTo(models['ChipModule'], {onDelete: 'CASCADE'});    
    models['ChipBitgroup'].belongsTo(models['ChipRegister'], {onDelete: 'CASCADE'}); 
}