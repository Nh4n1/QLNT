import { RevenueModel } from "../models/revenue.model.js";

//[GET] /revenue
export const index = async (req, res) => {
    try {
        // Lấy tháng/năm từ query hoặc mặc định là tháng hiện tại
        const now = new Date();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const year = parseInt(req.query.year) || now.getFullYear();

        // Gọi Models để lấy dữ liệu báo cáo
        const tongDoanhThu = await RevenueModel.getTotalRevenue(month, year);
        const soHoaDonDaThu = await RevenueModel.getCompletePaidInvoices(month, year);
        const tongConNo = await RevenueModel.getTotalDebt();
        const soPhongChoThue = await RevenueModel.getRentedRoomsCount();
        const phieuThuList = await RevenueModel.getPaymentReceiptsByMonth(month, year);

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
        res.redirect('/');
    }
}