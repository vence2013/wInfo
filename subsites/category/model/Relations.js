exports.link = async (models)=>{
    // 目录 - 文档
    models['Category'].belongsToMany(models['Document'], {through: 'CategoryDocument'});
    models['Document'].belongsToMany(models['Category'], {through: 'CategoryDocument'});

    // 目录 - 文件
    models['Category'].belongsToMany(models['File'], {through: 'CategoryFile'});
    models['File'].belongsToMany(models['Category'], {through: 'CategoryFile'});    
}