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

// Sequelize Model (giữ lại cho tương thích ngược)
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
})

// ============================================
// ROOM MODEL - DAL (Data Access Layer)
// ============================================

export class RoomModel {
    /**
     * Lấy danh sách tất cả phòng với thông tin hợp đồng
     */
    static async getAllRoomsWithContracts() {
        const [roomList] = await sequelize.query(
        `SELECT 
            P.MaPhong,
            P.TenPhong,
            P.TrangThai AS TrangThaiPhong,
            NT.HoTen AS TenKhachHang,
            NT.SDT AS SoDienThoai,
            P.GiaThueHienTai,
            HD.TienCoc,
            COALESCE(HD.GiaThueChot, P.GiaThueHienTai) AS GiaHienThi,
            HD.NgayKetThuc
        FROM PHONG_TRO P
        LEFT JOIN HOP_DONG HD 
            ON P.MaPhong = HD.MaPhong 
            AND HD.TrangThai = 'ConHieuLuc' 
            AND HD.deleted = 0
        LEFT JOIN NGUOI_THUE NT 
            ON HD.MaNguoiThue = NT.MaNguoiThue 
            AND NT.deleted = 0
        WHERE P.deleted = 0
        ORDER BY P.MaPhong ASC;`
        );
        return roomList;
    }

    /**
     * Tạo phòng mới
     */
    static async createRoom(roomData) {
        const { MaPhong, MaNha, TenPhong, GiaThueHienTai, SoNguoiToiDa } = roomData;

        const newRoom = await Room.create({
            MaPhong: MaPhong,
            MaNha: MaNha,
            TenPhong: TenPhong,
            GiaThueHienTai: GiaThueHienTai || 0,
            SoNguoiToiDa: SoNguoiToiDa || 1,
            TrangThai: 'ConTrong'
        });

        return newRoom;
    }
}

export default Room;