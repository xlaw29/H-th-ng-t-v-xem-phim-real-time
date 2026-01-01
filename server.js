const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const io = new Server(server, {
    cors: { origin: "*" },
});

const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
const cols = 12;

// seatMap: A1 -> { status, owner, bookedAt }
let seatMap = {};
rows.forEach((r) => {
    for (let i = 1; i <= cols; i++) {
        seatMap[`${r}${i}`] = {
            status: "available",
            owner: null,
            bookedAt: null,
        };
    }
});

// ✅ GỬI FULL DATA GHẾ
function sendSeatUpdate() {
    io.emit("seat_update", seatMap);
}

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    sendSeatUpdate();

    // Chọn ghế
    socket.on("select_seat", (seat) => {
        if (seatMap[seat].status === "available") {
            seatMap[seat] = {
                status: "selected",
                owner: socket.id,
                bookedAt: null,
            };
            sendSeatUpdate();
        }
    });

    // Hủy ghế đang chọn
    socket.on("cancel_seat", (seat) => {
        if (
            seatMap[seat].status === "selected" &&
            seatMap[seat].owner === socket.id
        ) {
            seatMap[seat] = {
                status: "available",
                owner: null,
                bookedAt: null,
            };
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
                seatMap[seat] = {
                    status: "booked",
                    owner: socket.id,
                    bookedAt: Date.now(), // ⏱ thời điểm đặt
                };
            }
        });
        socket.emit("notification", "🎉 Đặt vé thành công");
        sendSeatUpdate();
    });

    // Hủy vé (trong 5 phút)
    socket.on("cancel_booking", (seat) => {
        const seatInfo = seatMap[seat];
        if (!seatInfo) return;

        if (seatInfo.owner !== socket.id) {
            socket.emit("notification", "❌ Không có quyền hủy vé");
            return;
        }

        const diff = (Date.now() - seatInfo.bookedAt) / 60000;
        if (diff > 5) {
            socket.emit("notification", "⏰ Vé đã quá 5 phút");
            return;
        }

        seatMap[seat] = {
            status: "available",
            owner: null,
            bookedAt: null,
        };

        io.emit("notification", `✅ Vé ghế ${seat} đã được hủy`);
        sendSeatUpdate();
    });

    // Client thoát → trả ghế đang chọn
    socket.on("disconnect", () => {
        for (let seat in seatMap) {
            if (
                seatMap[seat].owner === socket.id &&
                seatMap[seat].status === "selected"
            ) {
                seatMap[seat] = {
                    status: "available",
                    owner: null,
                    bookedAt: null,
                };
            }
        }
        sendSeatUpdate();
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(3000, () =>
    console.log("🚀 Server running at http://localhost:3000")
);
