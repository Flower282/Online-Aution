# Hướng Dẫn Cấu Hình VNPay Payment Gateway (Production)

## Bước 1: Đăng Ký Tài Khoản VNPay Production

### Đăng Ký VNPay Production (Thật)

1. **Truy cập website VNPay**: https://www.vnpayment.vn/
2. **Liên hệ đăng ký merchant**:
   - Email: support@vnpayment.vn
   - Hotline: 1900 636 247
   - Hoặc điền form đăng ký tại: https://www.vnpayment.vn/merchant-registration

3. **Chuẩn bị hồ sơ** (thường cần):
   - Giấy phép kinh doanh
   - CMND/CCCD người đại diện
   - Hợp đồng dịch vụ
   - Thông tin tài khoản ngân hàng

4. **Sau khi được duyệt**, VNPay sẽ cung cấp:
   - **TMN Code** (Terminal Code): Mã định danh merchant
   - **Secret Key** (Hash Secret): Khóa bí mật để ký và verify signature
   - **Thông tin kết nối API**

### Test với Sandbox (Tùy chọn)

Nếu muốn test trước khi có tài khoản production:
1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản test (miễn phí)
3. Nhận TMN Code và Secret Key test
4. Test xong, chuyển sang production khi đã có tài khoản thật

## Bước 2: Cấu Hình Trong VNPay Merchant Portal

1. **Đăng nhập vào VNPay Merchant Portal**:
   - Production: https://merchant.vnpayment.vn/
   - Sandbox: https://sandbox.vnpayment.vn/merchant/

2. Vào mục **Cấu hình** → **Thông tin kết nối** hoặc **Cấu hình IPN**

3. **Đăng ký các URL sau** (QUAN TRỌNG - Phải đăng ký chính xác):

### Return URL (URL redirect sau khi thanh toán)
```
https://yourdomain.com/wallet/payment/callback
```
**Lưu ý:**
- Production **PHẢI** dùng HTTPS
- URL phải khớp chính xác 100% (bao gồm protocol, domain, path)
- Không có trailing slash

### Webhook URL / IPN URL (URL nhận thông báo server-to-server)
```
https://yourdomain.com/api/wallet/payment/webhook
```
**Lưu ý:**
- Production **PHẢI** là HTTPS
- Server phải có public IP và có thể nhận request từ internet
- VNPay sẽ gọi webhook từ IP cố định (có thể whitelist IP này)
- Webhook phải trả về HTTP 200 trong vòng 30 giây

### IP Whitelist (Tùy chọn nhưng khuyến nghị)
- Liên hệ VNPay để lấy danh sách IP của họ
- Whitelist IP này trong firewall/server để tăng bảo mật

## Bước 3: Tạo File .env

1. Copy file `.env.example` thành `.env`:
```bash
cp server/.env.example server/.env
```

2. Mở file `server/.env` và điền thông tin **VNPay Production**:

```env
# ============================================
# VNPay Production Configuration
# ============================================
VNPAY_ENVIRONMENT=production                # Set thành 'production' để dùng VNPay thật
VNPAY_TMN_CODE=ABC123456                    # TMN Code từ VNPay (thay bằng code thật của bạn)
VNPAY_SECRET_KEY=ABCDEFGHIJKLMNOPQRSTUVWXYZ # Secret Key từ VNPay (thay bằng key thật)
VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/wallet/payment/callback
VNPAY_WEBHOOK_URL=https://yourdomain.com/api/wallet/payment/webhook

# IP Whitelist cho Webhook (tùy chọn)
# Liên hệ VNPay để lấy danh sách IP, ví dụ: 203.113.131.2,203.113.131.3
VNPAY_WHITELIST_IPS=

# ============================================
# Application URLs (Production)
# ============================================
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
NODE_ENV=production
```

**Lưu ý quan trọng:**
- Thay `yourdomain.com` bằng domain thật của bạn
- Tất cả URL phải là **HTTPS** trong production
- `VNPAY_ENVIRONMENT=production` để code tự động dùng URL production

## Bước 4: Kiểm Tra Cấu Hình

1. Khởi động server:
```bash
cd server
npm start
```

2. Test tạo payment request:
```bash
curl -X POST http://localhost:5000/api/wallet/payment/request \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "amount": 100000,
    "paymentMethod": "vnpay"
  }'
```

3. Nếu thành công, bạn sẽ nhận được `paymentUrl` - mở URL này để test thanh toán

## Bước 5: Checklist Trước Khi Go Live Production

### ✅ Checklist Bảo Mật

- [ ] **HTTPS đã được cấu hình** cho cả frontend và backend
- [ ] **SSL Certificate hợp lệ** (không phải self-signed)
- [ ] **VNPAY_SECRET_KEY** đã được thay bằng key production (không dùng key test)
- [ ] **VNPAY_TMN_CODE** đã được thay bằng code production
- [ ] **Return URL và Webhook URL** đã đăng ký trong VNPay portal
- [ ] **Webhook URL có thể truy cập từ internet** (test bằng curl/public IP)
- [ ] **Firewall/Security Group** cho phép VNPay IP gọi webhook
- [ ] **File .env không được commit** vào Git (đã có trong .gitignore)

### ✅ Checklist Chức Năng

- [ ] Test thanh toán thành công
- [ ] Test thanh toán thất bại
- [ ] Test callback redirect về đúng trang
- [ ] Test webhook nhận được và xử lý đúng
- [ ] Test idempotency (không double charge khi user click nhiều lần)
- [ ] Test với số tiền khác nhau
- [ ] Kiểm tra transaction được lưu vào DB đúng

### ✅ Checklist Monitoring

- [ ] Setup logging để track mọi transaction
- [ ] Setup alert khi webhook fail
- [ ] Setup monitoring cho payment success rate
- [ ] Có cách rollback nếu có lỗi

## Bước 6: Liên Hệ VNPay Support

Nếu gặp vấn đề khi tích hợp production:

- **Email**: support@vnpayment.vn
- **Hotline**: 1900 636 247
- **Website**: https://www.vnpayment.vn/
- **Documentation**: https://www.vnpayment.vn/apis/

## Lưu Ý Bảo Mật

1. **KHÔNG commit file `.env`** vào Git
2. **Giữ Secret Key bí mật** - không chia sẻ công khai
3. **Sử dụng HTTPS** trong production
4. **Verify signature** mọi callback/webhook từ VNPay
5. **Kiểm tra amount** từ DB, không tin amount từ gateway

## Troubleshooting

### Lỗi "Invalid signature"
- Kiểm tra `VNPAY_SECRET_KEY` đã đúng chưa
- Đảm bảo không có khoảng trắng thừa trong secret key

### Lỗi "Transaction not found"
- Kiểm tra `VNPAY_RETURN_URL` đã đăng ký trong VNPay portal chưa
- Đảm bảo URL khớp chính xác (bao gồm http/https, port, path)

### Webhook không nhận được
- Kiểm tra server có public IP không (localhost không nhận được webhook)
- Sử dụng ngrok hoặc deploy để test webhook
- Kiểm tra firewall/security group có chặn request từ VNPay không

## Tài Liệu Tham Khảo

- VNPay Documentation: https://sandbox.vnpayment.vn/apis/
- VNPay Integration Guide: https://sandbox.vnpayment.vn/apis/docs/

