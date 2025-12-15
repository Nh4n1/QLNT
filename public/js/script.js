console.log("Script loaded successfully");

// Handle "Tạo mới" button click
const rentHouseAddBtn = document.querySelector(".rent-house-add-btn");
if (rentHouseAddBtn) {
    rentHouseAddBtn.addEventListener("click", () => {
        document.getElementById("rentHouseForm").reset();
        $('#rentHouseModal').modal('show');
    });
}

const btnSave = document.querySelector("#rentHouseModal #btnSave");
if (btnSave) {
    btnSave.addEventListener("click", () => {
        const tenNha = document.getElementById("tenNha").value.trim();
        const diaChi = document.getElementById("diaChi").value.trim();

        if (!tenNha || !diaChi) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }
        
        // Submit form tới /rent-houses với method POST
        document.getElementById("rentHouseForm").submit();
    });
}


const alert = document.querySelector("[show-alert]");
if (alert) {
  const dataTime = alert.getAttribute("data-time");
  const closeAlert = alert.querySelector("[close-alert]");
  closeAlert.addEventListener("click", () => {
    alert.classList.add("alert-hidden");
  });

  setTimeout(() => {
    alert.classList.add("alert-hidden");
  }, dataTime);
}

// Handle "Thêm phòng" button click on Rooms page
const btnAddRoom = document.getElementById("btnAddRoom");
if (btnAddRoom) {
    btnAddRoom.addEventListener("click", () => {
        document.getElementById("roomForm").reset();
        $('#roomModal').modal('show');
    });
}

// Handle Save Room button click
const btnSaveRoom = document.getElementById("btnSaveRoom");
if (btnSaveRoom) {
    btnSaveRoom.addEventListener("click", () => {
        const maNha = document.getElementById("maNha").value.trim();
        const tenPhong = document.getElementById("tenPhong").value.trim();
        const giaThue = document.getElementById("giaThue").value.trim();
        
        if (!maNha || !tenPhong || !giaThue) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }
        console.log("Submitting room form");
        // Submit form
        document.getElementById("roomForm").submit();
    });
}
