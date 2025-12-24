import sequelize from "../config/database.js"

//[GET] /services
export const index = async (req, res) => {
     const [services] = await sequelize.query(`
         SELECT * FROM dich_vu WHERE LoaiDichVu != 'TienPhong' AND deleted = 0 ORDER BY TenDichVu ASC
     `);
    res.render('pages/services/index', { 
        title: 'Services', 
        services,
        messages: req.flash()
    });
}

//[POST] /services - Thêm dịch vụ mới
export const create = async (req, res) => {
    try {
        const { TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu } = req.body;
        
        if (!TenDichVu) {
            req.flash('error', 'Vui lòng nhập tên dịch vụ');
            return res.redirect('/services');
        }
        
        const timestamp = Date.now().toString().slice(-5);
        const MaDichVu = `DV_${timestamp}`;
        
        await sequelize.query(
            `INSERT INTO dich_vu (MaDichVu, TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu, deleted)
             VALUES (:MaDichVu, :TenDichVu, :DonGiaHienTai, :DonViTinh, :LoaiDichVu, 0)`,
            {
                replacements: {
                    MaDichVu,
                    TenDichVu,
                    DonGiaHienTai: DonGiaHienTai || 0,
                    DonViTinh: DonViTinh || '',
                    LoaiDichVu: LoaiDichVu || 'KhongChiSo'
                },
                type: sequelize.QueryTypes.INSERT
            }
        );
        
        req.flash('success', 'Thêm dịch vụ thành công!');
        res.redirect('/services');
    } catch (error) {
        console.error('Error creating service:', error);
        req.flash('error', 'Lỗi khi thêm dịch vụ: ' + error.message);
        res.redirect('/services');
    }
}

//[POST] /services/update/:id - Cập nhật dịch vụ
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu } = req.body;
        
        await sequelize.query(
            `UPDATE dich_vu 
             SET TenDichVu = :TenDichVu, 
                 DonGiaHienTai = :DonGiaHienTai, 
                 DonViTinh = :DonViTinh, 
                 LoaiDichVu = :LoaiDichVu,
                 updatedAt = NOW()
             WHERE MaDichVu = :id`,
            {
                replacements: {
                    id,
                    TenDichVu,
                    DonGiaHienTai: DonGiaHienTai || 0,
                    DonViTinh: DonViTinh || '',
                    LoaiDichVu: LoaiDichVu || 'KhongChiSo'
                },
                type: sequelize.QueryTypes.UPDATE
            }
        );
        
        req.flash('success', 'Cập nhật dịch vụ thành công!');
        res.redirect('/services');
    } catch (error) {
        console.error('Error updating service:', error);
        req.flash('error', 'Lỗi khi cập nhật dịch vụ: ' + error.message);
        res.redirect('/services');
    }
}

//[GET] /services/delete/:id - Xóa mềm dịch vụ
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        
        await sequelize.query(
            `UPDATE dich_vu 
             SET deleted = 1, deletedAt = NOW(), updatedAt = NOW()
             WHERE MaDichVu = :id`,
            {
                replacements: { id },
                type: sequelize.QueryTypes.UPDATE
            }
        );
        
        req.flash('success', 'Xóa dịch vụ thành công!');
        res.redirect('/services');
    } catch (error) {
        console.error('Error deleting service:', error);
        req.flash('error', 'Lỗi khi xóa dịch vụ: ' + error.message);
        res.redirect('/services');
    }
}