import sequelize from "../config/database.js";

export const index = async (req, res) => {
    const [userList] = await sequelize.query('SELECT * FROM nguoi_thue WHERE deleted = 0');
    const [roomListWithUsers] = await sequelize.query(`SELECT 
    pt.MaPhong,
    pt.TenPhong,
    ntr.TenNha,             -- Tên tòa nhà để dễ phân biệt
    hd.MaHopDong,
    hd.soNguoiO,
    
    -- Thông tin cư dân
    nt.HoTen AS TenCuDan,
    nt.CCCD,
    nt.SDT,
    cd.VaiTro,              -- Ví dụ: Người đại diện, Thành viên
    cd.NgayVaoO,
    nt.NgaySinh,
    nt.GioiTinh,
    nt.DiaChi,
    -- Trạng thái hợp đồng (để kiểm tra cho chắc)
    hd.TrangThai AS TrangThaiHD

FROM phong_tro pt
-- 1. Join lấy tên Nhà (Optional)
JOIN nha_tro ntr ON pt.MaNha = ntr.MaNha

-- 2. Join lấy Hợp Đồng đang hiệu lực
JOIN hop_dong hd ON pt.MaPhong = hd.MaPhong

-- 3. Join lấy danh sách Cư Dân thuộc hợp đồng đó
JOIN cu_dan cd ON hd.MaHopDong = cd.MaHopDong

-- 4. Join lấy thông tin cá nhân của Cư Dân
JOIN nguoi_thue nt ON cd.MaNguoiThue = nt.MaNguoiThue

WHERE 
    -- Điều kiện 1: Hợp đồng phải còn hiệu lực và chưa bị xóa
    hd.deleted = FALSE 
    AND hd.TrangThai = 'ConHieuLuc'
    
    -- Điều kiện 2: Cư dân chưa bị xóa khỏi hệ thống
    AND cd.deleted = FALSE
    
    -- Điều kiện 3: Cư dân VẪN ĐANG Ở (Chưa có ngày rời đi hoặc ngày rời đi ở tương lai)
    AND (cd.NgayRoiDi IS NULL OR cd.NgayRoiDi >= CURRENT_DATE)

ORDER BY 
    pt.TenPhong ASC, 
    cd.VaiTro ASC;  `);
    
    // Lấy danh sách người thuê chưa là cư dân trong bất kỳ phòng nào
        const [availableUsers] = await sequelize.query(`
                SELECT nt.* 
                FROM nguoi_thue nt
                LEFT JOIN cu_dan cd ON nt.MaNguoiThue = cd.MaNguoiThue
                    AND cd.deleted = FALSE
                    AND (cd.NgayRoiDi IS NULL OR cd.NgayRoiDi > CURRENT_DATE)
                WHERE nt.deleted = FALSE
                    AND cd.MaNguoiThue IS NULL
                ORDER BY nt.HoTen ASC
        `);
    
    console.log(userList)
    res.render('pages/users/index', { 
        title: 'User Management', 
        userList: userList,
        availableUsers: availableUsers,
        roomListWithUsers,
        messages: req.flash()
    });
}

// [POST] /users/create
export const create = async (req, res) => {
    const { CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email, DiaChi } = req.body;
    
    try {
        // Check if CCCD already exists
        const [existingUser] = await sequelize.query(
            'SELECT * FROM nguoi_thue WHERE CCCD = ? AND deleted = 0',
            { replacements: [CCCD] }
        );
        
        if (existingUser.length > 0) {
            req.flash('error', 'CCCD/CMND này đã tồn tại trong hệ thống');
            return res.redirect('/users');
        }
        
        // Insert new user
        await sequelize.query(
            `INSERT INTO nguoi_thue (CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email, DiaChi, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email || null, DiaChi || null, 0]
            }
        );
        
        req.flash('success', `Thêm người thuê "${HoTen}" thành công`);
        res.redirect('/users');
    } catch (error) {
        console.error('Error creating user:', error);
        req.flash('error', 'Có lỗi xảy ra khi thêm người thuê');
        res.redirect('/users');
    }
}

// [POST] /users/add-resident
export const addResident = async (req, res) => {
    const { MaPhong, MaHopDong, MaNguoiThue, VaiTro, NgayVaoO } = req.body;
    
    try {
        // Validate required fields
        if (!MaPhong || !MaHopDong || !MaNguoiThue || !VaiTro || !NgayVaoO) {
            req.flash('error', 'Vui lòng cung cấp đầy đủ thông tin');
            return res.redirect('/users');
        }
        
        // Check if person already is a resident in another active contract
        const [existingResident] = await sequelize.query(
            `SELECT * FROM cu_dan 
             WHERE MaNguoiThue = ? 
             AND deleted = 0 
             AND (NgayRoiDi IS NULL OR NgayRoiDi > CURRENT_DATE)`,
            { replacements: [MaNguoiThue] }
        );
        
        if (existingResident.length > 0) {
            req.flash('error', 'Người này hiện đã là cư dân trong phòng khác');
            return res.redirect('/users');
        }
        
        // Check if contract exists and is active
        const [contractCheck] = await sequelize.query(
            `SELECT * FROM hop_dong 
             WHERE MaHopDong = ? 
             AND MaPhong = ?
             AND deleted = 0
             AND TrangThai = 'ConHieuLuc'`,
            { replacements: [MaHopDong, MaPhong] }
        );
        
        if (contractCheck.length === 0) {
            req.flash('error', 'Hợp đồng không tồn tại hoặc đã hết hiệu lực');
            return res.redirect('/users');
        }
        
        // Insert new resident
        await sequelize.query(
            `INSERT INTO cu_dan (MaHopDong, MaNguoiThue, VaiTro, NgayVaoO, deleted)
             VALUES (?, ?, ?, ?, ?)`,
            {
                replacements: [MaHopDong, MaNguoiThue, VaiTro, NgayVaoO, 0]
            }
        );
        
        // Get resident name for response
        const [resident] = await sequelize.query(
            'SELECT HoTen FROM nguoi_thue WHERE MaNguoiThue = ?',
            { replacements: [MaNguoiThue] }
        );
        
        req.flash('success', `Thêm cư dân "${resident[0].HoTen}" vào phòng thành công`);
        res.redirect('/users');
        
    } catch (error) {
        console.error('Error adding resident:', error);
        req.flash('error', 'Có lỗi xảy ra khi thêm cư dân: ' + error.message);
        res.redirect('/users');
    }
}