import sequelize from "../config/database.js";
import { UserModel } from "../models/user.model.js";

export const index = async (req, res) => {
    try {
        // Gọi Models để lấy dữ liệu
        const userList = await UserModel.getAllUsers();
        const roomListWithUsers = await UserModel.getRoomsWithResidents();
        const availableUsers = await UserModel.getAvailableUsers();
        
        res.render('pages/users/index', { 
            title: 'User Management', 
            userList: userList,
            availableUsers: availableUsers,
            roomListWithUsers,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Lỗi tải trang người dùng:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/');
    }
}

// [POST] /users/create
export const create = async (req, res) => {
    const { CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email, DiaChi } = req.body;
    
    try {
        // Kiểm tra CCCD đã tồn tại
        const existingUser = await UserModel.checkUserExistsByIdCard(CCCD);
        
        if (existingUser.length > 0) {
            req.flash('error', 'CCCD/CMND này đã tồn tại trong hệ thống');
            return res.redirect('/users');
        }
        
        // Gọi Model để tạo người dùng
        await UserModel.createUser({ CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email, DiaChi });
        
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
        
        // Kiểm tra cư dân tồn tại
        const existingResident = await UserModel.checkResidentExists(MaNguoiThue);
        
        if (existingResident.length > 0) {
            req.flash('error', 'Người này hiện đã là cư dân trong phòng khác');
            return res.redirect('/users');
        }
        
        // Kiểm tra hợp đồng tồn tại
        const contractCheck = await UserModel.checkContractExists(MaHopDong, MaPhong);
        
        if (contractCheck.length === 0) {
            req.flash('error', 'Hợp đồng không tồn tại hoặc đã hết hiệu lực');
            return res.redirect('/users');
        }
        
        // Thêm cư dân
        await UserModel.addResident({ MaHopDong, MaNguoiThue, VaiTro, NgayVaoO });
        
        // Lấy tên cư dân
        const resident = await UserModel.getUserNameById(MaNguoiThue);
        
        req.flash('success', `Thêm cư dân "${resident.HoTen}" vào phòng thành công`);
        res.redirect('/users');
        
    } catch (error) {
        console.error('Error adding resident:', error);
        req.flash('error', 'Có lỗi xảy ra khi thêm cư dân: ' + error.message);
        res.redirect('/users');
    }
}