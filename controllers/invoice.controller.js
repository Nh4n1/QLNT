import sequelize from "../config/database.js";

//[GET] /invoices
export const index = async (req, res) => {
    // Lấy danh sách phòng đang có hợp đồng còn hiệu lực
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
    FROM PHONG_TRO pt
    INNER JOIN HOP_DONG hd ON pt.MaPhong = hd.MaPhong
    INNER JOIN NGUOI_THUE nt ON hd.MaNguoiThue = nt.MaNguoiThue
    WHERE 
        hd.TrangThai = 'ConHieuLuc'
        AND hd.deleted = 0
        AND (hd.NgayKetThuc IS NULL OR hd.NgayKetThuc >= CURRENT_DATE);`);
    
    // Lấy danh sách dịch vụ đã đăng ký theo từng hợp đồng
    const [registeredServices] = await sequelize.query(`SELECT 
        dkdv.MaHopDong,
        dkdv.MaDichVu,
        dkdv.SoLuong,
        dkdv.DonGiaChot,
        dv.TenDichVu,
        dv.DonGiaHienTai,
        dv.DonViTinh
    FROM DANG_KY_DICH_VU dkdv
    INNER JOIN DICH_VU dv ON dkdv.MaDichVu = dv.MaDichVu
    WHERE dkdv.TrangThai = 1 
        AND dkdv.deleted = 0
        AND dv.deleted = 0;`);

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

    // Lấy danh sách hóa đơn hiện có
    const [invoices] = await sequelize.query(`SELECT 
        hdon.MaHoaDon,
        hdon.NgayLap,
        hdon.TuNgay,
        hdon.DenNgay,
        hdon.TongTien,
        hdon.TrangThai,
        pt.TenPhong,
        nt.HoTen AS TenNguoiThue
    FROM HOA_DON hdon
    INNER JOIN HOP_DONG hd ON hdon.MaHopDong = hd.MaHopDong
    INNER JOIN PHONG_TRO pt ON hd.MaPhong = pt.MaPhong
    INNER JOIN NGUOI_THUE nt ON hd.MaNguoiThue = nt.MaNguoiThue
    WHERE hdon.deleted = 0
    ORDER BY hdon.NgayLap DESC;`);

    res.render('pages/invoices/index', { 
        title: 'Hóa đơn', 
        messages: req.flash(),
        rooms: roomsWithServices,
        invoices
    });
}

//[POST] /invoices/create
export const create = async (req, res) => {
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

        // 1. Tạo mã hóa đơn mới
        const [[{ maxId }]] = await sequelize.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(MaHoaDon, 4) AS UNSIGNED)), 0) AS maxId FROM HOA_DON`,
            { transaction: t }
        );
        const MaHoaDon = `HD_${String(maxId + 1).padStart(5, '0')}`;

        // 2. INSERT vào bảng HOA_DON (không có cột TienPhong)
        await sequelize.query(
            `INSERT INTO HOA_DON (MaHoaDon, MaHopDong, NgayLap, TuNgay, DenNgay, TongTien, TrangThai, deleted)
             VALUES (:MaHoaDon, :MaHopDong, :NgayLap, :TuNgay, :DenNgay, :TongTien, 'ChuaThanhToan', 0)`,
            {
                replacements: { MaHoaDon, MaHopDong, NgayLap, TuNgay, DenNgay, TongTien },
                transaction: t
            }
        );

        // 3. INSERT tiền phòng vào CHI_TIET_HOA_DON (dịch vụ DV_PHONG)
        await sequelize.query(
            `INSERT INTO CHI_TIET_HOA_DON (MaHoaDon, MaDichVu, SoLuong, DonGiaLuuTru, ThanhTien)
             VALUES (:MaHoaDon, 'DV_PHONG', 1, :GiaPhong, :GiaPhong)`,
            {
                replacements: { MaHoaDon, GiaPhong },
                transaction: t
            }
        );

        // 4. INSERT chi tiết dịch vụ có chỉ số (điện, nước)
        if (indexServices && indexServices.length > 0) {
            for (const service of indexServices) {
                const soLuong = parseFloat(service.ChiSoMoi) - parseFloat(service.ChiSoCu);
                await sequelize.query(
                    `INSERT INTO CHI_TIET_HOA_DON (MaHoaDon, MaDichVu, SoLuong, ChiSoCu, ChiSoMoi, DonGiaLuuTru, ThanhTien)
                     VALUES (:MaHoaDon, :MaDichVu, :SoLuong, :ChiSoCu, :ChiSoMoi, :DonGiaLuuTru, :ThanhTien)`,
                    {
                        replacements: {
                            MaHoaDon,
                            MaDichVu: service.MaDichVu,
                            SoLuong: soLuong,
                            ChiSoCu: service.ChiSoCu,
                            ChiSoMoi: service.ChiSoMoi,
                            DonGiaLuuTru: service.DonGia,
                            ThanhTien: service.ThanhTien
                        },
                        transaction: t
                    }
                );
            }
        }

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

        // Lấy thông tin hóa đơn kèm tổng số tiền đã thu
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
                COALESCE((SELECT SUM(SoTienThu) FROM PHIEU_THU WHERE MaHoaDon = hdon.MaHoaDon AND deleted = 0), 0) AS SoTienDaThu
            FROM HOA_DON hdon
            INNER JOIN HOP_DONG hdong ON hdon.MaHopDong = hdong.MaHopDong
            INNER JOIN PHONG_TRO pt ON hdong.MaPhong = pt.MaPhong
            INNER JOIN NGUOI_THUE nt ON hdong.MaNguoiThue = nt.MaNguoiThue
            WHERE hdon.MaHoaDon = :id AND hdon.deleted = 0
        `, { replacements: { id } });

        if (!invoice) {
            req.flash('error', 'Không tìm thấy hóa đơn!');
            return res.redirect('/invoices');
        }

        // Lấy chi tiết hóa đơn
        const [details] = await sequelize.query(`
            SELECT 
                ct.MaDichVu,
                ct.SoLuong,
                ct.ChiSoCu,
                ct.ChiSoMoi,
                ct.DonGiaLuuTru,
                ct.ThanhTien,
                dv.TenDichVu,
                dv.DonViTinh
            FROM CHI_TIET_HOA_DON ct
            INNER JOIN DICH_VU dv ON ct.MaDichVu = dv.MaDichVu
            WHERE ct.MaHoaDon = :id
        `, { replacements: { id } });

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
        const [[invoice]] = await sequelize.query(
            `SELECT TongTien, TrangThai FROM HOA_DON WHERE MaHoaDon = :MaHoaDon AND deleted = 0`,
            { replacements: { MaHoaDon }, transaction: t }
        );

        if (!invoice) {
            req.flash('error', 'Không tìm thấy hóa đơn!');
            return res.redirect('/invoices');
        }

        if (invoice.TrangThai === 'DaThanhToan') {
            req.flash('error', 'Hóa đơn này đã được thanh toán đầy đủ!');
            return res.redirect(`/invoices/details/${MaHoaDon}`);
        }

        // 2. Lấy tổng số tiền đã thu trước đó
        const [[{ soTienDaThu }]] = await sequelize.query(
            `SELECT COALESCE(SUM(SoTienThu), 0) AS soTienDaThu 
             FROM PHIEU_THU WHERE MaHoaDon = :MaHoaDon AND deleted = 0`,
            { replacements: { MaHoaDon }, transaction: t }
        );

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

        // 4. INSERT phiếu thu mới (MaPhieuThu là INT AUTO_INCREMENT)
        await sequelize.query(
            `INSERT INTO PHIEU_THU (MaHoaDon, NgayThu, SoTienThu, HinhThuc, GhiChu, deleted)
             VALUES (:MaHoaDon, :NgayThu, :SoTienThu, :HinhThuc, :GhiChu, 0)`,
            {
                replacements: { MaHoaDon, NgayThu, SoTienThu: thuLanNay, HinhThuc, GhiChu: GhiChu || null },
                transaction: t
            }
        );

        // 5. Cập nhật trạng thái hóa đơn
        let trangThaiMoi;
        if (tongSauThu >= tongTien) {
            trangThaiMoi = 'DaThanhToan';
        } else if (tongSauThu > 0) {
            trangThaiMoi = 'ThanhToanMotPhan';
        } else {
            trangThaiMoi = 'ChuaThanhToan';
        }

        await sequelize.query(
            `UPDATE HOA_DON SET TrangThai = :trangThaiMoi WHERE MaHoaDon = :MaHoaDon`,
            { replacements: { trangThaiMoi, MaHoaDon }, transaction: t }
        );

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