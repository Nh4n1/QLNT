
console.log("Script loaded successfully");

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

const btnAddRoom = document.getElementById("btnAddRoom");
if (btnAddRoom) {
    btnAddRoom.addEventListener("click", () => {
        document.getElementById("roomForm").reset();
        $('#roomModal').modal('show');
    });
}

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
        document.getElementById("roomForm").submit();
    });
}

const btnNewContract = document.getElementById("btnNewContract");
if (btnNewContract) {
    btnNewContract.addEventListener("click", () => {
        document.getElementById("contractForm").reset();
        document.querySelectorAll(".service-price-field").forEach(input => {
            input.disabled = true;
        });
        $('#contractModal').modal('show');
    });
}

const serviceCheckboxes = document.querySelectorAll(".service-checkbox");
serviceCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
        const serviceId = checkbox.getAttribute("data-service-id");
        const priceInput = document.querySelector(`.service-price-field[data-service-id="${serviceId}"]`);
        if (checkbox.checked) {
            priceInput.disabled = false;
            priceInput.focus();
        } else {
            priceInput.disabled = true;
            priceInput.value = "";
        }
    });
});

const btnSaveContract = document.getElementById("btnSaveContract");
if (btnSaveContract) {
    btnSaveContract.addEventListener("click", () => {
        const maPhong = document.getElementById("maPhong").value.trim();
        const ngayBatDau = document.getElementById("ngayBatDau").value.trim();
        const ngayKetThuc = document.getElementById("ngayKetThuc").value.trim();
        const tienCoc = document.getElementById("tienCoc").value.trim();
        const giaThueChot = document.getElementById("giaThueChot").value.trim();

        if (!maPhong || !ngayBatDau || !ngayKetThuc || !tienCoc || !giaThueChot) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        const servicesData = [];
        document.querySelectorAll(".service-checkbox:checked").forEach(checkbox => {
            const serviceId = checkbox.getAttribute("data-service-id");
            const priceInput = document.querySelector(`.service-price-field[data-service-id="${serviceId}"]`);
            const price = priceInput.value || priceInput.placeholder;
            servicesData.push({
                serviceId: serviceId,
                price: price
            });
        });

        const form = document.getElementById("contractForm");
        form.querySelectorAll(".service-hidden-input").forEach(input => input.remove());
        
        servicesData.forEach((service, index) => {
            const input1 = document.createElement("input");
            input1.type = "hidden";
            input1.name = `services[${index}][serviceId]`;
            input1.value = service.serviceId;
            input1.className = "service-hidden-input";
            form.appendChild(input1);

            const input2 = document.createElement("input");
            input2.type = "hidden";
            input2.name = `services[${index}][price]`;
            input2.value = service.price;
            input2.className = "service-hidden-input";
            form.appendChild(input2);
        });

        console.log("Services data:", servicesData);
        console.log("Submitting contract form");
        form.submit();
    });
}


const nguoiThueSelect = document.getElementById("nguoiThue");
if (nguoiThueSelect) {
    nguoiThueSelect.addEventListener("change", () => {
        const selectedOption = nguoiThueSelect.value;
        const selected = nguoiThueSelect.options[nguoiThueSelect.selectedIndex];
        const sdt = selected.getAttribute("data-sdt");
        const cccd = selected.getAttribute("data-cccd");
        if (selectedOption) {
            document.getElementById("sdt").value = sdt;
            document.getElementById("cccd").value = cccd;
            
        } else {
            document.getElementById("sdt").value = "";
            document.getElementById("cccd").value = "";
        }
    });
}
const phongSelect = document.getElementById("maPhong");
console.log(phongSelect);
if(phongSelect){
    phongSelect.addEventListener("change",()=>{
        console.log("run");
        const selectedOption = phongSelect.value;
        const selected = phongSelect.options[phongSelect.selectedIndex];
        const price = selected.getAttribute("data-gia");
        if(selectedOption) {
            document.getElementById('giaThueChot').value=price;
        }else{
            document.getElementById('giaThueChot').value='';
        }
       
    })
}

// Initialize Bootstrap dropdowns and handle room table actions
document.addEventListener('DOMContentLoaded', function() {
    // Enable Bootstrap dropdowns
    const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdownElements.forEach(element => {
        new bootstrap.Dropdown(element);
    });

    // Handle room table dropdown actions
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = this.getAttribute('data-action');
            const roomId = this.getAttribute('data-room-id');
            
            if (!action || !roomId) return;
            
            switch(action) {
                case 'end-contract':
                    if (confirm('Bạn có chắc chắn muốn kết thúc hợp đồng này không?')) {
                        window.location.href = `/rooms/${roomId}/end-contract`;
                    }
                    break;
                case 'delete-room':
                    if (confirm('Bạn có chắc chắn muốn xóa phòng này không?')) {
                        window.location.href = `/rooms/${roomId}/delete`;
                    }
                    break;
                case 'view-details':
                    window.location.href = `/rooms/${roomId}/details`;
                    break;
                case 'create-invoice':
                    window.location.href = `/rooms/${roomId}/invoice`;
                    break;
            }
        });
    });

    // Handle room list selection in contract form
    const roomItems = document.querySelectorAll('.room-item');
    const maPhongInput = document.getElementById('maPhong');
    const giaThueChot = document.getElementById('giaThueChot');
    const soNguoiO = document.getElementById('soNguoiO');

    roomItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove selected class from all items
            roomItems.forEach(r => r.classList.remove('selected'));
            
            // Add selected class to clicked item
            this.classList.add('selected');
            
            // Get room data
            const roomId = this.getAttribute('data-room-id');
            const roomPrice = this.getAttribute('data-room-price');
            const roomCapacity = this.getAttribute('data-room-capacity');
            
            // Set form values
            maPhongInput.value = roomId;
            giaThueChot.value = roomPrice;
            soNguoiO.value = roomCapacity;
        });
    });
});