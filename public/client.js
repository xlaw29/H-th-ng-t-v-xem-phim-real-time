const socket = io("http://localhost:3000");

const seatDiv = document.getElementById("seats");
const list = document.getElementById("selectedSeats");
const total = document.getElementById("total");

const PRICE = 75000;
let selected = [];

// Render ghế
socket.on("seat_update", (seats) => {
    seatDiv.innerHTML = "";
    list.innerHTML = "";
    selected = [];

    Object.keys(seats).forEach((seat) => {
        const div = document.createElement("div");
        div.innerText = seat;
        div.classList.add("seat", seats[seat]);

        if (seats[seat] === "available") {
            div.onclick = () => socket.emit("select_seat", seat);
        }
        if (seats[seat] === "selected") {
            selected.push(seat);
            div.onclick = () => socket.emit("cancel_seat", seat);

            const li = document.createElement("li");
            li.innerText = seat;
            list.appendChild(li);
        }

        seatDiv.appendChild(div);
    });

    total.innerText = selected.length * PRICE;
});

// Xác nhận đặt vé
document.getElementById("confirm").onclick = () => {
    socket.emit("confirm_booking", selected);
};
