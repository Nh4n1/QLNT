import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Receipt = sequelize.define('Receipt', {
    MaPhieuThu: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MaHoaDon: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    NgayThu: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    SoTienThu: {
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false
    },
    HinhThuc: {
        type: DataTypes.STRING(50),
        defaultValue: 'TienMat'
    },
    GhiChu: {
        type: DataTypes.STRING(255),
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
    tableName: 'phieu_thu',
    timestamps: true,
    paranoid: false
});

/**
 * Lấy tổng tiền đã thu theo hóa đơn
 */
Receipt.getTotalByInvoice = async (maHoaDon) => {
    const [[result]] = await sequelize.query(
        `SELECT COALESCE(SUM(SoTienThu), 0) AS total FROM phieu_thu WHERE MaHoaDon = :maHoaDon AND deleted = 0`,
        { replacements: { maHoaDon } }
    );
    return parseFloat(result.total) || 0;
};

/**
 * Tạo phiếu thu mới
 */
Receipt.createReceipt = async (data, transaction = null) => {
    return await Receipt.create(data, { transaction });
};

/**
 * Lấy danh sách phiếu thu theo tháng/năm
 */
Receipt.getByMonth = async (month, year) => {
    const [receipts] = await sequelize.query(`
        SELECT 
            pt.MaPhieuThu,
            pt.NgayThu,
            pt.SoTienThu,
            pt.HinhThuc,
            pt.GhiChu,
            hd.MaHoaDon,
            phong.TenPhong,
            nt.HoTen AS TenKhachThue
        FROM phieu_thu pt
        INNER JOIN hoa_don hd ON pt.MaHoaDon = hd.MaHoaDon
        INNER JOIN hop_dong hdong ON hd.MaHopDong = hdong.MaHopDong
        INNER JOIN phong_tro phong ON hdong.MaPhong = phong.MaPhong
        INNER JOIN nguoi_thue nt ON hdong.MaNguoiThue = nt.MaNguoiThue
        WHERE MONTH(pt.NgayThu) = :month
          AND YEAR(pt.NgayThu) = :year
          AND pt.deleted = 0
        ORDER BY pt.NgayThu DESC, pt.MaPhieuThu DESC
    `, { replacements: { month, year } });
    return receipts;
};

/**
 * Lấy tổng doanh thu theo tháng/năm
 */
Receipt.getTotalRevenueByMonth = async (month, year) => {
    const [[result]] = await sequelize.query(`
        SELECT COALESCE(SUM(SoTienThu), 0) AS tongDoanhThu
        FROM phieu_thu
        WHERE MONTH(NgayThu) = :month
          AND YEAR(NgayThu) = :year
          AND deleted = 0
    `, { replacements: { month, year } });
    return parseFloat(result.tongDoanhThu) || 0;
};

export default Receipt;
