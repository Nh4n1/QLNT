import sequelize from "../config/database.js";
import Invoice from "../models/invoice.model.js";
import InvoiceDetail from "../models/invoice-detail.model.js";
import Receipt from "../models/receipt.model.js";
import Service from "../models/service.model.js";
import ServiceRegistration from "../models/service-registration.model.js";

//[GET] /invoices
export const index = async (req, res) => {
    try {
        // ✅ Dùng model methods thay vì raw SQL
        const roomsList = await Invoice.getRoomsForBilling();
        const registeredServices = await Invoice.getRegisteredServices();

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

        // ✅ Lấy danh sách hóa đơn từ model
        const invoices = await Invoice.getAllWithDetails();

        res.render('pages/invoices/index', { 
            title: 'Hóa đơn', 
            messages: req.flash(),
            rooms: roomsWithServices,
            invoices
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách hóa đơn:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.render('pages/invoices/index', { 
            title: 'Hóa đơn', 
            messages: req.flash(),
            rooms: [],
            invoices: []
        });
    }
}

//[POST] /invoices/create
export const create = async (req, res) => {
    console.log("data received:", req.body);

    const t = await sequelize.transaction();
    
    try {
        const { 
            NgayLap, 
            TuNgay, 
            DenNgay, 
            GiaPhong, 
            MaHopDong, 
            MaPhong, 
            TongTien, 
            indexServices 
        } = req.body;

        // ✅ 1. Tạo mã hóa đơn từ model
        const MaHoaDon = await Invoice.generateId();

        // ✅ 2. Lấy/tạo dịch vụ tiền phòng
        const roomService = await Service.getRoomService(t);
        const roomServiceId = roomService.MaDichVu;

        // ✅ 3. Chuẩn bị dịch vụ không có chỉ số được chọn
        const otherServices = [];
        for (const key of Object.keys(req.body)) {
            const m = key.match(/^dichVu_(\d+)$/);
            if (!m) continue;
            const maDichVu = m[1];

            // Nếu đã có trong indexServices thì bỏ qua
            if (Array.isArray(indexServices) && indexServices.some(s => String(s.MaDichVu) === String(maDichVu))) {
                continue;
            }

            // Lấy thông tin đăng ký dịch vụ theo hợp đồng
            const registration = await ServiceRegistration.findOne({
                where: { MaHopDong, MaDichVu: maDichVu, deleted: false }
            });

            let soLuong = 1;
            let donGia = null;
            
            if (registration) {
                soLuong = registration.SoLuong || 1;
                donGia = registration.DonGiaChot ? parseFloat(registration.DonGiaChot) : null;
            }

            // Nếu không có giá chốt, lấy giá hiện tại từ dich_vu
            if (donGia === null) {
                const service = await Service.findByPk(maDichVu);
                donGia = service ? parseFloat(service.DonGiaHienTai || 0) : 0;
            }

            const thanhTien = parseFloat(soLuong) * parseFloat(donGia || 0);

            otherServices.push({
                MaDichVu: maDichVu,
                SoLuong: soLuong,
                DonGia: donGia,
                ThanhTien: thanhTien
            });
        }

        // ✅ 4. Tạo hóa đơn với chi tiết từ model
        await Invoice.createWithDetails(
            { MaHoaDon, MaHopDong, NgayLap, TuNgay, DenNgay, TongTien, GiaPhong },
            roomServiceId,
            indexServices || [],
            otherServices,
            t
        );

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

        // ✅ Dùng model methods
        const invoice = await Invoice.getDetails(id);

        if (!invoice) {
            req.flash('error', 'Không tìm thấy hóa đơn!');
            return res.redirect('/invoices');
        }

        const details = await InvoiceDetail.getByInvoice(id);

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

        // ✅ 1. Kiểm tra hóa đơn tồn tại - dùng model
        const invoice = await Invoice.findOne({
            where: { MaHoaDon, deleted: false }
        });

        if (!invoice) {
            req.flash('error', 'Không tìm thấy hóa đơn!');
            return res.redirect('/invoices');
        }

        if (invoice.TrangThai === 'DaThanhToan') {
            req.flash('error', 'Hóa đơn này đã được thanh toán đầy đủ!');
            return res.redirect(`/invoices/details/${MaHoaDon}`);
        }

        // ✅ 2. Lấy tổng số tiền đã thu từ model
        const daThu = await Receipt.getTotalByInvoice(MaHoaDon);

        const tongTien = parseFloat(invoice.TongTien);
        const thuLanNay = parseFloat(SoTienThu);
        const tongSauThu = daThu + thuLanNay;

        // 3. Kiểm tra số tiền thu không vượt quá số tiền còn nợ
        const conNo = tongTien - daThu;
        if (thuLanNay > conNo) {
            req.flash('error', `Số tiền thu không được vượt quá số tiền còn nợ (${conNo.toLocaleString('vi-VN')} ₫)!`);
            return res.redirect(`/invoices/details/${MaHoaDon}`);
        }

        // ✅ 4. Tạo phiếu thu từ model
        await Receipt.createReceipt({
            MaHoaDon,
            NgayThu,
            SoTienThu: thuLanNay,
            HinhThuc,
            GhiChu: GhiChu || null
        }, t);

        // ✅ 5. Cập nhật trạng thái hóa đơn từ model
        let trangThaiMoi;
        if (tongSauThu >= tongTien) {
            trangThaiMoi = 'DaThanhToan';
        } else if (tongSauThu > 0) {
            trangThaiMoi = 'ThanhToanMotPhan';
        } else {
            trangThaiMoi = 'ChuaThanhToan';
        }

        await Invoice.updateStatus(MaHoaDon, trangThaiMoi, t);

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