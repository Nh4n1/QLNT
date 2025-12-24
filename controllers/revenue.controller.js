import sequelize from "../config/database.js";

//[GET] /revenue
export const index = async (req, res) => {
    try {
        // Lấy tháng/năm từ query hoặc mặc định là tháng hiện tại
        const now = new Date();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const year = parseInt(req.query.year) || now.getFullYear();

        // 1. Tổng doanh thu tháng (từ PHIEU_THU)
                const [[{ tongDoanhThu }]] = await sequelize.query(`
                        SELECT COALESCE(SUM(SoTienThu), 0) AS tongDoanhThu
                        FROM phieu_thu
                        WHERE MONTH(NgayThu) = :month
                            AND YEAR(NgayThu) = :year
                            AND deleted = 0
                `, { replacements: { month, year } });

        // 2. Số hóa đơn đã thu đủ trong tháng
                const [[{ soHoaDonDaThu }]] = await sequelize.query(`
                        SELECT COUNT(*) AS soHoaDonDaThu
                        FROM hoa_don
                        WHERE TrangThai = 'DaThanhToan'
                            AND MONTH(NgayLap) = :month
                            AND YEAR(NgayLap) = :year
                            AND deleted = 0
                `, { replacements: { month, year } });

        // 3. Tổng số tiền còn nợ (tất cả hóa đơn chưa thanh toán đủ)
        const [[{ tongConNo }]] = await sequelize.query(`
            SELECT COALESCE(SUM(hd.TongTien - COALESCE(thu.SoTienDaThu, 0)), 0) AS tongConNo
            FROM hoa_don hd
            LEFT JOIN (
                SELECT MaHoaDon, SUM(SoTienThu) AS SoTienDaThu
                FROM phieu_thu WHERE deleted = 0
                GROUP BY MaHoaDon
            ) thu ON hd.MaHoaDon = thu.MaHoaDon
            WHERE hd.TrangThai != 'DaThanhToan' AND hd.deleted = 0
        `);

        // 4. Số phòng đang cho thuê
        const [[{ soPhongChoThue }]] = await sequelize.query(`
            SELECT COUNT(*) AS soPhongChoThue
            FROM phong_tro
            WHERE TrangThai = 'DaChoThue' AND deleted = 0
        `);

        // 5. Danh sách phiếu thu trong tháng
        const [phieuThuList] = await sequelize.query(`
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

        // Tạo danh sách tháng để chọn
        const months = [];
        for (let i = 1; i <= 12; i++) {
            months.push({ value: i, label: `Tháng ${i}` });
        }

        // Tạo danh sách năm (3 năm gần nhất)
        const years = [];
        for (let i = now.getFullYear(); i >= now.getFullYear() - 2; i--) {
            years.push(i);
        }

        res.render('pages/revenue/index', {
            title: 'Báo cáo doanh thu',
            messages: req.flash(),
            stats: {
                tongDoanhThu: parseFloat(tongDoanhThu) || 0,
                soHoaDonDaThu: parseInt(soHoaDonDaThu) || 0,
                tongConNo: parseFloat(tongConNo) || 0,
                soPhongChoThue: parseInt(soPhongChoThue) || 0
            },
            phieuThuList,
            filters: { month, year },
            months,
            years
        });

    } catch (error) {
        console.error('Lỗi lấy báo cáo doanh thu:', error);
        req.flash('error', 'Có lỗi xảy ra khi lấy báo cáo!');
        res.render('pages/revenue/index', {
            title: 'Báo cáo doanh thu',
            messages: req.flash(),
            stats: { tongDoanhThu: 0, soHoaDonDaThu: 0, tongConNo: 0, soPhongChoThue: 0 },
            phieuThuList: [],
            filters: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
            months: [],
            years: []
        });
    }
}