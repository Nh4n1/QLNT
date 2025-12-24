// CREATE TABLE PHONG_TRO (
//     MaPhong VARCHAR(20) PRIMARY KEY,
//     MaNha VARCHAR(20) NOT NULL,
//     TenPhong VARCHAR(50) NOT NULL,
//     GiaThueHienTai DECIMAL(18, 0) DEFAULT 0,
//     SoNguoiToiDa INT DEFAULT 1,
//     TrangThai VARCHAR(50) DEFAULT 'ConTrong',
//     -- Audit & Soft Delete (CamelCase)
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     deleted BOOLEAN DEFAULT FALSE,
//     deletedAt TIMESTAMP NULL DEFAULT NULL,
//     FOREIGN KEY (MaNha) REFERENCES NHA_TRO(MaNha)
// );
import {DataTypes} from 'sequelize';
import sequelize from '../config/database.js';

const Room = sequelize.define('Room',{
    MaPhong:{
        type: DataTypes.STRING(20),
        primaryKey: true,
    },
    MaNha:{
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    TenPhong:{
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    GiaThueHienTai:{
        type: DataTypes.DECIMAL(18,0),
        defaultValue: 0,
    },
    SoNguoiToiDa:{
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    TrangThai:{
        type: DataTypes.STRING(50),
        defaultValue: 'ConTrong',
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
    tableName: 'phong_tro',
    timestamps: true,
    paranoid: false,
});

/**
 * Lấy danh sách phòng với thông tin hợp đồng và người thuê
 */
Room.getListWithContracts = async () => {
    const [results] = await sequelize.query(`
        SELECT 
            P.MaPhong,
            P.TenPhong,
            P.TrangThai AS TrangThaiPhong,
            NT.HoTen AS TenKhachHang,
            NT.SDT AS SoDienThoai,
            P.GiaThueHienTai,
            HD.TienCoc,
            COALESCE(HD.GiaThueChot, P.GiaThueHienTai) AS GiaHienThi,
            HD.NgayKetThuc
        FROM phong_tro P
        LEFT JOIN hop_dong HD 
            ON P.MaPhong = HD.MaPhong 
            AND HD.TrangThai = 'ConHieuLuc' 
            AND HD.deleted = 0
        LEFT JOIN nguoi_thue NT 
            ON HD.MaNguoiThue = NT.MaNguoiThue 
            AND NT.deleted = 0
        WHERE P.deleted = 0
        ORDER BY P.MaPhong ASC
    `);
    return results;
};

/**
 * Tạo phòng mới
 */
Room.createRoom = async (data) => {
    const timestamp = Date.now().toString().slice(-5);
    const MaPhong = `P_${timestamp}`;
    
    return await Room.create({
        MaPhong,
        MaNha: data.MaNha,
        TenPhong: data.TenPhong,
        GiaThueHienTai: data.GiaThueHienTai || 0,
        SoNguoiToiDa: data.SoNguoiToiDa || 1,
        TrangThai: 'ConTrong'
    });
};

/**
 * Lấy số phòng đang cho thuê
 */
Room.countRented = async () => {
    return await Room.count({
        where: {
            TrangThai: 'DaChoThue',
            deleted: false
        }
    });
};

export default Room;