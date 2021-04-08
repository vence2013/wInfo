module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Document', {
        content: {
            type: DataTypes.BLOB, 
            allowNull: false, 
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}