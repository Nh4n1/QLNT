import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ServiceRegistration = sequelize.define('ServiceRegistration', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MaHopDong: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    MaDichVu: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    SoLuong: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    DonGiaChot: {
        type: DataTypes.DECIMAL(18, 0),
        allowNull: true
    },
    NgayDangKy: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    NgayKetThuc: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    TrangThai: {
        type: DataTypes.TINYINT,
        defaultValue: 1
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'dang_ky_dich_vu',
    timestamps: true,
    paranoid: false
});

/**
 * Lấy dịch vụ đăng ký theo hợp đồng
 */
ServiceRegistration.getByContract = async (maHopDong) => {
    const [results] = await sequelize.query(`
        SELECT 
            dkdv.Id,
            dkdv.MaHopDong,
            dkdv.MaDichVu,
            dkdv.SoLuong,
            dkdv.DonGiaChot,
            dv.TenDichVu,
            dv.DonGiaHienTai,
            dv.DonViTinh,
            dv.LoaiDichVu
        FROM dang_ky_dich_vu dkdv
        INNER JOIN dich_vu dv ON dkdv.MaDichVu = dv.MaDichVu
        WHERE dkdv.MaHopDong = :maHopDong
            AND dkdv.TrangThai = 1 
            AND dkdv.deleted = 0
            AND dv.deleted = 0
    `, { replacements: { maHopDong } });
    return results;
};

/**
 * Đăng ký dịch vụ cho hợp đồng
 */
ServiceRegistration.registerService = async (data, transaction = null) => {
    return await ServiceRegistration.create(data, { transaction });
};

export default ServiceRegistration;
