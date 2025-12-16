
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

// Handle "Tạo mới hợp đồng" button click on Contracts page
const btnNewContract = document.getElementById("btnNewContract");
if (btnNewContract) {
    btnNewContract.addEventListener("click", () => {
        document.getElementById("contractForm").reset();
        // Disable all service price inputs
        document.querySelectorAll(".service-price-field").forEach(input => {
            input.disabled = true;
        });
        $('#contractModal').modal('show');
    });
}

// Handle service checkbox - enable/disable price input
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

// Handle Save Contract button click
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

        // Collect selected services with prices
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

        // Add services data to form as hidden inputs
        const form = document.getElementById("contractForm");
        // Clear any existing service inputs
        form.querySelectorAll(".service-hidden-input").forEach(input => input.remove());
        
        // Add service data
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