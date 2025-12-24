import RentHouse from "../models/rent-house.model.js";
import Room from "../models/room.model.js";

export const index = async (req, res) => {
    const rooms = await Room.getListWithContracts();
    const rentHouses = await RentHouse.findAll({
        where: { deleted: false },
        raw: true
    });
  
    res.render('pages/rooms/index', {
        rooms: rooms,
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
        
        await Room.createRoom({
            MaNha,
            TenPhong,
            GiaThueHienTai,
            SoNguoiToiDa
        });

        req.flash('success', 'Thêm phòng trọ thành công!');
        res.redirect('/rooms');
    } catch (error) {
        console.error('Error creating room:', error);
        req.flash('error', 'Lỗi khi thêm phòng: ' + error.message);
        res.redirect('/rooms');
    }
}