import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const Service = sequelize.define('Service', {
    MaDichVu: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    TenDichVu: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    DonGiaHienTai: {
        type: DataTypes.DECIMAL(18, 0),
        defaultValue: 0
    },
    DonViTinh: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    LoaiDichVu: {
        type: DataTypes.STRING(20),
        defaultValue: 'KhongChiSo'
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
    tableName: 'dich_vu',
    timestamps: true,
    paranoid: false
});

/**
 * Lấy tất cả dịch vụ (trừ TienPhong)
 */
Service.getAllActive = async () => {
    return await Service.findAll({
        where: {
            deleted: false,
            LoaiDichVu: { [Op.ne]: 'TienPhong' }
        },
        order: [['TenDichVu', 'ASC']]
    });
};

/**
 * Lấy dịch vụ tiền phòng (hoặc tạo nếu chưa có)
 */
Service.getRoomService = async (transaction = null) => {
    let roomService = await Service.findOne({
        where: { TenDichVu: 'Tiền phòng', deleted: false }
    });

    if (!roomService) {
        roomService = await Service.create({
            TenDichVu: 'Tiền phòng',
            DonGiaHienTai: 0,
            DonViTinh: 'Phòng',
            LoaiDichVu: 'TienPhong'
        }, { transaction });
    }

    return roomService;
};

/**
 * Tạo dịch vụ mới
 */
Service.createService = async (data) => {
    return await Service.create(data);
};

/**
 * Cập nhật dịch vụ
 */
Service.updateService = async (id, data) => {
    return await Service.update(data, {
        where: { MaDichVu: id }
    });
};

/**
 * Xóa mềm dịch vụ
 */
Service.softDelete = async (id) => {
    return await Service.update(
        { deleted: true, deletedAt: new Date() },
        { where: { MaDichVu: id } }
    );
};

export default Service;
