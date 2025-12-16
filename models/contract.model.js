// CREATE TABLE HOP_DONG (
//     MaHopDong VARCHAR(20) PRIMARY KEY,
//     MaPhong VARCHAR(20) NOT NULL,
//     MaNguoiThue INT NOT NULL,
//     NgayBatDau DATE NOT NULL,
//     NgayKetThuc DATE,
//     TienCoc DECIMAL(18, 0) DEFAULT 0,
//     GiaThueChot DECIMAL(18, 0) NOT NULL,
//     SoNguoiO INT DEFAULT 1,
//     TrangThai VARCHAR(50) DEFAULT 'ConHieuLuc',
//     -- Audit & Soft Delete (CamelCase)
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     deleted BOOLEAN DEFAULT FALSE,
//     deletedAt TIMESTAMP NULL DEFAULT NULL,
//     FOREIGN KEY (MaPhong) REFERENCES PHONG_TRO(MaPhong),
//     FOREIGN KEY (MaNguoiThue) REFERENCES NGUOI_THUE(MaNguoiThue)
// );

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
const Contract = sequelize.define('Contract', {
    MaHopDong: {
        type: DataTypes.STRING(20),
        primaryKey: true
    },
    MaPhong: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    MaNguoiThue: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    NgayBatDau: {
        type: DataTypes.DATE,
        allowNull: false
    },
    NgayKetThuc: {
        type: DataTypes.DATE,
        allowNull: true
    },
    TienCoc: {
        type: DataTypes.DECIMAL(18, 0),
        defaultValue: 0
    },
    GiaThueChot: {
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false
    },
    SoNguoiO: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    TrangThai: {
        type: DataTypes.STRING(50),
        defaultValue: 'ConHieuLuc'
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'hop_dong',
    timestamps: true,
    paranoid: false
});

export default Contract;