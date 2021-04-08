module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Category', {
        father: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING(255)
        },
        order: {
            type: DataTypes.INTEGER
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}