import sequelize from "../config/database.js";
export const index = async(req, res) => {
  console.log("Fetching contracts...");
    const [contracts] = await sequelize.query(`SELECT 
        HD.MaHopDong,
        HD.NgayBatDau,
        HD.NgayKetThuc,
        HD.GiaThueChot,
        HD.TrangThai,
        -- Lấy thông tin phòng
        P.TenPhong,
        P.MaNha, -- Để biết nhà nào nếu cần
        -- Lấy thông tin người thuê
        NT.HoTen AS TenNguoiThue,
        NT.SDT AS SoDienThoai
        FROM hop_dong HD
        INNER JOIN phong_tro P ON HD.MaPhong = P.MaPhong
        INNER JOIN nguoi_thue NT ON HD.MaNguoiThue = NT.MaNguoiThue
        WHERE HD.deleted = 0 -- Chỉ lấy dữ liệu chưa bị xóa mềm
        ORDER BY HD.createdAt DESC; -- Sắp xếp hợp đồng mới nhất lên đầu`);

const [rooms] = await sequelize.query(`SELECT 
    P.MaPhong, 
    P.TenPhong, 
    P.GiaThueHienTai,
    P.SoNguoiToiDa
FROM phong_tro P
WHERE P.TrangThai = 'ConTrong'
AND NOT EXISTS (
    SELECT 1 
    FROM hop_dong HD 
    WHERE HD.MaPhong = P.MaPhong 
    AND HD.TrangThai = 'ConHieuLuc'
);`);
const [users] = await sequelize.query(`
SELECT 
    NT.MaNguoiThue, 
    NT.HoTen, 
    NT.CCCD, 
    NT.SDT
FROM nguoi_thue NT
WHERE NT.deleted = 0 
AND NOT EXISTS (
    SELECT 1 
    FROM hop_dong HD
    WHERE HD.MaNguoiThue = NT.MaNguoiThue
    AND HD.deleted = 0
    AND HD.TrangThai = 'ConHieuLuc'
    AND HD.NgayBatDau <= CURRENT_DATE()
    AND (HD.NgayKetThuc IS NULL OR HD.NgayKetThuc >= CURRENT_DATE())
);`);
  const [services] = await sequelize.query(`SELECT * FROM dich_vu WHERE deleted = 0 AND LoaiDichVu != 'TienPhong';`)
  res.render('pages/contracts/index', { title: 'Contracts', contracts, rooms, users,services, messages: req.flash()});
}


// [POST] /contracts/create
export const create = async (req, res) => {
    const data = req.body;
    const t = await sequelize.transaction();
    try {
        // Tạo MaHopDong theo format HD + yyMM + 3 chữ số (ví dụ: HD251201)
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `HD${yy}${mm}`;

        // Lấy mã lớn nhất có tiền tố tương ứng
        const [lastRows] = await sequelize.query(
            `SELECT MaHopDong FROM hop_dong WHERE MaHopDong LIKE :like ORDER BY MaHopDong DESC LIMIT 1`,
            { replacements: { like: `${prefix}%` } }
        );
        let nextNum = 1;
        if (lastRows && lastRows.length > 0 && lastRows[0].MaHopDong) {
            const last = lastRows[0].MaHopDong;
            const suffix = last.slice(prefix.length);
            const parsed = parseInt(suffix, 10);
            if (!isNaN(parsed)) nextNum = parsed + 1;
        }
        const MaHopDong = prefix + String(nextNum).padStart(3, '0');
        const {
            MaPhong, MaNguoiThue, NgayBatDau, NgayKetThuc,
            TienCoc, GiaThueChot, SoNguoiO, services
        } = data;
        const NgayTaoHopDong = new Date();
        await sequelize.query(`
            INSERT INTO hop_dong (
                MaHopDong, MaPhong, MaNguoiThue, 
                NgayBatDau, NgayKetThuc, 
                NgayTaoHopDong, TienCoc, GiaThueChot, SoNguoiO,
                TrangThai, deleted
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
            replacements: [
                MaHopDong, MaPhong, MaNguoiThue,
                NgayBatDau, NgayKetThuc,
                NgayTaoHopDong,
                parseInt(TienCoc), parseInt(GiaThueChot), parseInt(SoNguoiO),
                'ConHieuLuc', 0
            ],
            type: sequelize.QueryTypes.INSERT,
            transaction: t 
        });
        await sequelize.query(`
            INSERT INTO cu_dan (
                MaHopDong, MaNguoiThue, VaiTro, 
                NgayVaoO
            )
            VALUES (?, ?, ?, ?)
        `, {
            replacements: [
                MaHopDong,    
                MaNguoiThue,  
                'DaiDien',     
                NgayBatDau    
            ],
            type: sequelize.QueryTypes.INSERT,
            transaction: t
        });
        if (services && services.length > 0) {
            for (const service of services) {
                let donGia = null;
                if (service.price !== "" && service.price !== null && service.price !== undefined) {
                    donGia = parseFloat(service.price);
                }

                await sequelize.query(`
                    INSERT INTO dang_ky_dich_vu (
                        MaHopDong, MaDichVu, 
                        SoLuong, DonGiaChot, 
                        NgayDangKy, TrangThai
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        MaHopDong, service.serviceId,
                        1, donGia,
                        NgayBatDau, 1
                    ],
                    type: sequelize.QueryTypes.INSERT,
                    transaction: t 
                });
            }
        }
        await sequelize.query(`
            UPDATE phong_tro 
            SET TrangThai = 'DaChoThue' 
            WHERE MaPhong = ?
        `, {
            replacements: [MaPhong],
            type: sequelize.QueryTypes.UPDATE,
            transaction: t 
        });
        await t.commit();
        

        req.flash('success', 'Tạo hợp đồng thành công!');
        res.redirect('/contracts');

    } catch (error) {
        await t.rollback();
        console.error("Lỗi tạo hợp đồng:", error);
        req.flash('error', 'Lỗi khi tạo hợp đồng: ' + error.message);
        res.redirect('/contracts');
    }
};