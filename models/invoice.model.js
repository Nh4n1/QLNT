import sequelize from '../config/database.js';

export class InvoiceModel {
    /**
     * Lấy danh sách phòng có hợp đồng còn hiệu lực
     */
    static async getRoomsWithActiveContracts() {
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
        
        return roomsList;
    }

    /**
     * Lấy danh sách dịch vụ đã đăng ký
     */
    static async getRegisteredServices() {
        const [services] = await sequelize.query(`SELECT 
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
        
        return services;
    }

    /**
     * Lấy danh sách hóa đơn hiện có
     */
    static async getAllInvoices() {
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
        
        return invoices;
    }

    /**
     * Tạo hóa đơn mới
     */
    static async createInvoice(data, transaction) {
        const { 
            NgayLap, 
            TuNgay, 
            DenNgay, 
            GiaPhong, 
            MaHopDong, 
            MaPhong, 
            TongTien, 
            indexServices 
        } = data;

        // 1. Lấy ID tiếp theo cho hóa đơn
        const [[{ maxId }]] = await sequelize.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(MaHoaDon, 4) AS UNSIGNED)), 0) AS maxId FROM HOA_DON`,
            { transaction }
        );
        const MaHoaDon = `HD_${String(maxId + 1).padStart(5, '0')}`;

        // 2. INSERT hóa đơn chính
        await sequelize.query(
            `INSERT INTO HOA_DON (MaHoaDon, MaHopDong, NgayLap, TuNgay, DenNgay, TongTien, TrangThai, deleted)
             VALUES (:MaHoaDon, :MaHopDong, :NgayLap, :TuNgay, :DenNgay, :TongTien, 'ChuaThanhToan', 0)`,
            {
                replacements: { MaHoaDon, MaHopDong, NgayLap, TuNgay, DenNgay, TongTien },
                transaction
            }
        );

        // 3. INSERT tiền phòng vào chi tiết hóa đơn
        await sequelize.query(
            `INSERT INTO CHI_TIET_HOA_DON (MaHoaDon, MaDichVu, SoLuong, DonGiaLuuTru, ThanhTien)
             VALUES (:MaHoaDon, 'DV_PHONG', 1, :GiaPhong, :GiaPhong)`,
            {
                replacements: { MaHoaDon, GiaPhong },
                transaction
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
                        transaction
                    }
                );
            }
        }

        return MaHoaDon;
    }

    /**
     * Lấy chi tiết hóa đơn theo ID
     */
    static async getInvoiceById(id) {
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

        return invoice;
    }

    /**
     * Lấy chi tiết các dịch vụ trong hóa đơn
     */
    static async getInvoiceDetails(id) {
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

        return details;
    }

    /**
     * Kiểm tra hóa đơn tồn tại
     */
    static async checkInvoiceExists(MaHoaDon, transaction) {
        const [[invoice]] = await sequelize.query(
            `SELECT TongTien, TrangThai FROM HOA_DON WHERE MaHoaDon = :MaHoaDon AND deleted = 0`,
            { replacements: { MaHoaDon }, transaction }
        );

        return invoice;
    }

    /**
     * Lấy tổng tiền đã thu cho hóa đơn
     */
    static async getTotalPaidAmount(MaHoaDon, transaction) {
        const [[result]] = await sequelize.query(
            `SELECT COALESCE(SUM(SoTienThu), 0) AS soTienDaThu 
             FROM PHIEU_THU WHERE MaHoaDon = :MaHoaDon AND deleted = 0`,
            { replacements: { MaHoaDon }, transaction }
        );

        return parseFloat(result.soTienDaThu);
    }

    /**
     * Tạo phiếu thu (thanh toán)
     */
    static async createPaymentReceipt(data, transaction) {
        const { MaHoaDon, NgayThu, SoTienThu, HinhThuc, GhiChu } = data;

        await sequelize.query(
            `INSERT INTO PHIEU_THU (MaHoaDon, NgayThu, SoTienThu, HinhThuc, GhiChu, deleted)
             VALUES (:MaHoaDon, :NgayThu, :SoTienThu, :HinhThuc, :GhiChu, 0)`,
            {
                replacements: { MaHoaDon, NgayThu, SoTienThu, HinhThuc, GhiChu: GhiChu || null },
                transaction
            }
        );
    }

    /**
     * Cập nhật trạng thái hóa đơn
     */
    static async updateInvoiceStatus(MaHoaDon, trangThaiMoi, transaction) {
        await sequelize.query(
            `UPDATE HOA_DON SET TrangThai = :trangThaiMoi WHERE MaHoaDon = :MaHoaDon`,
            { replacements: { trangThaiMoi, MaHoaDon }, transaction }
        );
    }
}

export default InvoiceModel;
