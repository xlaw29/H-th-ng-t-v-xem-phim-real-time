const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const io = new Server(server, {
    cors: { origin: "*" },
});

// Tạo sơ đồ ghế
const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
const cols = 12;

// seatMap: A1 -> available | selected | booked
let seatMap = {};
rows.forEach((r) => {
    for (let i = 1; i <= cols; i++) {
        seatMap[`${r}${i}`] = "available";
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Gửi trạng thái ghế khi client mới vào
    socket.emit("seat_update", seatMap);

    // Chọn ghế
    socket.on("select_seat", (seat) => {
        if (seatMap[seat] === "available") {
            seatMap[seat] = "selected";
            io.emit("seat_update", seatMap);
        }
    });

    // Hủy ghế
    socket.on("cancel_seat", (seat) => {
        if (seatMap[seat] === "selected") {
            seatMap[seat] = "available";
            io.emit("seat_update", seatMap);
        }
    });

    // Xác nhận đặt vé
    socket.on("confirm_booking", (seats) => {
        seats.forEach((seat) => {
            if (seatMap[seat] === "selected") {
                seatMap[seat] = "booked";
            }
        });
        io.emit("seat_update", seatMap);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
