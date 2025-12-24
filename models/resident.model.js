import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const Resident = sequelize.define('Resident', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MaHopDong: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    MaNguoiThue: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    VaiTro: {
        type: DataTypes.STRING(20),
        defaultValue: 'ThanhVien'
    },
    NgayVaoO: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    NgayRoiDi: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'cu_dan',
    timestamps: true,
    paranoid: false
});

/**
 * Lấy danh sách cư dân đang ở theo hợp đồng
 */
Resident.getActiveByContract = async (maHopDong) => {
    return await Resident.findAll({
        where: {
            MaHopDong: maHopDong,
            deleted: false,
            NgayRoiDi: null
        }
    });
};

/**
 * Thêm cư dân vào hợp đồng
 */
Resident.addToContract = async (data, transaction = null) => {
    return await Resident.create(data, { transaction });
};

/**
 * Kiểm tra người thuê đã là cư dân trong phòng nào chưa
 */
Resident.isActiveResident = async (maNguoiThue) => {
    const resident = await Resident.findOne({
        where: {
            MaNguoiThue: maNguoiThue,
            deleted: false,
            [Op.or]: [
                { NgayRoiDi: null },
                { NgayRoiDi: { [Op.gt]: sequelize.literal('CURRENT_DATE') } }
            ]
        }
    });
    return !!resident;
};

/**
 * Kiểm tra hợp đồng có tồn tại và đang active
 */
Resident.checkValidContract = async (maHopDong, maPhong) => {
    const [results] = await sequelize.query(`
        SELECT * FROM hop_dong 
        WHERE MaHopDong = :maHopDong 
        AND MaPhong = :maPhong
        AND deleted = 0
        AND TrangThai = 'ConHieuLuc'
    `, { replacements: { maHopDong, maPhong } });
    return results.length > 0;
};

export default Resident;
