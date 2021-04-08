exports.link = async (models)=>{
    // 文档
    models['Tag'].belongsToMany(models['Document'], {through: 'TagDocument'});
    models['Document'].belongsToMany(models['Tag'], {through: 'TagDocument'});    

    // 文件
    models['Tag'].belongsToMany(models['File'], {through: 'TagFile'});
    models['File'].belongsToMany(models['Tag'], {through: 'TagFile'});    
}