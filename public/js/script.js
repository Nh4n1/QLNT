
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

// ===== INVOICE FORM FUNCTIONALITY =====

// Mở modal tạo hóa đơn mới
const btnNewInvoice = document.getElementById("btnNewInvoice");
if (btnNewInvoice) {
    btnNewInvoice.addEventListener("click", () => {
        const form = document.getElementById("invoiceForm");
        if (form) form.reset();
        
        // Reset selected room
        document.querySelectorAll('.room-invoice-item').forEach(r => r.classList.remove('selected'));
        
        // Set ngày lập hóa đơn = ngày hiện tại
        const today = new Date().toISOString().split('T')[0];
        const ngayLapInput = document.getElementById('ngayLapHoaDon');
        if (ngayLapInput) ngayLapInput.value = today;
        
        // Reset calculations
        resetInvoiceCalculations();
        
        $('#invoiceModal').modal('show');
    });
}

// Chọn phòng trong modal hóa đơn
const roomInvoiceItems = document.querySelectorAll('.room-invoice-item');
const maHopDongInvoice = document.getElementById('maHopDongInvoice');
const maPhongInvoice = document.getElementById('maPhongInvoice');
const giaPhongInput = document.getElementById('giaPhong');

roomInvoiceItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove selected class from all items
        roomInvoiceItems.forEach(r => r.classList.remove('selected'));
        
        // Add selected class to clicked item
        this.classList.add('selected');
        
        // Get room data
        const roomId = this.getAttribute('data-room-id');
        const roomPrice = this.getAttribute('data-room-price');
        const contractId = this.getAttribute('data-contract-id');
        const servicesData = this.getAttribute('data-services');
        
        // Set form values
        if (maPhongInvoice) maPhongInvoice.value = roomId;
        if (maHopDongInvoice) maHopDongInvoice.value = contractId;
        if (giaPhongInput) giaPhongInput.value = roomPrice;
        
        // Render dịch vụ theo phòng đã chọn
        renderRoomServices(servicesData);
        
        // Recalculate room price
        calculateRoomPrice();
    });
});

// Tính tiền phòng khi thay đổi ngày
const tuNgayInput = document.getElementById('tuNgay');
const denNgayInput = document.getElementById('denNgay');

if (tuNgayInput) {
    tuNgayInput.addEventListener('change', calculateRoomPrice);
}

if (denNgayInput) {
    denNgayInput.addEventListener('change', calculateRoomPrice);
}

// Hàm tính tiền phòng
function calculateRoomPrice() {
    const tuNgay = document.getElementById('tuNgay')?.value;
    const denNgay = document.getElementById('denNgay')?.value;
    const giaPhong = parseFloat(document.getElementById('giaPhong')?.value) || 0;
    
    if (!tuNgay || !denNgay || giaPhong <= 0) {
        updateRoomDisplay(0, 0, 0);
        return;
    }
    
    const fromDate = new Date(tuNgay);
    const toDate = new Date(denNgay);
    
    if (toDate <= fromDate) {
        updateRoomDisplay(0, 0, 0);
        return;
    }
    
    // Tính số ngày
    const diffTime = Math.abs(toDate - fromDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Tính tháng và ngày lẻ (1 tháng = 30 ngày)
    const months = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    
    // Tính tiền phòng
    // Giá theo tháng + giá theo ngày lẻ (giá ngày = giá tháng / 30)
    const pricePerDay = giaPhong / 30;
    const roomTotal = (months * giaPhong) + (remainingDays * pricePerDay);
    
    updateRoomDisplay(months, remainingDays, roomTotal);
    
    // Cập nhật tổng tiền
    calculateTotalInvoice();
}

function updateRoomDisplay(months, days, total) {
    const calcMonths = document.getElementById('calcMonths');
    const calcDays = document.getElementById('calcDays');
    const roomTotal = document.getElementById('roomTotal');
    
    if (calcMonths) calcMonths.textContent = months;
    if (calcDays) calcDays.textContent = days;
    if (roomTotal) roomTotal.textContent = formatCurrency(total);
}

function renderRoomServices(servicesDataStr) {
    const servicesWithIndexContainer = document.getElementById('servicesWithIndexContainer');
    const servicesWithIndexList = document.getElementById('servicesWithIndexList');
    const servicesWithoutIndexContainer = document.getElementById('servicesWithoutIndexContainer');
    const servicesWithoutIndexList = document.getElementById('servicesWithoutIndexList');
    const noRoomMessage = document.getElementById('noRoomSelectedMessage');
    
    // Ẩn thông báo chưa chọn phòng
    if (noRoomMessage) noRoomMessage.style.display = 'none';
    
    // Parse dữ liệu dịch vụ
    let servicesData = { withIndex: [], withoutIndex: [] };
    try {
        servicesData = JSON.parse(servicesDataStr) || { withIndex: [], withoutIndex: [] };
    } catch (e) {
        console.error('Error parsing services data:', e);
    }
    
    // Render dịch vụ có chỉ số
    if (servicesWithIndexList) {
        servicesWithIndexList.innerHTML = '';
        
        if (servicesData.withIndex && servicesData.withIndex.length > 0) {
            servicesWithIndexContainer.style.display = 'block';
            
            servicesData.withIndex.forEach(service => {
                const price = service.DonGiaChot || service.DonGiaHienTai;
                const html = `
                    <div class="service-index-item" 
                         data-service-id="${service.MaDichVu}" 
                         data-service-price="${price}"
                         data-service-unit="${service.DonViTinh || ''}">
                        <div class="service-header">
                            <div class="service-name">
                                <strong>${service.TenDichVu}</strong>
                                <span class="service-price">${formatNumber(price)} đ/${service.DonViTinh || ''}</span>
                            </div>
                        </div>
                        <div class="service-index-inputs">
                            <div class="index-input-group">
                                <label>Chỉ số cũ</label>
                                <input class="form-control index-old" type="number" 
                                       name="chiSoCu_${service.MaDichVu}" placeholder="0" min="0">
                            </div>
                            <div class="index-input-group">
                                <label>Chỉ số mới</label>
                                <input class="form-control index-new" type="number" 
                                       name="chiSoMoi_${service.MaDichVu}" placeholder="0" min="0">
                            </div>
                            <div class="index-result">
                                <div class="usage-display">
                                    <span class="usage-label">Tiêu thụ:</span>
                                    <span class="usage-value">0</span>
                                    <span class="usage-unit">${service.DonViTinh || ''}</span>
                                </div>
                                <div class="amount-display">
                                    <span class="amount-value">0 ₫</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                servicesWithIndexList.insertAdjacentHTML('beforeend', html);
            });
            
            // Bind events cho các input vừa tạo
            bindServiceIndexEvents();
        } else {
            servicesWithIndexContainer.style.display = 'none';
        }
    }
    
    // Render dịch vụ cố định
    if (servicesWithoutIndexList) {
        servicesWithoutIndexList.innerHTML = '';
        
        if (servicesData.withoutIndex && servicesData.withoutIndex.length > 0) {
            servicesWithoutIndexContainer.style.display = 'block';
            
            servicesData.withoutIndex.forEach(service => {
                const price = service.DonGiaChot || service.DonGiaHienTai;
                const html = `
                    <div class="service-fixed-item" 
                         data-service-id="${service.MaDichVu}" 
                         data-service-price="${price}"
                         data-service-unit="${service.DonViTinh || ''}">
                        <div class="service-info">
                            <div class="form-check">
                                <input class="form-check-input service-fixed-checkbox" 
                                       type="checkbox" 
                                       id="serviceFixed_${service.MaDichVu}" 
                                       name="dichVu_${service.MaDichVu}" 
                                       checked>
                                <label class="form-check-label" for="serviceFixed_${service.MaDichVu}">
                                    <strong>${service.TenDichVu}</strong>
                                </label>
                            </div>
                        </div>
                        <div class="service-amount">
                            <span class="service-fixed-price">${formatCurrency(price)}</span>
                            ${service.DonViTinh ? `<span class="service-unit-text">/${service.DonViTinh}</span>` : ''}
                        </div>
                    </div>
                `;
                servicesWithoutIndexList.insertAdjacentHTML('beforeend', html);
            });
            
            // Bind events cho các checkbox vừa tạo
            bindServiceFixedEvents();
        } else {
            servicesWithoutIndexContainer.style.display = 'none';
        }
    }
    
    // Tính lại tổng tiền
    calculateTotalInvoice();
}

// Bind events cho dịch vụ có chỉ số
function bindServiceIndexEvents() {
    document.querySelectorAll('#servicesWithIndexList .index-old').forEach(input => {
        input.addEventListener('input', function() {
            calculateServiceIndex(this.closest('.service-index-item'));
        });
    });
    
    document.querySelectorAll('#servicesWithIndexList .index-new').forEach(input => {
        input.addEventListener('input', function() {
            calculateServiceIndex(this.closest('.service-index-item'));
        });
    });
}

// Bind events cho dịch vụ cố định
function bindServiceFixedEvents() {
    document.querySelectorAll('#servicesWithoutIndexList .service-fixed-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', calculateTotalInvoice);
    });
}

// Helper format số
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

// Xử lý dịch vụ có chỉ số
const indexOldInputs = document.querySelectorAll('.index-old');
const indexNewInputs = document.querySelectorAll('.index-new');

indexOldInputs.forEach(input => {
    input.addEventListener('input', function() {
        calculateServiceIndex(this.closest('.service-index-item'));
    });
});

indexNewInputs.forEach(input => {
    input.addEventListener('input', function() {
        calculateServiceIndex(this.closest('.service-index-item'));
    });
});

function calculateServiceIndex(serviceItem) {
    if (!serviceItem) return;
    
    const oldIndex = parseFloat(serviceItem.querySelector('.index-old')?.value) || 0;
    const newIndex = parseFloat(serviceItem.querySelector('.index-new')?.value) || 0;
    const price = parseFloat(serviceItem.getAttribute('data-service-price')) || 0;
    
    const usage = Math.max(0, newIndex - oldIndex);
    const amount = usage * price;
    
    const usageValue = serviceItem.querySelector('.usage-value');
    const amountValue = serviceItem.querySelector('.amount-value');
    
    if (usageValue) usageValue.textContent = usage;
    if (amountValue) amountValue.textContent = formatCurrency(amount);
    
    calculateTotalInvoice();
}

// Xử lý checkbox dịch vụ cố định
const serviceFixedCheckboxes = document.querySelectorAll('.service-fixed-checkbox');
serviceFixedCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', calculateTotalInvoice);
});

// Xử lý checkbox tính theo ngày
const calcByDayCheckbox = document.getElementById('calcByDay');
if (calcByDayCheckbox) {
    calcByDayCheckbox.addEventListener('change', calculateTotalInvoice);
}

// Hàm tính tổng tiền hóa đơn
function calculateTotalInvoice() {
    // Tính tiền phòng
    const roomTotalText = document.getElementById('roomTotal')?.textContent || '0';
    const roomTotal = parseCurrency(roomTotalText);
    
    // Tính tiền dịch vụ có chỉ số
    let indexServiceTotal = 0;
    document.querySelectorAll('.service-index-item').forEach(item => {
        const amountText = item.querySelector('.amount-value')?.textContent || '0';
        indexServiceTotal += parseCurrency(amountText);
    });
    
    // Tính tiền dịch vụ cố định
    let fixedServiceTotal = 0;
    const calcByDay = document.getElementById('calcByDay')?.checked || false;
    
    document.querySelectorAll('.service-fixed-item').forEach(item => {
        const checkbox = item.querySelector('.service-fixed-checkbox');
        if (checkbox && checkbox.checked) {
            let price = parseFloat(item.getAttribute('data-service-price')) || 0;
            
            // Nếu tính theo ngày thực tế
            if (calcByDay) {
                const tuNgay = document.getElementById('tuNgay')?.value;
                const denNgay = document.getElementById('denNgay')?.value;
                
                if (tuNgay && denNgay) {
                    const fromDate = new Date(tuNgay);
                    const toDate = new Date(denNgay);
                    const totalDays = Math.ceil(Math.abs(toDate - fromDate) / (1000 * 60 * 60 * 24));
                    price = (price / 30) * totalDays;
                }
            }
            
            fixedServiceTotal += price;
        }
    });
    
    const servicesTotal = indexServiceTotal + fixedServiceTotal;
    const grandTotal = roomTotal + servicesTotal;
    
    // Cập nhật hiển thị
    const summaryRoom = document.getElementById('summaryRoom');
    const summaryServices = document.getElementById('summaryServices');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (summaryRoom) summaryRoom.textContent = formatCurrency(roomTotal);
    if (summaryServices) summaryServices.textContent = formatCurrency(servicesTotal);
    if (summaryTotal) summaryTotal.textContent = formatCurrency(grandTotal);
}

// Reset tính toán
function resetInvoiceCalculations() {
    updateRoomDisplay(0, 0, 0);
    
    // Reset các container dịch vụ
    const servicesWithIndexContainer = document.getElementById('servicesWithIndexContainer');
    const servicesWithIndexList = document.getElementById('servicesWithIndexList');
    const servicesWithoutIndexContainer = document.getElementById('servicesWithoutIndexContainer');
    const servicesWithoutIndexList = document.getElementById('servicesWithoutIndexList');
    const noRoomMessage = document.getElementById('noRoomSelectedMessage');
    
    if (servicesWithIndexContainer) servicesWithIndexContainer.style.display = 'none';
    if (servicesWithIndexList) servicesWithIndexList.innerHTML = '';
    if (servicesWithoutIndexContainer) servicesWithoutIndexContainer.style.display = 'none';
    if (servicesWithoutIndexList) servicesWithoutIndexList.innerHTML = '';
    if (noRoomMessage) noRoomMessage.style.display = 'block';
    
    const summaryRoom = document.getElementById('summaryRoom');
    const summaryServices = document.getElementById('summaryServices');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (summaryRoom) summaryRoom.textContent = '0 ₫';
    if (summaryServices) summaryServices.textContent = '0 ₫';
    if (summaryTotal) summaryTotal.textContent = '0 ₫';
}

// Helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(Math.round(amount));
}

function parseCurrency(text) {
    // Remove all non-numeric characters except decimal point
    const numStr = text.replace(/[^\d]/g, '');
    return parseFloat(numStr) || 0;
}

// Lưu hóa đơn
const btnSaveInvoice = document.getElementById("btnSaveInvoice");
if (btnSaveInvoice) {
    btnSaveInvoice.addEventListener("click", () => {
        const maHopDong = document.getElementById("maHopDongInvoice")?.value;
        const ngayLap = document.getElementById("ngayLapHoaDon")?.value;
        const tuNgay = document.getElementById("tuNgay")?.value;
        const denNgay = document.getElementById("denNgay")?.value;
        
        if (!maHopDong) {
            alert("Vui lòng chọn phòng để tạo hóa đơn");
            return;
        }
        
        if (!ngayLap || !tuNgay || !denNgay) {
            alert("Vui lòng điền đầy đủ thông tin ngày");
            return;
        }
        
        // Collect service data
        const form = document.getElementById("invoiceForm");
        
        // Add hidden input for total
        const totalText = document.getElementById('summaryTotal')?.textContent || '0';
        const totalAmount = parseCurrency(totalText);
        
        let hiddenTotal = form.querySelector('input[name="TongTien"]');
        if (!hiddenTotal) {
            hiddenTotal = document.createElement('input');
            hiddenTotal.type = 'hidden';
            hiddenTotal.name = 'TongTien';
            form.appendChild(hiddenTotal);
        }
        hiddenTotal.value = totalAmount;
        
        // Collect index services data
        document.querySelectorAll('.service-index-item').forEach((item, index) => {
            const serviceId = item.getAttribute('data-service-id');
            const oldIndex = item.querySelector('.index-old')?.value || 0;
            const newIndex = item.querySelector('.index-new')?.value || 0;
            const price = item.getAttribute('data-service-price');
            const amountText = item.querySelector('.amount-value')?.textContent || '0';
            const amount = parseCurrency(amountText);
            
            // Create hidden inputs
            const inputs = [
                { name: `indexServices[${index}][MaDichVu]`, value: serviceId },
                { name: `indexServices[${index}][ChiSoCu]`, value: oldIndex },
                { name: `indexServices[${index}][ChiSoMoi]`, value: newIndex },
                { name: `indexServices[${index}][DonGia]`, value: price },
                { name: `indexServices[${index}][ThanhTien]`, value: amount }
            ];
            
            inputs.forEach(inputData => {
                let input = form.querySelector(`input[name="${inputData.name}"]`);
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = inputData.name;
                    form.appendChild(input);
                }
                input.value = inputData.value;
            });
        });
        
        // Collect fixed services data
        let fixedIndex = 0;
        document.querySelectorAll('.service-fixed-item').forEach(item => {
            const checkbox = item.querySelector('.service-fixed-checkbox');
            if (checkbox && checkbox.checked) {
                const serviceId = item.getAttribute('data-service-id');
                const price = item.getAttribute('data-service-price');
                
                const inputs = [
                    { name: `fixedServices[${fixedIndex}][MaDichVu]`, value: serviceId },
                    { name: `fixedServices[${fixedIndex}][DonGia]`, value: price }
                ];
                
                inputs.forEach(inputData => {
                    let input = form.querySelector(`input[name="${inputData.name}"]`);
                        input = document.createElement('input');
                     if (!input) {
                       input.type = 'hidden';
                        input.name = inputData.name;
                        form.appendChild(input);
                    }
                    input.value = inputData.value;
                });
                
                fixedIndex++;
            }
        });
        
        console.log("Submitting invoice form");
        form.submit();
    });
}