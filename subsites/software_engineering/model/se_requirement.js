module.exports = (sequelize, DataTypes) => {
    return sequelize.define('se_requirement', {
        id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true,
            autoIncreament: false,
        },
        category_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true,
            autoIncreament: false,            
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false, 
        },
        desc: {
            type: DataTypes.BLOB, 
        },
        comment: {
            type: DataTypes.BLOB, 
        },
        importance: { 
            type: DataTypes.INTEGER
        },
        sources: {
            type: DataTypes.STRING(255)  // 来源于其他需求的ID列表，用','隔开
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}