const socket = io("http://localhost:3000");

const seatDiv = document.getElementById("seats");
const list = document.getElementById("selectedSeats");
const total = document.getElementById("total");

let selected = [];

// Giá vé theo hàng
function getPrice(seat) {
    const row = seat.charAt(0);
    if (["A", "B", "C"].includes(row)) return 70000;
    if (["D", "E", "F"].includes(row)) return 75000;
    return 80000;
}

// Render ghế
socket.on("seat_update", (seats) => {
    seatDiv.innerHTML = "";
    list.innerHTML = "";
    selected = [];

    Object.keys(seats).forEach((seat) => {
        const div = document.createElement("div");
        div.innerText = seat;
        div.className = `seat ${seats[seat]}`;

        if (seats[seat] === "available") {
            div.onclick = () => socket.emit("select_seat", seat);
        }

        if (seats[seat] === "selected") {
            div.onclick = () => socket.emit("cancel_seat", seat);
            selected.push(seat);

            const li = document.createElement("li");
            li.innerText = `${seat} - ${getPrice(seat).toLocaleString()} VNĐ`;
            list.appendChild(li);
        }

        seatDiv.appendChild(div);
    });

    total.innerText = selected
        .reduce((sum, s) => sum + getPrice(s), 0)
        .toLocaleString();
});

// Thông báo realtime
socket.on("notification", (msg) => {
    alert(msg);
});

// Xác nhận
document.getElementById("confirm").onclick = () => {
    socket.emit("confirm_booking", selected);
};
