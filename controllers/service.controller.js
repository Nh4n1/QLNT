import sequelize from "../config/database.js"
import { ServiceModel } from "../models/service.model.js"

//[GET] /services
export const index = async (req, res) => {
    try {
        // Gọi Model để lấy danh sách dịch vụ
        const services = await ServiceModel.getAllServices();
        
        res.render('pages/services/index', { 
            title: 'Services', 
            services,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Lỗi tải trang dịch vụ:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/');
    }
}

//[POST] /services - Thêm dịch vụ mới
export const create = async (req, res) => {
    try {
        const { TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu } = req.body;
        
        if (!TenDichVu) {
            req.flash('error', 'Vui lòng nhập tên dịch vụ');
            return res.redirect('/services');
        }
        
        // Gọi Model để tạo dịch vụ
        await ServiceModel.createService({ TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu });
        
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
        
        // Gọi Model để cập nhật dịch vụ
        await ServiceModel.updateService(id, { TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu });
        
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
        
        // Gọi Model để xóa dịch vụ
        await ServiceModel.deleteService(id);
        
        req.flash('success', 'Xóa dịch vụ thành công!');
        res.redirect('/services');
    } catch (error) {
        console.error('Error deleting service:', error);
        req.flash('error', 'Lỗi khi xóa dịch vụ: ' + error.message);
        res.redirect('/services');
    }
}