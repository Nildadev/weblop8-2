# 🌸 Web Lớp 8/2 - Nơi Lưu Giữ Kỷ Niệm

Một ứng dụng web nhỏ gọn, hiện đại và "cute" dành riêng cho tập thể lớp 8/2. Trang web giúp quản lý danh sách thành viên, đánh giá mức độ yêu mến và gửi trao những lời nhắn yêu thương.

![License](https://img.shields.io/badge/Status-Completed-success)
![Vibe](https://img.shields.io/badge/Vibe-Cute%20%26%20Chill-ff69b4)

## ✨ Tính Năng Nổi Bật

- **🏆 Bảng Xếp Hạng (Leaderboard):** Vinh danh những thành viên được yêu mến nhất lớp dựa trên số lượng "tim".
- **💬 Lời Nhắn Yêu Thương:** Gửi những lời chúc, lời nhắn bí mật cho từng bạn trong lớp.
- **🎂 Theo Dõi Sinh Nhật:** Tự động đếm ngược và thông báo khi sắp đến sinh nhật của một thành viên. Có hiệu ứng đặc biệt trong ngày sinh nhật!
- **🎨 Đa Dạng Giao Diện (Multi-theme):** Chuyển đổi linh hoạt giữa các tông màu Pink (Cute), Blue (Modern) và Dark (Cool).
- **🎉 Hiệu Ứng Pháo Hoa:** Bắn pháo hoa giấy (Confetti) khi tặng 5 tim cho bạn bè.
- **🛡️ Chế Độ Quản Trị (Admin):** Lối vào bí mật dành cho Admin để quản lý danh sách lớp (Thêm/Sửa/Xóa).
- **☁️ Đồng Bộ Firebase:** Dữ liệu được lưu trữ và cập nhật thời gian thực trên mây.

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** HTML5, CSS3 (Flexbox, Grid, Variables), JavaScript (ES6).
- **Backend:** [Firebase Firestore](https://firebase.google.com/) (Real-time Database).
- **Thư viện:** [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) (Hiệu ứng pháo hoa).

## 🚀 Hướng Dẫn Chạy Trên Máy

1. **Tải project:** Download hoặc Clone repository này về máy.
2. **Chạy Server:** 
   - Nếu dùng VS Code: Cài extension **Live Server**, mở `index.html` và nhấn "Go Live".
   - Nếu dùng Node.js: Chạy lệnh `npx serve .` trong thư mục project.
3. **Truy cập:** Mở trình duyệt và vào địa chỉ `http://localhost:5500` (hoặc port tương ứng).

## 🔐 Chế Độ Admin

Để bảo vệ sự riêng tư, nút Admin được ẩn tinh tế ở chân trang (Footer).
- **Lối vào:** Click vào dòng chữ `© 2026 Quản trị viên` ở cuối trang.

## ⚙️ Thiết Lập Firebase

Để lưu trữ dữ liệu của riêng lớp bạn:
1. Tạo một project trên [Firebase Console](https://console.firebase.google.com/).
2. Bật **Cloud Firestore** ở chế độ Test Mode.
3. Lấy thông số cấu hình và dán vào file `config.js`.

---

⚠ **LƯU Ý:**
Trang web này được làm với mục đích học tập, vui vẻ và không cổ xúy cho bất cứ hành động tiêu cực nào. Hãy luôn gửi những lời nhắn tích cực cho bạn bè nhé! ♥

**Made with Love by [Nildadev](https://guns.lol/nilthedev)**