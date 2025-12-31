const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const io = new Server(server, {
    cors: { origin: "*" },
});

const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
const cols = 12;

// seatMap: A1 -> { status, owner }
let seatMap = {};
rows.forEach((r) => {
    for (let i = 1; i <= cols; i++) {
        seatMap[`${r}${i}`] = {
            status: "available",
            owner: null,
        };
    }
});

// Gửi dữ liệu ghế gọn nhẹ
function sendSeatUpdate() {
    let data = {};
    for (let s in seatMap) data[s] = seatMap[s].status;
    io.emit("seat_update", data);
}

io.on("connection", (socket) => {
    console.log("Client:", socket.id);
    sendSeatUpdate();

    // Chọn ghế
    socket.on("select_seat", (seat) => {
        if (seatMap[seat].status === "available") {
            seatMap[seat] = {
                status: "selected",
                owner: socket.id,
            };
            io.emit("notification", `Ghế ${seat} vừa được chọn`);
            sendSeatUpdate();
        }
    });

    // Hủy ghế
    socket.on("cancel_seat", (seat) => {
        if (
            seatMap[seat].status === "selected" &&
            seatMap[seat].owner === socket.id
        ) {
            seatMap[seat] = { status: "available", owner: null };
            sendSeatUpdate();
        }
    });

    // Xác nhận đặt vé
    socket.on("confirm_booking", (seats) => {
        seats.forEach((seat) => {
            if (
                seatMap[seat].status === "selected" &&
                seatMap[seat].owner === socket.id
            ) {
                seatMap[seat] = { status: "booked", owner: null };
            }
        });
        io.emit("notification", "Đặt vé thành công");
        sendSeatUpdate();
    });

    // Client thoát → trả ghế
    socket.on("disconnect", () => {
        for (let seat in seatMap) {
            if (seatMap[seat].owner === socket.id) {
                seatMap[seat] = { status: "available", owner: null };
            }
        }
        sendSeatUpdate();
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(3000, () => console.log("Server running at port 3000"));
