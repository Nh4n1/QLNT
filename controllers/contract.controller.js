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
    FROM HOP_DONG HD
    INNER JOIN PHONG_TRO P ON HD.MaPhong = P.MaPhong
    INNER JOIN NGUOI_THUE NT ON HD.MaNguoiThue = NT.MaNguoiThue
    WHERE HD.deleted = 0 -- Chỉ lấy dữ liệu chưa bị xóa mềm
    ORDER BY HD.createdAt DESC; -- Sắp xếp hợp đồng mới nhất lên đầu`);

  const [rooms] = await sequelize.query(`SELECT 
    P.MaPhong, 
    P.TenPhong, 
    P.GiaThueHienTai
FROM PHONG_TRO P
WHERE P.TrangThai = 'ConTrong'
AND NOT EXISTS (
    SELECT 1 
    FROM HOP_DONG HD 
    WHERE HD.MaPhong = P.MaPhong 
    AND HD.TrangThai = 'ConHieuLuc'
);`);
const [users] = await sequelize.query(`
SELECT 
    NT.MaNguoiThue, 
    NT.HoTen, 
    NT.CCCD, 
    NT.SDT
FROM NGUOI_THUE NT
WHERE NT.deleted = 0 
AND NOT EXISTS (
    SELECT 1 
    FROM HOP_DONG HD
    WHERE HD.MaNguoiThue = NT.MaNguoiThue
    AND HD.deleted = 0
    AND HD.TrangThai = 'ConHieuLuc'
    AND HD.NgayBatDau <= CURRENT_DATE()
    AND (HD.NgayKetThuc IS NULL OR HD.NgayKetThuc >= CURRENT_DATE())
);`);
  const [services] = await sequelize.query(`SELECT * FROM dich_vu WHERE deleted = 0;`)
  console.log(rooms)

  res.render('pages/contracts/index', { title: 'Contracts', contracts, rooms, users,services, messages: req.flash()});
}


// [POST] /contracts/create
export const create = async (req, res) => {
    const data = req.body;
   

    try {
        const timestamp = Date.now().toString().slice(-5);
        const MaHopDong = `HD_${timestamp}`; 
        const { 
            MaPhong, MaNguoiThue, NgayBatDau, NgayKetThuc, 
            TienCoc, GiaThueChot, SoNguoiO, services 
        } = data;

        await sequelize.query(`
            INSERT INTO HOP_DONG (
                MaHopDong, MaPhong, MaNguoiThue, 
                NgayBatDau, NgayKetThuc, 
                TienCoc, GiaThueChot, SoNguoiO, 
                TrangThai, deleted
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
            replacements: [
                MaHopDong,
                MaPhong,
                MaNguoiThue,
                NgayBatDau,
                NgayKetThuc,
                parseInt(TienCoc),
                parseInt(GiaThueChot),
                parseInt(SoNguoiO),
                'ConHieuLuc',
                0 // deleted = false
            ],
            type: sequelize.QueryTypes.INSERT
        });

        if (services && services.length > 0) {
            for (const service of services) {
                let donGia = null;
                if (service.price !== "" && service.price !== null && service.price !== undefined) {
                    donGia = parseFloat(service.price);
                }

                await sequelize.query(`
                    INSERT INTO DANG_KY_DICH_VU (
                        MaHopDong, MaDichVu, 
                        SoLuong, DonGiaChot, 
                        NgayDangKy, TrangThai
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        MaHopDong,
                        service.serviceId, 
                        1,                 
                        donGia,            
                        NgayBatDau,        
                        1             
                    ],
                    type: sequelize.QueryTypes.INSERT
                });
            }
        }

        await sequelize.query(`
            UPDATE PHONG_TRO 
            SET TrangThai = 'DaChoThue' 
            WHERE MaPhong = ?
        `, {
            replacements: [MaPhong],
            type: sequelize.QueryTypes.UPDATE
        });
        req.flash('success', 'Tạo hợp đồng thành công!');
        res.redirect('/contracts');

    } catch (error) {
        console.error("Lỗi tạo hợp đồng:", error);

        
        req.flash('error', 'Lỗi khi tạo hợp đồng: ' + error.message);
        res.redirect('/contracts');
    }
};