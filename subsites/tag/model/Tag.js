module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Tag', {
        name: {
            type: DataTypes.STRING, 
            allowNull: false,
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
} 
