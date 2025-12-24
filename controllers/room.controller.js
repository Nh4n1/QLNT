import { where } from "sequelize";
import sequelize from "../config/database.js"
import RentHouse from "../models/rent-house.model.js";
import Room from "../models/room.model.js"

export const index = async (req, res) => {
    const roomList = await sequelize.query(
    `SELECT 
        P.MaPhong,
        P.TenPhong,
        P.TrangThai AS TrangThaiPhong,
        NT.HoTen AS TenKhachHang,
        NT.SDT AS SoDienThoai,
        P.GiaThueHienTai,
        HD.TienCoc,
        COALESCE(HD.GiaThueChot, P.GiaThueHienTai) AS GiaHienThi,
        HD.NgayKetThuc
    FROM phong_tro P
    LEFT JOIN hop_dong HD 
        ON P.MaPhong = HD.MaPhong 
        AND HD.TrangThai = 'ConHieuLuc' 
        AND HD.deleted = 0
    LEFT JOIN nguoi_thue NT 
        ON HD.MaNguoiThue = NT.MaNguoiThue 
        AND NT.deleted = 0
    WHERE P.deleted = 0
    ORDER BY P.MaPhong ASC;`
    );
    const rentHouses= await RentHouse.findAll(
       { deleted: false, raw: true }
        
    );
  
    res.render('pages/rooms/index', {
        rooms: roomList[0],
        rentHouses: rentHouses,
        messages: req.flash()
    });
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
        // Create new room
        const timestamp = Date.now().toString().slice(-5);
        const MaPhong = `P_${timestamp}`;
        const newRoom = await Room.create({
            MaPhong: MaPhong,
            MaNha: MaNha,
            TenPhong: TenPhong,
            GiaThueHienTai: GiaThueHienTai || 0,
            SoNguoiToiDa: SoNguoiToiDa || 1,
            TrangThai: 'ConTrong'
        });

        req.flash('success', 'Thêm phòng trọ thành công!');
        res.redirect('/rooms');
    } catch (error) {
        console.error('Error creating room:', error);
        req.flash('error', 'Lỗi khi thêm phòng: ' + error.message);
        res.redirect('/rooms');
    }
}