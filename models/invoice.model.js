import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import InvoiceDetail from './invoice-detail.model.js';

const Invoice = sequelize.define('Invoice', {
    MaHoaDon: {
        type: DataTypes.STRING(20),
        primaryKey: true
    },
    MaHopDong: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    NgayLap: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    TuNgay: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    DenNgay: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    TongTien: {
        type: DataTypes.DECIMAL(18, 0),
        defaultValue: 0
    },
    TrangThai: {
        type: DataTypes.STRING(50),
        defaultValue: 'ChuaThanhToan'
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
    tableName: 'hoa_don',
    timestamps: true,
    paranoid: false
});

/**
 * Tạo mã hóa đơn theo format BILLyyMM####
 */
Invoice.generateId = async () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `BILL${yy}${mm}`;

    const [lastRows] = await sequelize.query(
        `SELECT MaHoaDon FROM hoa_don WHERE MaHoaDon LIKE :like ORDER BY MaHoaDon DESC LIMIT 1`,
        { replacements: { like: `${prefix}%` } }
    );

    let nextNum = 1;
    if (lastRows && lastRows.length > 0 && lastRows[0].MaHoaDon) {
        const suffix = lastRows[0].MaHoaDon.slice(prefix.length);
        const parsed = parseInt(suffix, 10);
        if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    return prefix + String(nextNum).padStart(4, '0');
};

/**
 * Lấy danh sách phòng có hợp đồng còn hiệu lực (để tạo hóa đơn)
 */
Invoice.getRoomsForBilling = async () => {
    const [roomsList] = await sequelize.query(`SELECT 
        pt.MaPhong,
        pt.TenPhong,
        pt.GiaThueHienTai,
        nt.HoTen AS NguoiDaiDien,
        nt.SDT,
        hd.MaHopDong,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.GiaThueChot
    FROM phong_tro pt
    INNER JOIN hop_dong hd ON pt.MaPhong = hd.MaPhong
    INNER JOIN nguoi_thue nt ON hd.MaNguoiThue = nt.MaNguoiThue
    WHERE 
        hd.TrangThai = 'ConHieuLuc'
        AND hd.deleted = 0
        AND (hd.NgayKetThuc IS NULL OR hd.NgayKetThuc >= CURRENT_DATE)`);
    return roomsList;
};

/**
 * Lấy dịch vụ đã đăng ký theo hợp đồng
 */
Invoice.getRegisteredServices = async () => {
    const [services] = await sequelize.query(`SELECT 
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
    WHERE dkdv.TrangThai = 1 
        AND dkdv.deleted = 0
        AND dv.deleted = 0`);
    return services;
};

/**
 * Lấy tất cả hóa đơn
 */
Invoice.getAllWithDetails = async () => {
    const [invoices] = await sequelize.query(`SELECT 
        hdon.MaHoaDon,
        hdon.NgayLap,
        hdon.TuNgay,
        hdon.DenNgay,
        hdon.TongTien,
        hdon.TrangThai,
        pt.TenPhong,
        nt.HoTen AS TenNguoiThue
    FROM hoa_don hdon
    INNER JOIN hop_dong hd ON hdon.MaHopDong = hd.MaHopDong
    INNER JOIN phong_tro pt ON hd.MaPhong = pt.MaPhong
    INNER JOIN nguoi_thue nt ON hd.MaNguoiThue = nt.MaNguoiThue
    WHERE hdon.deleted = 0
    ORDER BY hdon.NgayLap DESC`);
    return invoices;
};

/**
 * Lấy chi tiết hóa đơn
 */
Invoice.getDetails = async (maHoaDon) => {
    const [[invoice]] = await sequelize.query(`
        SELECT 
            hdon.MaHoaDon,
            hdon.NgayLap,
            hdon.TuNgay,
            hdon.DenNgay,
            hdon.TongTien,
            hdon.TrangThai,
            hdong.MaHopDong,
            hdong.GiaThueChot,
            pt.TenPhong,
            pt.MaPhong,
            nt.HoTen,
            nt.SDT,
            nt.DiaChi,
            COALESCE((SELECT SUM(SoTienThu) FROM phieu_thu WHERE MaHoaDon = hdon.MaHoaDon AND deleted = 0), 0) AS SoTienDaThu
        FROM hoa_don hdon
        INNER JOIN hop_dong hdong ON hdon.MaHopDong = hdong.MaHopDong
        INNER JOIN phong_tro pt ON hdong.MaPhong = pt.MaPhong
        INNER JOIN nguoi_thue nt ON hdong.MaNguoiThue = nt.MaNguoiThue
        WHERE hdon.MaHoaDon = :maHoaDon AND hdon.deleted = 0
    `, { replacements: { maHoaDon } });
    return invoice;
};

/**
 * Tạo hóa đơn mới với chi tiết
 */
Invoice.createWithDetails = async (invoiceData, roomServiceId, indexServices, otherServices, transaction) => {
    const { MaHoaDon, MaHopDong, NgayLap, TuNgay, DenNgay, TongTien, GiaPhong } = invoiceData;

    // 1. Tạo hóa đơn
    await Invoice.create({
        MaHoaDon,
        MaHopDong,
        NgayLap,
        TuNgay,
        DenNgay,
        TongTien,
        TrangThai: 'ChuaThanhToan'
    }, { transaction });

    // 2. Insert tiền phòng
    await InvoiceDetail.create({
        MaHoaDon,
        MaDichVu: roomServiceId,
        SoLuong: 1,
        DonGiaLuuTru: GiaPhong,
        ThanhTien: GiaPhong
    }, { transaction });

    // 3. Insert dịch vụ có chỉ số (điện, nước)
    if (indexServices && indexServices.length > 0) {
        for (const svc of indexServices) {
            const soLuong = parseFloat(svc.ChiSoMoi) - parseFloat(svc.ChiSoCu);
            await InvoiceDetail.create({
                MaHoaDon,
                MaDichVu: svc.MaDichVu,
                SoLuong: soLuong,
                ChiSoCu: svc.ChiSoCu,
                ChiSoMoi: svc.ChiSoMoi,
                DonGiaLuuTru: svc.DonGia,
                ThanhTien: svc.ThanhTien
            }, { transaction });
        }
    }

    // 4. Insert dịch vụ không có chỉ số được chọn
    if (otherServices && otherServices.length > 0) {
        for (const svc of otherServices) {
            await InvoiceDetail.create({
                MaHoaDon,
                MaDichVu: svc.MaDichVu,
                SoLuong: svc.SoLuong,
                DonGiaLuuTru: svc.DonGia,
                ThanhTien: svc.ThanhTien
            }, { transaction });
        }
    }

    return MaHoaDon;
};

/**
 * Cập nhật trạng thái hóa đơn
 */
Invoice.updateStatus = async (maHoaDon, trangThai, transaction = null) => {
    return await Invoice.update(
        { TrangThai: trangThai },
        { where: { MaHoaDon: maHoaDon }, transaction }
    );
};

/**
 * Đếm số hóa đơn đã thanh toán theo tháng/năm
 */
Invoice.countPaidByMonth = async (month, year) => {
    const [[result]] = await sequelize.query(`
        SELECT COUNT(*) AS soHoaDonDaThu
        FROM hoa_don
        WHERE TrangThai = 'DaThanhToan'
          AND MONTH(NgayLap) = :month
          AND YEAR(NgayLap) = :year
          AND deleted = 0
    `, { replacements: { month, year } });
    return parseInt(result.soHoaDonDaThu) || 0;
};

/**
 * Lấy tổng số tiền còn nợ
 */
Invoice.getTotalDebt = async () => {
    const [[result]] = await sequelize.query(`
        SELECT COALESCE(SUM(hd.TongTien - COALESCE(thu.SoTienDaThu, 0)), 0) AS tongConNo
        FROM hoa_don hd
        LEFT JOIN (
            SELECT MaHoaDon, SUM(SoTienThu) AS SoTienDaThu
            FROM phieu_thu WHERE deleted = 0
            GROUP BY MaHoaDon
        ) thu ON hd.MaHoaDon = thu.MaHoaDon
        WHERE hd.TrangThai != 'DaThanhToan' AND hd.deleted = 0
    `);
    return parseFloat(result.tongConNo) || 0;
};

export default Invoice;
