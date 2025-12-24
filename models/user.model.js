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
import { DataTypes, Op } from 'sequelize';
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
    GioiTinh: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    NgaySinh: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    SDT: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    DiaChi: {
        type: DataTypes.STRING(255),
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

/**
 * Lấy tất cả người thuê chưa bị xóa
 */
User.getAllActive = async () => {
    return await User.findAll({
        where: { deleted: false },
        raw: true
    });
};

/**
 * Kiểm tra CCCD đã tồn tại chưa
 */
User.findByCCCD = async (cccd) => {
    return await User.findOne({
        where: { CCCD: cccd, deleted: false },
        raw: true
    });
};

/**
 * Tạo người thuê mới
 */
User.createUser = async (data) => {
    return await User.create(data);
};

/**
 * Lấy người thuê theo ID
 */
User.getById = async (id) => {
    return await User.findOne({
        where: { MaNguoiThue: id, deleted: false },
        raw: true
    });
};

/**
 * Lấy danh sách người thuê chưa là cư dân trong bất kỳ phòng nào
 */
User.getAvailableUsers = async () => {
    const [results] = await sequelize.query(`
        SELECT nt.* 
        FROM nguoi_thue nt
        LEFT JOIN cu_dan cd ON nt.MaNguoiThue = cd.MaNguoiThue
            AND cd.deleted = FALSE
            AND (cd.NgayRoiDi IS NULL OR cd.NgayRoiDi > CURRENT_DATE)
        WHERE nt.deleted = FALSE
            AND cd.MaNguoiThue IS NULL
        ORDER BY nt.HoTen ASC
    `);
    return results;
};

/**
 * Lấy danh sách phòng cùng với thông tin cư dân
 */
User.getRoomListWithUsers = async () => {
    const [results] = await sequelize.query(`
        SELECT 
            pt.MaPhong,
            pt.TenPhong,
            ntr.TenNha,
            hd.MaHopDong,
            hd.soNguoiO,
            nt.HoTen AS TenCuDan,
            nt.CCCD,
            nt.SDT,
            cd.VaiTro,
            cd.NgayVaoO,
            nt.NgaySinh,
            nt.GioiTinh,
            nt.DiaChi,
            hd.TrangThai AS TrangThaiHD
        FROM phong_tro pt
        JOIN nha_tro ntr ON pt.MaNha = ntr.MaNha
        JOIN hop_dong hd ON pt.MaPhong = hd.MaPhong
        JOIN cu_dan cd ON hd.MaHopDong = cd.MaHopDong
        JOIN nguoi_thue nt ON cd.MaNguoiThue = nt.MaNguoiThue
        WHERE 
            hd.deleted = FALSE 
            AND hd.TrangThai = 'ConHieuLuc'
            AND cd.deleted = FALSE
            AND (cd.NgayRoiDi IS NULL OR cd.NgayRoiDi >= CURRENT_DATE)
        ORDER BY 
            pt.TenPhong ASC, 
            cd.VaiTro ASC
    `);
    return results;
};

export default User;