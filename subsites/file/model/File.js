module.exports = function(sequelize, DataTypes) {
    return sequelize.define('File',  {
        name: {
            type: DataTypes.STRING, // 上传时的文件名称
            allowNull: false
        }, 
        location: {
            type: DataTypes.STRING(255), // 目录按日期存储
            allowNull: false
        },
        // 文件固有属性
        size: {
            type: DataTypes.INTEGER(10), // 字节数
            allowNull: false
        },
        ext: {
            type: DataTypes.STRING(32), // 小写扩展名
            allowNull: true
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}