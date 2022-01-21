module.exports = (sequelize, DataTypes) => {
    return sequelize.define('AUTOSAR_Document', 
    {
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        }, 
        identification: {
            type: DataTypes.INTEGER(10),
        }, 
        status: {
            type: DataTypes.STRING(255),
            allowNull: false
        }, 
        part_of_standard: {
            type: DataTypes.STRING(255),
            allowNull: false
        }, 
        part_of_release: {
            type: DataTypes.STRING(255),
            allowNull: false
        }, 
        introduce: {
            type: DataTypes.BLOB, 
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}