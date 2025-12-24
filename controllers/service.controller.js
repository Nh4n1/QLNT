import Service from "../models/service.model.js";

//[GET] /services
export const index = async (req, res) => {
    const services = await Service.getAllActive();
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
        
        await Service.createService({
            TenDichVu,
            DonGiaHienTai: DonGiaHienTai || 0,
            DonViTinh: DonViTinh || '',
            LoaiDichVu: LoaiDichVu || 'KhongChiSo'
        });
        
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
        
        await Service.updateService(id, {
            TenDichVu,
            DonGiaHienTai: DonGiaHienTai || 0,
            DonViTinh: DonViTinh || '',
            LoaiDichVu: LoaiDichVu || 'KhongChiSo'
        });
        
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
        
        await Service.softDelete(id);
        
        req.flash('success', 'Xóa dịch vụ thành công!');
        res.redirect('/services');
    } catch (error) {
        console.error('Error deleting service:', error);
        req.flash('error', 'Lỗi khi xóa dịch vụ: ' + error.message);
        res.redirect('/services');
    }
}