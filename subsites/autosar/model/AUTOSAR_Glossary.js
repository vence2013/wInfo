module.exports = (sequelize, DataTypes) => {
    return sequelize.define('AUTOSAR_Glossary', 
    {
        term: {
            type: DataTypes.STRING(255),
            allowNull: false
        }, 
        definition: {
            type: DataTypes.BLOB,
            allowNull: false
        }, 
        initiator: {
            type: DataTypes.BLOB,
        }, 
        further_explanation: {
            type: DataTypes.BLOB,
        }, 
        comment: {
            type: DataTypes.BLOB,
        }, 
        example: {
            type: DataTypes.BLOB, 
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}