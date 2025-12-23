import sequelize from '../config/database.js';

export class RevenueModel {
    /**
     * Lấy tổng doanh thu theo tháng/năm
     */
    static async getTotalRevenue(month, year) {
        const [[result]] = await sequelize.query(`
            SELECT COALESCE(SUM(SoTienThu), 0) AS tongDoanhThu
            FROM PHIEU_THU
            WHERE MONTH(NgayThu) = :month
              AND YEAR(NgayThu) = :year
              AND deleted = 0
        `, { replacements: { month, year } });

        return parseFloat(result.tongDoanhThu) || 0;
    }

    /**
     * Lấy số hóa đơn đã thanh toán đủ
     */
    static async getCompletePaidInvoices(month, year) {
        const [[result]] = await sequelize.query(`
            SELECT COUNT(*) AS soHoaDonDaThu
            FROM HOA_DON
            WHERE TrangThai = 'DaThanhToan'
              AND MONTH(NgayLap) = :month
              AND YEAR(NgayLap) = :year
              AND deleted = 0
        `, { replacements: { month, year } });

        return parseInt(result.soHoaDonDaThu) || 0;
    }

    /**
     * Lấy tổng tiền còn nợ
     */
    static async getTotalDebt() {
        const [[result]] = await sequelize.query(`
            SELECT COALESCE(SUM(hd.TongTien - COALESCE(thu.SoTienDaThu, 0)), 0) AS tongConNo
            FROM HOA_DON hd
            LEFT JOIN (
                SELECT MaHoaDon, SUM(SoTienThu) AS SoTienDaThu
                FROM PHIEU_THU WHERE deleted = 0
                GROUP BY MaHoaDon
            ) thu ON hd.MaHoaDon = thu.MaHoaDon
            WHERE hd.TrangThai != 'DaThanhToan' AND hd.deleted = 0
        `);

        return parseFloat(result.tongConNo) || 0;
    }

    /**
     * Lấy số phòng đang cho thuê
     */
    static async getRentedRoomsCount() {
        const [[result]] = await sequelize.query(`
            SELECT COUNT(*) AS soPhongChoThue
            FROM PHONG_TRO
            WHERE TrangThai = 'DaChoThue' AND deleted = 0
        `);

        return parseInt(result.soPhongChoThue) || 0;
    }

    /**
     * Lấy danh sách phiếu thu theo tháng/năm
     */
    static async getPaymentReceiptsByMonth(month, year) {
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
            FROM PHIEU_THU pt
            INNER JOIN HOA_DON hd ON pt.MaHoaDon = hd.MaHoaDon
            INNER JOIN HOP_DONG hdong ON hd.MaHopDong = hdong.MaHopDong
            INNER JOIN PHONG_TRO phong ON hdong.MaPhong = phong.MaPhong
            INNER JOIN NGUOI_THUE nt ON hdong.MaNguoiThue = nt.MaNguoiThue
            WHERE MONTH(pt.NgayThu) = :month
              AND YEAR(pt.NgayThu) = :year
              AND pt.deleted = 0
            ORDER BY pt.NgayThu DESC, pt.MaPhieuThu DESC
        `, { replacements: { month, year } });

        return receipts;
    }
}

export default RevenueModel;
