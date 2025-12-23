import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Sequelize Model (giữ lại cho tương thích ngược)
export const User = sequelize.define('User', {
    MaNguoiThue: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    CCCD: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    HoTen: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    SDT: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
   tableName: 'nguoi_thue',
    timestamps: true,
    paranoid: false,
});

// ============================================
// USER MODEL - DAL (Data Access Layer)
// ============================================

export class UserModel {
    /**
     * Lấy danh sách tất cả người dùng
     */
    static async getAllUsers() {
        const [userList] = await sequelize.query('SELECT * FROM NGUOI_THUE WHERE deleted = 0');
        return userList;
    }

    /**
     * Lấy danh sách phòng với thông tin cư dân
     */
    static async getRoomsWithResidents() {
        const [roomListWithUsers] = await sequelize.query(`SELECT 
        pt.MaPhong,
        pt.TenPhong,
        ntr.TenNha,             
        hd.MaHopDong,
        hd.soNguoiO,
        
        -- Thông tin cư dân
        nt.HoTen AS TenCuDan,
        nt.CCCD,
        nt.SDT,
        cd.VaiTro,              
        cd.NgayVaoO,
        nt.NgaySinh,
        nt.GioiTinh,
        nt.DiaChi,
        -- Trạng thái hợp đồng
        hd.TrangThai AS TrangThaiHD

    FROM PHONG_TRO pt
    JOIN NHA_TRO ntr ON pt.MaNha = ntr.MaNha
    JOIN HOP_DONG hd ON pt.MaPhong = hd.MaPhong
    JOIN CU_DAN cd ON hd.MaHopDong = cd.MaHopDong
    JOIN NGUOI_THUE nt ON cd.MaNguoiThue = nt.MaNguoiThue

    WHERE 
        hd.deleted = FALSE 
        AND hd.TrangThai = 'ConHieuLuc'
        AND cd.deleted = FALSE
        AND (cd.NgayRoiDi IS NULL OR cd.NgayRoiDi >= CURRENT_DATE)

    ORDER BY 
        pt.TenPhong ASC, 
        cd.VaiTro ASC;  `);

        return roomListWithUsers;
    }

    /**
     * Lấy danh sách người dùng có sẵn để thêm vào phòng
     */
    static async getAvailableUsers() {
        const [availableUsers] = await sequelize.query(`
            SELECT nt.* 
            FROM NGUOI_THUE nt
            LEFT JOIN CU_DAN cd ON nt.MaNguoiThue = cd.MaNguoiThue
              AND cd.deleted = FALSE
              AND (cd.NgayRoiDi IS NULL OR cd.NgayRoiDi > CURRENT_DATE)
            WHERE nt.deleted = FALSE
              AND cd.MaNguoiThue IS NULL
            ORDER BY nt.HoTen ASC
        `);

        return availableUsers;
    }

    /**
     * Kiểm tra người dùng tồn tại bằng CCCD
     */
    static async checkUserExistsByIdCard(CCCD) {
        const [existingUser] = await sequelize.query(
            'SELECT * FROM NGUOI_THUE WHERE CCCD = ? AND deleted = 0',
            { replacements: [CCCD] }
        );

        return existingUser;
    }

    /**
     * Tạo người dùng mới
     */
    static async createUser(userData) {
        const { CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email, DiaChi } = userData;

        await sequelize.query(
            `INSERT INTO NGUOI_THUE (CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email, DiaChi, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [CCCD, HoTen, GioiTinh, NgaySinh, SDT, Email || null, DiaChi || null, 0]
            }
        );
    }

    /**
     * Kiểm tra cư dân tồn tại
     */
    static async checkResidentExists(MaNguoiThue) {
        const [existingResident] = await sequelize.query(
            `SELECT * FROM CU_DAN 
             WHERE MaNguoiThue = ? 
             AND deleted = 0 
             AND (NgayRoiDi IS NULL OR NgayRoiDi > CURRENT_DATE)`,
            { replacements: [MaNguoiThue] }
        );

        return existingResident;
    }

    /**
     * Kiểm tra hợp đồng tồn tại và hoạt động
     */
    static async checkContractExists(MaHopDong, MaPhong) {
        const [contractCheck] = await sequelize.query(
            `SELECT * FROM HOP_DONG 
             WHERE MaHopDong = ? 
             AND MaPhong = ?
             AND deleted = 0
             AND TrangThai = 'ConHieuLuc'`,
            { replacements: [MaHopDong, MaPhong] }
        );

        return contractCheck;
    }

    /**
     * Thêm cư dân vào phòng
     */
    static async addResident(residentData) {
        const { MaHopDong, MaNguoiThue, VaiTro, NgayVaoO } = residentData;

        await sequelize.query(
            `INSERT INTO CU_DAN (MaHopDong, MaNguoiThue, VaiTro, NgayVaoO, deleted)
             VALUES (?, ?, ?, ?, ?)`,
            {
                replacements: [MaHopDong, MaNguoiThue, VaiTro, NgayVaoO, 0]
            }
        );
    }

    /**
     * Lấy tên người dùng theo ID
     */
    static async getUserNameById(MaNguoiThue) {
        const [resident] = await sequelize.query(
            'SELECT HoTen FROM NGUOI_THUE WHERE MaNguoiThue = ?',
            { replacements: [MaNguoiThue] }
        );

        return resident[0];
    }
}

export default User;