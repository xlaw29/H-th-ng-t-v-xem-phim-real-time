const socket = io("http://localhost:3000");

const seatDiv = document.getElementById("seats");
const list = document.getElementById("selectedSeats");
const total = document.getElementById("total");
const myTicketsBox = document.getElementById("myTickets");

let selectedSeats = [];
let myBookedSeats = {};
// { A1: bookedAt, B2: bookedAt }

// ================= GIÁ VÉ =================
function getPrice(seat) {
    const row = seat.charAt(0);
    if (["A", "B", "C"].includes(row)) return 70000;
    if (["D", "E", "F"].includes(row)) return 75000;
    return 80000;
}

// ================= FORMAT TIME =================
function formatTime(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
}

// ================= RENDER GHẾ =================
socket.on("seat_update", (seats) => {
    seatDiv.innerHTML = "";
    list.innerHTML = "";
    selectedSeats = [];

    Object.keys(seats).forEach((seat) => {
        const seatInfo = seats[seat];

        const div = document.createElement("div");
        div.innerText = seat;
        div.className = `seat ${seatInfo.status}`;

        // Ghế trống
        if (seatInfo.status === "available") {
            div.onclick = () => socket.emit("select_seat", seat);
        }

        // Ghế đang chọn của mình
        if (seatInfo.status === "selected") {
            div.onclick = () => socket.emit("cancel_seat", seat);
            selectedSeats.push(seat);

            const li = document.createElement("li");
            li.innerText = `${seat} - ${getPrice(seat).toLocaleString()} VNĐ`;
            list.appendChild(li);
        }

        // Ghế đã đặt của mình
        if (seatInfo.status === "booked" && seatInfo.bookedAt) {
            myBookedSeats[seat] = seatInfo.bookedAt;
        }

        seatDiv.appendChild(div);
    });

    total.innerText = selectedSeats
        .reduce((sum, s) => sum + getPrice(s), 0)
        .toLocaleString();

    renderMyTickets();
});

// ================= VÉ CỦA TÔI =================
function renderMyTickets() {
    myTicketsBox.innerHTML = "";

    Object.keys(myBookedSeats).forEach((seat) => {
        const bookedAt = myBookedSeats[seat];
        const remain = 5 * 60 * 1000 - (Date.now() - bookedAt);

        const row = document.createElement("div");
        row.className = "ticket-row";

        row.innerHTML = `
            <span class="seat-name">${seat}</span>
            <span class="countdown">${formatTime(remain)}</span>
            <button class="cancel-btn" ${
                remain <= 0 ? "disabled" : ""
            }>Hủy</button>
        `;

        const btn = row.querySelector("button");
        btn.onclick = () => {
            if (confirm(`Hủy vé ghế ${seat}?`)) {
                socket.emit("cancel_booking", seat);
                delete myBookedSeats[seat];
                renderMyTickets();
            }
        };

        myTicketsBox.appendChild(row);
    });
}

// ================= ĐẾM NGƯỢC =================
setInterval(() => {
    renderMyTickets();
}, 1000);

// ================= THÔNG BÁO =================
socket.on("notification", (msg) => {
    alert(msg);
});

// ================= XÁC NHẬN ĐẶT VÉ =================
document.getElementById("confirm").onclick = () => {
    if (selectedSeats.length === 0) {
        alert("Bạn chưa chọn ghế!");
        return;
    }

    socket.emit("confirm_booking", selectedSeats);

    selectedSeats.forEach((seat) => {
        myBookedSeats[seat] = Date.now();
    });

    selectedSeats = [];
    list.innerHTML = "";
    total.innerText = "0";

    renderMyTickets();
};
