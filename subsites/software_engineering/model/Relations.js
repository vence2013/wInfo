exports.link = async (models)=>{
    // 需求 - 需求分类
    models['se_requirement_category'].belongsToMany(models['se_requirement'], {through: 'se_requirement_category_r'});
    models['se_requirement'].belongsToMany(models['se_requirement_category'], {through: 'se_requirement_category_r'});
}