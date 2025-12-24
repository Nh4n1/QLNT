import User from "../models/user.model.js";
import Resident from "../models/resident.model.js";

export const index = async (req, res) => {
    const userList = await User.getAllActive();
    const roomListWithUsers = await User.getRoomListWithUsers();
    const availableUsers = await User.getAvailableUsers();
    
    console.log(userList);
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
        const existingUser = await User.findByCCCD(CCCD);
        
        if (existingUser) {
            req.flash('error', 'CCCD/CMND này đã tồn tại trong hệ thống');
            return res.redirect('/users');
        }
        
        // Insert new user
        await User.createUser({
            CCCD,
            HoTen,
            GioiTinh,
            NgaySinh,
            SDT,
            Email: Email || null,
            DiaChi: DiaChi || null
        });
        
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
        const isResident = await Resident.isActiveResident(MaNguoiThue);
        
        if (isResident) {
            req.flash('error', 'Người này hiện đã là cư dân trong phòng khác');
            return res.redirect('/users');
        }
        
        // Check if contract exists and is active
        const isValidContract = await Resident.checkValidContract(MaHopDong, MaPhong);
        
        if (!isValidContract) {
            req.flash('error', 'Hợp đồng không tồn tại hoặc đã hết hiệu lực');
            return res.redirect('/users');
        }
        
        // Insert new resident
        await Resident.addToContract({
            MaHopDong,
            MaNguoiThue,
            VaiTro,
            NgayVaoO
        });
        
        // Get resident name for response
        const resident = await User.getById(MaNguoiThue);
        
        req.flash('success', `Thêm cư dân "${resident.HoTen}" vào phòng thành công`);
        res.redirect('/users');
        
    } catch (error) {
        console.error('Error adding resident:', error);
        req.flash('error', 'Có lỗi xảy ra khi thêm cư dân: ' + error.message);
        res.redirect('/users');
    }
}