import sequelize from "../config/database.js";
import Contract from "../models/contract.model.js";
import Service from "../models/service.model.js";

export const index = async(req, res) => {
  console.log("Fetching contracts...");
  try {

    const contracts = await Contract.getActiveContracts();
    const rooms = await Contract.getAvailableRooms();
    const users = await Contract.getAvailableUsers();
    const services = await Service.findAll({
      where: { deleted: false, LoaiDichVu: { [sequelize.Op.ne]: 'TienPhong' } }
    });

    res.render('pages/contracts/index', { 
      title: 'Contracts', 
      contracts, 
      rooms, 
      users, 
      services, 
      messages: req.flash()
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu hợp đồng:", error);
    req.flash('error', 'Có lỗi xảy ra');
    res.render('pages/contracts/index', { 
      title: 'Contracts', 
      contracts: [], 
      rooms: [], 
      users: [], 
      services: [], 
      messages: req.flash()
    });
  }
}


// [POST] /contracts/create
export const create = async (req, res) => {
    const data = req.body;
    const t = await sequelize.transaction();
    try {
        const MaHopDong = await Contract.generateId();
        
        const {
            MaPhong, MaNguoiThue, NgayBatDau, NgayKetThuc,
            TienCoc, GiaThueChot, SoNguoiO, services
        } = data;

        await Contract.createWithServices(
            {
                MaHopDong,
                MaPhong,
                MaNguoiThue,
                NgayBatDau,
                NgayKetThuc,
                TienCoc,
                GiaThueChot,
                SoNguoiO
            },
            services,
            t
        );

        await t.commit();
        req.flash('success', 'Tạo hợp đồng thành công!');
        res.redirect('/contracts');

    } catch (error) {
        await t.rollback();
        console.error("Lỗi tạo hợp đồng:", error);
        req.flash('error', 'Lỗi khi tạo hợp đồng: ' + error.message);
        res.redirect('/contracts');
    }
};