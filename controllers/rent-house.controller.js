import RentHouse from '../models/rent-house.model.js';
import Room from '../models/room.model.js';

//[GET] /rent-houses
export const index = async (req, res) => {
    const houses = await RentHouse.findAll({
        raw: true
    });

    const rooms = await Room.findAll({
        raw: true
    });

    const housesWithStats = houses.map(house => {
            
            const roomsInHouse = rooms.filter(room => room.MaNha === house.MaNha);

            return {
                ...house, 
                totalRooms: roomsInHouse.length,
                availableRooms: roomsInHouse.filter(room => room.TrangThai === 'ConTrong').length,
                rentedRooms: roomsInHouse.filter(room => room.TrangThai === 'DaThue').length
            };
        });
    res.render('pages/rent-houses/index', {
        houses: housesWithStats,
        messages: req.flash()
    });
}

//[POST] /rent-houses
export const create = async (req, res) => {
    try {
        const { TenNha, DiaChi } = req.body;
        
        // Validation
        if (!TenNha || !DiaChi) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin');
            res.redirect('/rent-houses');
        }

       
        const timestamp = Date.now().toString().slice(-5);
        const MaNha = `NHA_${timestamp}`;

       
        const newHouse = await RentHouse.create({
            MaNha: MaNha,
            TenNha: TenNha,
            DiaChi: DiaChi,
            deleted: false
        });

        req.flash('success', 'Tạo nhà trọ thành công!');
        res.redirect('/rent-houses');
    } catch (error) {
        console.error('Error creating rent house:', error);
        req.flash('error', 'Lỗi khi tạo nhà trọ: ' + error.message);
        res.redirect('/rent-houses');
    }
}