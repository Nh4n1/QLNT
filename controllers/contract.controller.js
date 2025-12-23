import sequelize from "../config/database.js";
import { ContractModel } from "../models/contract.model.js";

export const index = async(req, res) => {
  try {
    // Gọi Models để lấy dữ liệu
    const contracts = await ContractModel.getAllContracts();
    const rooms = await ContractModel.getAvailableRooms();
    const users = await ContractModel.getAvailableUsers();
    const services = await ContractModel.getServices();

    res.render('pages/contracts/index', { 
      title: 'Contracts', 
      contracts, 
      rooms, 
      users, 
      services, 
      messages: req.flash()
    });
  } catch (error) {
    console.error('Lỗi tải trang hợp đồng:', error);
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('/');
  }
}


// [POST] /contracts/create
export const create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const data = req.body;
        
        // Gọi Model để tạo hợp đồng
        const MaHopDong = await ContractModel.createContract(data, t);
        
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