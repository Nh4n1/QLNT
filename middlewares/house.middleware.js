import RentHouse from '../models/rent-house.model.js';

// Middleware để load danh sách nhà trọ cho tất cả các trang
export const loadHouses = async (req, res, next) => {
    try {
        // Lấy tất cả nhà trọ
        const houses = await RentHouse.findAll({
            where: { deleted: false },
            raw: true
        });

        // Lấy nhà trọ đang được chọn từ session
        let selectedHouseId = req.session.selectedHouseId;

        // Nếu chưa có nhà trọ nào được chọn, mặc định chọn nhà đầu tiên
        if (!selectedHouseId && houses.length > 0) {
            selectedHouseId = houses[0].MaNha;
            req.session.selectedHouseId = selectedHouseId;
        }

        // Tìm nhà trọ đang được chọn
        const selectedHouse = houses.find(house => house.MaNha === selectedHouseId) || null;

        // Truyền data vào res.locals để sử dụng trong tất cả các views
        res.locals.houses = houses;
        res.locals.selectedHouse = selectedHouse;
        res.locals.houseCount = houses.length;
        res.locals.selectedHouseId = selectedHouseId;

        next();
    } catch (error) {
        console.error('Error loading houses:', error);
        res.locals.houses = [];
        res.locals.selectedHouse = null;
        res.locals.houseCount = 0;
        res.locals.selectedHouseId = null;
        next();
    }
};

// Controller để chọn nhà trọ
export const selectHouse = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra nhà trọ có tồn tại không
        const house = await RentHouse.findOne({
            where: { MaNha: id, deleted: false },
            raw: true
        });

        if (!house) {
            req.flash('error', 'Nhà trọ không tồn tại');
            return res.redirect('back');
        }

        // Lưu vào session
        req.session.selectedHouseId = id;

        req.flash('success', `Đã chuyển sang quản lý "${house.TenNha}"`);
        res.redirect('back');
    } catch (error) {
        console.error('Error selecting house:', error);
        req.flash('error', 'Lỗi khi chọn nhà trọ');
        res.redirect('back');
    }
};

// Controller để tạo nhà trọ từ sider modal
export const createHouse = async (req, res) => {
    try {
        const { TenNha, DiaChi } = req.body;
        
        // Validation
        if (!TenNha || !DiaChi) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin');
            return res.redirect('back');
        }

        // Tạo mã nhà trọ
        const timestamp = Date.now().toString().slice(-5);
        const MaNha = `NHA_${timestamp}`;

        // Tạo nhà trọ mới
        await RentHouse.create({
            MaNha: MaNha,
            TenNha: TenNha,
            DiaChi: DiaChi,
            deleted: false
        });

        // Tự động chọn nhà trọ vừa tạo
        req.session.selectedHouseId = MaNha;

        req.flash('success', 'Tạo nhà trọ thành công!');
        res.redirect('back');
    } catch (error) {
        console.error('Error creating house:', error);
        req.flash('error', 'Lỗi khi tạo nhà trọ: ' + error.message);
        res.redirect('back');
    }
};
