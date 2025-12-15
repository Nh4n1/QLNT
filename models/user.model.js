// CREATE TABLE NGUOI_THUE (
//     MaNguoiThue INT AUTO_INCREMENT PRIMARY KEY,
//     CCCD VARCHAR(20) NOT NULL UNIQUE,
//     HoTen VARCHAR(100) NOT NULL,
//     SDT VARCHAR(20),
//     Email VARCHAR(100),
//     -- Audit & Soft Delete (CamelCase)
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     deleted BOOLEAN DEFAULT FALSE,
//     deletedAt TIMESTAMP NULL DEFAULT NULL
// );
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
export const User = sequelize.define('User', {
    MaNguoiThue: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    CCCD: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    HoTen: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    SDT: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
   tableName: 'nguoi_thue',
    timestamps: true,
    paranoid: false,
});

export default User;