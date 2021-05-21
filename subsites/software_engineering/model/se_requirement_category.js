module.exports = (sequelize, DataTypes) => {
    return sequelize.define('se_requirement_category', {
        father: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING(255)
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}