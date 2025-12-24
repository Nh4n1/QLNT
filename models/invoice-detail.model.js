import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InvoiceDetail = sequelize.define('InvoiceDetail', {
    MaChiTiet: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MaHoaDon: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    MaDichVu: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    SoLuong: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    ChiSoCu: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ChiSoMoi: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    DonGiaLuuTru: {
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false
    },
    ThanhTien: {
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false
    },
    GhiChu: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'chi_tiet_hoa_don',
    timestamps: true,
    paranoid: false
});

/**
 * Lấy chi tiết theo mã hóa đơn
 */
InvoiceDetail.getByInvoice = async (maHoaDon) => {
    const [details] = await sequelize.query(`
        SELECT 
            ct.MaChiTiet,
            ct.MaDichVu,
            ct.SoLuong,
            ct.ChiSoCu,
            ct.ChiSoMoi,
            ct.DonGiaLuuTru,
            ct.ThanhTien,
            dv.TenDichVu,
            dv.DonViTinh
        FROM chi_tiet_hoa_don ct
        INNER JOIN dich_vu dv ON ct.MaDichVu = dv.MaDichVu
        WHERE ct.MaHoaDon = :maHoaDon
    `, { replacements: { maHoaDon } });
    return details;
};

export default InvoiceDetail;
