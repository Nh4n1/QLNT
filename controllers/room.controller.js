import { where } from "sequelize";
import sequelize from "../config/database.js"
import RentHouse from "../models/rent-house.model.js";
import { RoomModel } from "../models/room.model.js"

export const index = async (req, res) => {
    try {
        // Gọi Model để lấy danh sách phòng
        const roomList = await RoomModel.getAllRoomsWithContracts();
        
        const rentHouses= await RentHouse.findAll(
           { deleted: false, raw: true }
        );
      
        res.render('pages/rooms/index', {
            rooms: roomList,
            rentHouses: rentHouses,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Lỗi tải trang phòng:', error);
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/');
    }
}

//[POST] /rooms
export const create = async (req, res) => {
    try {
        const { TenPhong, GiaThueHienTai, SoNguoiToiDa } = req.body;
        const MaNha = res.locals.selectedHouseId;
        
        if (!MaNha) {
            req.flash('error', 'Vui lòng chọn nhà trọ trước khi thêm phòng');
            return res.redirect('/rooms');
        }
        if (!TenPhong) {
            req.flash('error', 'Vui lòng điền tên phòng');
            return res.redirect('/rooms');
        }

        // Tạo ID phòng
        const timestamp = Date.now().toString().slice(-5);
        const MaPhong = `P_${timestamp}`;

        // Gọi Model để tạo phòng
        await RoomModel.createRoom({
            MaPhong,
            MaNha,
            TenPhong,
            GiaThueHienTai: GiaThueHienTai || 0,
            SoNguoiToiDa: SoNguoiToiDa || 1
        });

        req.flash('success', 'Thêm phòng trọ thành công!');
        res.redirect('/rooms');
    } catch (error) {
        console.error('Error creating room:', error);
        req.flash('error', 'Lỗi khi thêm phòng: ' + error.message);
        res.redirect('/rooms');
    }
}