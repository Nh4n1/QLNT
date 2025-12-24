import Invoice from "../models/invoice.model.js";
import Receipt from "../models/receipt.model.js";
import Room from "../models/room.model.js";

//[GET] /revenue
export const index = async (req, res) => {
    try {
        // Lấy tháng/năm từ query hoặc mặc định là tháng hiện tại
        const now = new Date();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const year = parseInt(req.query.year) || now.getFullYear();

        // 1. Tổng doanh thu tháng (từ PHIEU_THU)
        const tongDoanhThu = await Receipt.getTotalRevenueByMonth(month, year);

        // 2. Số hóa đơn đã thu đủ trong tháng
        const soHoaDonDaThu = await Invoice.countPaidByMonth(month, year);

        // 3. Tổng số tiền còn nợ (tất cả hóa đơn chưa thanh toán đủ)
        const tongConNo = await Invoice.getTotalDebt();

        // 4. Số phòng đang cho thuê
        const soPhongChoThue = await Room.countRented();

        // 5. Danh sách phiếu thu trong tháng
        const phieuThuList = await Receipt.getByMonth(month, year);

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
                tongDoanhThu,
                soHoaDonDaThu,
                tongConNo,
                soPhongChoThue
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