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
import Resident from './resident.model.js';
import ServiceRegistration from './service-registration.model.js';
import Room from './room.model.js';

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
    NgayTaoHopDong: {
        type: DataTypes.DATE,
        allowNull: false
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

/**
 * Static method: Generate next contract ID (HDyyMM###)
 */
Contract.generateId = async () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `HD${yy}${mm}`;

    const lastContract = await Contract.findOne({
        where: sequelize.where(
            sequelize.fn('SUBSTRING', sequelize.col('MaHopDong'), 1, prefix.length),
            '=',
            prefix
        ),
        order: [['MaHopDong', 'DESC']]
    });

    let nextNum = 1;
    if (lastContract) {
        const suffix = lastContract.MaHopDong.slice(prefix.length);
        const parsed = parseInt(suffix, 10);
        if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    return prefix + String(nextNum).padStart(3, '0');
};

/**
 * Static method: Get all active contracts with related data
 */
Contract.getActiveContracts = async () => {
    const [contracts] = await sequelize.query(`SELECT 
        HD.MaHopDong,
        HD.NgayBatDau,
        HD.NgayKetThuc,
        HD.GiaThueChot,
        HD.TrangThai,
        P.TenPhong,
        P.MaNha,
        NT.HoTen AS TenNguoiThue,
        NT.SDT AS SoDienThoai
        FROM hop_dong HD
        INNER JOIN phong_tro P ON HD.MaPhong = P.MaPhong
        INNER JOIN nguoi_thue NT ON HD.MaNguoiThue = NT.MaNguoiThue
        WHERE HD.deleted = 0
        ORDER BY HD.createdAt DESC`);
    return contracts;
};

/**
 * Static method: Get available rooms (ConTrong)
 */
Contract.getAvailableRooms = async () => {
    const [rooms] = await sequelize.query(`SELECT 
        P.MaPhong, 
        P.TenPhong, 
        P.GiaThueHienTai,
        P.SoNguoiToiDa
    FROM phong_tro P
    WHERE P.TrangThai = 'ConTrong'
    AND NOT EXISTS (
        SELECT 1 
        FROM hop_dong HD 
        WHERE HD.MaPhong = P.MaPhong 
        AND HD.TrangThai = 'ConHieuLuc'
    )`);
    return rooms;
};

/**
 * Static method: Get available users (not in active contracts)
 */
Contract.getAvailableUsers = async () => {
    const [users] = await sequelize.query(`
    SELECT 
        NT.MaNguoiThue, 
        NT.HoTen, 
        NT.CCCD, 
        NT.SDT
    FROM nguoi_thue NT
    WHERE NT.deleted = 0 
    AND NOT EXISTS (
        SELECT 1 
        FROM hop_dong HD
        WHERE HD.MaNguoiThue = NT.MaNguoiThue
        AND HD.deleted = 0
        AND HD.TrangThai = 'ConHieuLuc'
        AND HD.NgayBatDau <= CURRENT_DATE()
        AND (HD.NgayKetThuc IS NULL OR HD.NgayKetThuc >= CURRENT_DATE())
    )`);
    return users;
};

/**
 * Static method: Create contract with residents and service registrations
 */
Contract.createWithServices = async (contractData, services, transaction) => {
    const { MaHopDong, MaPhong, MaNguoiThue, NgayBatDau, NgayKetThuc,
            TienCoc, GiaThueChot, SoNguoiO } = contractData;

    // 1. Create contract
    const contract = await Contract.create({
        MaHopDong,
        MaPhong,
        MaNguoiThue,
        NgayBatDau,
        NgayKetThuc,
        NgayTaoHopDong: new Date(),
        TienCoc: parseInt(TienCoc) || 0,
        GiaThueChot: parseInt(GiaThueChot) || 0,
        SoNguoiO: parseInt(SoNguoiO) || 1,
        TrangThai: 'ConHieuLuc'
    }, { transaction });

    // 2. Create resident (cư dân - người đại diện)
    await Resident.create({
        MaHopDong,
        MaNguoiThue,
        VaiTro: 'DaiDien',
        NgayVaoO: NgayBatDau
    }, { transaction });

    // 3. Register services
    if (services && Array.isArray(services) && services.length > 0) {
        for (const service of services) {
            const donGia = (service.price !== "" && service.price !== null && service.price !== undefined)
                ? parseFloat(service.price)
                : null;

            await ServiceRegistration.create({
                MaHopDong,
                MaDichVu: service.serviceId,
                SoLuong: 1,
                DonGiaChot: donGia,
                NgayDangKy: NgayBatDau,
                TrangThai: 1
            }, { transaction });
        }
    }

    // 4. Update room status
    await Room.update(
        { TrangThai: 'DaChoThue' },
        { where: { MaPhong }, transaction }
    );

    return contract;
};

export default Contract;