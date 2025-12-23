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

// Sequelize Model (giữ lại cho tương thích ngược)
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

// ============================================
// CONTRACT MODEL - DAL (Data Access Layer)
// ============================================

export class ContractModel {
    /**
     * Lấy danh sách tất cả hợp đồng
     */
    static async getAllContracts() {
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
        FROM HOP_DONG HD
        INNER JOIN PHONG_TRO P ON HD.MaPhong = P.MaPhong
        INNER JOIN NGUOI_THUE NT ON HD.MaNguoiThue = NT.MaNguoiThue
        WHERE HD.deleted = 0
        ORDER BY HD.createdAt DESC;`);

        return contracts;
    }

    /**
     * Lấy danh sách phòng trống
     */
    static async getAvailableRooms() {
        const [rooms] = await sequelize.query(`SELECT 
            P.MaPhong, 
            P.TenPhong, 
            P.GiaThueHienTai,
            P.SoNguoiToiDa
        FROM PHONG_TRO P
        WHERE P.TrangThai = 'ConTrong'
        AND NOT EXISTS (
            SELECT 1 
            FROM HOP_DONG HD 
            WHERE HD.MaPhong = P.MaPhong 
            AND HD.TrangThai = 'ConHieuLuc'
        );`);

        return rooms;
    }

    /**
     * Lấy danh sách người dùng chưa có hợp đồng hoạt động
     */
    static async getAvailableUsers() {
        const [users] = await sequelize.query(`
            SELECT 
                NT.MaNguoiThue, 
                NT.HoTen, 
                NT.CCCD, 
                NT.SDT
            FROM NGUOI_THUE NT
            WHERE NT.deleted = 0 
            AND NOT EXISTS (
                SELECT 1 
                FROM HOP_DONG HD
                WHERE HD.MaNguoiThue = NT.MaNguoiThue
                AND HD.deleted = 0
                AND HD.TrangThai = 'ConHieuLuc'
                AND HD.NgayBatDau <= CURRENT_DATE()
                AND (HD.NgayKetThuc IS NULL OR HD.NgayKetThuc >= CURRENT_DATE())
            );`);

        return users;
    }

    /**
     * Lấy danh sách dịch vụ không phải tiền phòng
     */
    static async getServices() {
        const [services] = await sequelize.query(
            `SELECT * FROM dich_vu WHERE deleted = 0 AND LoaiDichVu != 'TienPhong';`
        );

        return services;
    }

    /**
     * Tạo hợp đồng mới
     */
    static async createContract(data, transaction) {
        const timestamp = Date.now().toString().slice(-5);
        const MaHopDong = `HD_${timestamp}`;
        const {
            MaPhong, MaNguoiThue, NgayBatDau, NgayKetThuc,
            TienCoc, GiaThueChot, SoNguoiO, services
        } = data;
        const NgayTaoHopDong = new Date();

        // 1. INSERT hợp đồng
        await sequelize.query(`
            INSERT INTO HOP_DONG (
                MaHopDong, MaPhong, MaNguoiThue, 
                NgayBatDau, NgayKetThuc, 
                NgayTaoHopDong, TienCoc, GiaThueChot, SoNguoiO,
                TrangThai, deleted
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
            replacements: [
                MaHopDong, MaPhong, MaNguoiThue,
                NgayBatDau, NgayKetThuc,
                NgayTaoHopDong,
                parseInt(TienCoc), parseInt(GiaThueChot), parseInt(SoNguoiO),
                'ConHieuLuc', 0
            ],
            type: sequelize.QueryTypes.INSERT,
            transaction
        });

        // 2. INSERT cư dân
        await sequelize.query(`
            INSERT INTO CU_DAN (
                MaHopDong, MaNguoiThue, VaiTro, 
                NgayVaoO, DangKyTamTru
            )
            VALUES (?, ?, ?, ?, ?)
        `, {
            replacements: [
                MaHopDong,    
                MaNguoiThue,  
                'DaiDien',     
                NgayBatDau,   
                0           
            ],
            type: sequelize.QueryTypes.INSERT,
            transaction
        });

        // 3. INSERT dịch vụ đăng ký
        if (services && services.length > 0) {
            for (const service of services) {
                let donGia = null;
                if (service.price !== "" && service.price !== null && service.price !== undefined) {
                    donGia = parseFloat(service.price);
                }

                await sequelize.query(`
                    INSERT INTO DANG_KY_DICH_VU (
                        MaHopDong, MaDichVu, 
                        SoLuong, DonGiaChot, 
                        NgayDangKy, TrangThai
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        MaHopDong, service.serviceId,
                        1, donGia,
                        NgayBatDau, 1
                    ],
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                });
            }
        }

        // 4. Cập nhật trạng thái phòng
        await sequelize.query(`
            UPDATE PHONG_TRO 
            SET TrangThai = 'DaChoThue' 
            WHERE MaPhong = ?
        `, {
            replacements: [MaPhong],
            type: sequelize.QueryTypes.UPDATE,
            transaction
        });

        return MaHopDong;
    }
}

export default Contract;