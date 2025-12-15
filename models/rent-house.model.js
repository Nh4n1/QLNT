import {DataTypes} from 'sequelize';
import sequelize from '../config/database.js';

const RentHouse = sequelize.define('RentHouse',{
    MaNha: {
        type: DataTypes.STRING(20),
        primaryKey: true,
    },
    TenNha:{
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    DiaChi:{
        type: DataTypes.STRING(255)
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,

    },
    deletedAt: { 
        type: DataTypes.DATE,
        allowNull: true,
    }    

},{
    tableName: 'nha_tro',
    timestamps: true,
    paranoid: false,
});

export default RentHouse;