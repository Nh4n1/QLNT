import sequelize from '../config/database.js';

export class ServiceModel {
    /**
     * Lấy danh sách tất cả dịch vụ
     */
    static async getAllServices() {
        const [services] = await sequelize.query(`
           SELECT * FROM DICH_VU WHERE LoaiDichVu != 'TienPhong' AND deleted = 0 ORDER BY TenDichVu ASC
        `);
        return services;
    }

    /**
     * Tạo dịch vụ mới
     */
    static async createService(serviceData) {
        const { TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu } = serviceData;
        
        const timestamp = Date.now().toString().slice(-5);
        const MaDichVu = `DV_${timestamp}`;
        
        await sequelize.query(
            `INSERT INTO DICH_VU (MaDichVu, TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu, deleted)
             VALUES (:MaDichVu, :TenDichVu, :DonGiaHienTai, :DonViTinh, :LoaiDichVu, 0)`,
            {
                replacements: {
                    MaDichVu,
                    TenDichVu,
                    DonGiaHienTai: DonGiaHienTai || 0,
                    DonViTinh: DonViTinh || '',
                    LoaiDichVu: LoaiDichVu || 'KhongChiSo'
                },
                type: sequelize.QueryTypes.INSERT
            }
        );
    }

    /**
     * Cập nhật dịch vụ
     */
    static async updateService(id, serviceData) {
        const { TenDichVu, DonGiaHienTai, DonViTinh, LoaiDichVu } = serviceData;
        
        await sequelize.query(
            `UPDATE DICH_VU 
             SET TenDichVu = :TenDichVu, 
                 DonGiaHienTai = :DonGiaHienTai, 
                 DonViTinh = :DonViTinh, 
                 LoaiDichVu = :LoaiDichVu,
                 updatedAt = NOW()
             WHERE MaDichVu = :id`,
            {
                replacements: {
                    id,
                    TenDichVu,
                    DonGiaHienTai: DonGiaHienTai || 0,
                    DonViTinh: DonViTinh || '',
                    LoaiDichVu: LoaiDichVu || 'KhongChiSo'
                },
                type: sequelize.QueryTypes.UPDATE
            }
        );
    }

    /**
     * Xóa mềm dịch vụ
     */
    static async deleteService(id) {
        await sequelize.query(
            `UPDATE DICH_VU 
             SET deleted = 1, deletedAt = NOW(), updatedAt = NOW()
             WHERE MaDichVu = :id`,
            {
                replacements: { id },
                type: sequelize.QueryTypes.UPDATE
            }
        );
    }
}

export default ServiceModel;
