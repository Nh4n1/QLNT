import sequelize from "../config/database.js";
import { InvoiceModel } from "../models/invoice.model.js";

//[GET] /invoices
export const index = async (req, res) => {
    try {
        // Gọi Models để lấy dữ liệu
        const roomsList = await InvoiceModel.getRoomsWithActiveContracts();
        const registeredServices = await InvoiceModel.getRegisteredServices();

        // Gắn dịch vụ vào từng phòng/hợp đồng và phân loại
        const roomsWithServices = roomsList.map(room => {
            const contractServices = registeredServices.filter(s => s.MaHopDong === room.MaHopDong);
            
            // Phân loại dịch vụ: Có chỉ số (điện, nước) và Không chỉ số
            const servicesWithIndex = contractServices.filter(s => 
                s.DonViTinh && (s.DonViTinh.toLowerCase().includes('kwh') || s.DonViTinh.toLowerCase().includes('m3') || s.DonViTinh.toLowerCase().includes('khối'))
            );
            const servicesWithoutIndex = contractServices.filter(s => 
                !s.DonViTinh || (!s.DonViTinh.toLowerCase().includes('kwh') && !s.DonViTinh.toLowerCase().includes('m3') && !s.DonViTinh.toLowerCase().includes('khối'))
            );
            
            return {
                ...room,
                services: contractServices,
                servicesWithIndex,
                servicesWithoutIndex
            };
        });

        const invoices = await InvoiceModel.getAllInvoices();

        res.render('pages/invoices/index', { 
            title: 'Hóa đơn', 
            messages: req.flash(),
            rooms: roomsWithServices,
            invoices
        });
    } catch (error) {
        console.error('Lỗi tải trang hóa đơn:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/');
    }
}

//[POST] /invoices/create
export const create = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const data = req.body;

        // Gọi Model để tạo hóa đơn
        const MaHoaDon = await InvoiceModel.createInvoice(data, t);

        await t.commit();
        req.flash('success', 'Tạo hóa đơn thành công!');
        res.redirect('/invoices');

    } catch (error) {
        await t.rollback();
        console.error('Lỗi tạo hóa đơn:', error);
        req.flash('error', 'Có lỗi xảy ra khi tạo hóa đơn!');
        res.redirect('/invoices');
    }
}

//[GET] /invoices/details/:id
export const detail = async (req, res) => {
    try {
        const { id } = req.params;

        // Gọi Models để lấy dữ liệu
        const invoice = await InvoiceModel.getInvoiceById(id);
        const details = await InvoiceModel.getInvoiceDetails(id);

        if (!invoice) {
            req.flash('error', 'Không tìm thấy hóa đơn!');
            return res.redirect('/invoices');
        }

        res.render('pages/invoices/details', {
            title: `Chi tiết hóa đơn ${invoice.MaHoaDon}`,
            messages: req.flash(),
            invoice,
            details
        });

    } catch (error) {
        console.error('Lỗi lấy chi tiết hóa đơn:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/invoices');
    }
}


//[POST] /invoices/payment
export const payment = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { MaHoaDon, SoTienThu, HinhThuc, NgayThu, GhiChu } = req.body;

        // 1. Kiểm tra hóa đơn tồn tại
        const invoice = await InvoiceModel.checkInvoiceExists(MaHoaDon, t);

        if (!invoice) {
            req.flash('error', 'Không tìm thấy hóa đơn!');
            return res.redirect('/invoices');
        }

        if (invoice.TrangThai === 'DaThanhToan') {
            req.flash('error', 'Hóa đơn này đã được thanh toán đầy đủ!');
            return res.redirect(`/invoices/details/${MaHoaDon}`);
        }

        // 2. Lấy tổng số tiền đã thu trước đó
        const soTienDaThu = await InvoiceModel.getTotalPaidAmount(MaHoaDon, t);

        const tongTien = parseFloat(invoice.TongTien);
        const daThu = parseFloat(soTienDaThu);
        const thuLanNay = parseFloat(SoTienThu);
        const tongSauThu = daThu + thuLanNay;

        // 3. Kiểm tra số tiền thu không vượt quá số tiền còn nợ
        const conNo = tongTien - daThu;
        if (thuLanNay > conNo) {
            req.flash('error', `Số tiền thu không được vượt quá số tiền còn nợ (${conNo.toLocaleString('vi-VN')} ₫)!`);
            return res.redirect(`/invoices/details/${MaHoaDon}`);
        }

        // 4. Tạo phiếu thu
        await InvoiceModel.createPaymentReceipt({ MaHoaDon, NgayThu, SoTienThu: thuLanNay, HinhThuc, GhiChu }, t);

        // 5. Cập nhật trạng thái hóa đơn
        let trangThaiMoi;
        if (tongSauThu >= tongTien) {
            trangThaiMoi = 'DaThanhToan';
        } else if (tongSauThu > 0) {
            trangThaiMoi = 'ThanhToanMotPhan';
        } else {
            trangThaiMoi = 'ChuaThanhToan';
        }

        await InvoiceModel.updateInvoiceStatus(MaHoaDon, trangThaiMoi, t);

        await t.commit();
        
        const statusMsg = trangThaiMoi === 'DaThanhToan' 
            ? 'Hóa đơn đã được thanh toán đầy đủ!' 
            : `Thu tiền thành công! Còn nợ: ${(tongTien - tongSauThu).toLocaleString('vi-VN')} ₫`;
        
        req.flash('success', statusMsg);
        res.redirect(`/invoices/details/${MaHoaDon}`);

    } catch (error) {
        await t.rollback();
        console.error('Lỗi thanh toán hóa đơn:', error);
        req.flash('error', 'Có lỗi xảy ra khi thanh toán!');
        res.redirect('/invoices');
    }
}