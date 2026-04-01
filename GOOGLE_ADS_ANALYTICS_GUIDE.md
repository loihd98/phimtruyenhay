# Google Ads & Analytics Setup Guide

## 1. Google Analytics 4 (GA4)

### Bước 1: Tạo GA4 Property

1. Truy cập [Google Analytics](https://analytics.google.com/)
2. Đăng nhập bằng tài khoản Google
3. Click **Admin** (biểu tượng bánh răng) → **Create Property**
4. Nhập tên: `Phim Truyện Hay`
5. Chọn timezone: **(GMT+7) Ho Chi Minh**
6. Chọn currency: **Vietnamese Dong (VND)**
7. Click **Next** → chọn ngành **Arts & Entertainment**
8. Click **Create**

### Bước 2: Tạo Web Stream

1. Trong property vừa tạo, click **Data Streams** → **Add stream** → **Web**
2. Nhập URL: `https://phimtruyenhay.com`
3. Stream name: `Website`
4. Click **Create stream**

### Bước 3: Lấy Measurement ID

1. Sau khi tạo stream, bạn sẽ thấy **Measurement ID** dạng: `G-XXXXXXXXXX`
2. Copy ID này

### Bước 4: Cấu hình env

Thêm vào file `.env.local` (frontend) hoặc `docker-compose`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Docker Compose** (`docker-compose.prod.yml`):

```yaml
frontend:
  environment:
    - NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 2. Google AdSense

### Bước 1: Đăng ký AdSense

1. Truy cập [Google AdSense](https://www.google.com/adsense/)
2. Click **Get Started**
3. Nhập URL website: `https://phimtruyenhay.com`
4. Chọn quốc gia và đồng ý điều khoản
5. Liên kết với tài khoản Google

### Bước 2: Xác minh quyền sở hữu website

AdSense sẽ yêu cầu xác minh. Code đã được tích hợp sẵn qua component `GoogleAdSense.tsx` — chỉ cần thêm Client ID vào env.

### Bước 3: Lấy Publisher ID (Client ID)

1. Sau khi đăng ký, vào AdSense dashboard
2. Click **Account** → **Account information**
3. Publisher ID có dạng: `ca-pub-XXXXXXXXXXXXXXXX`

### Bước 4: Cấu hình env

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### Bước 5: Tạo Ad Units

1. Trong AdSense, vào **Ads** → **By ad unit**
2. Tạo các ad unit:
   - **Banner đầu trang**: Display ads → Horizontal → Lấy `data-ad-slot`
   - **Sidebar**: Display ads → Vertical → Lấy `data-ad-slot`
   - **Trong bài viết**: In-article ads → Lấy `data-ad-slot`
   - **Cuối bài**: Display ads → Rectangle → Lấy `data-ad-slot`

### Bước 6: Sử dụng AdBanner component

Trong các page component:

```tsx
import AdBanner from "@/components/seo/AdBanner";

// Banner ngang đầu trang
<AdBanner slot="1234567890" format="horizontal" />

// Sidebar
<AdBanner slot="0987654321" format="vertical" />

// Trong bài viết
<AdBanner slot="1122334455" format="rectangle" />

// Responsive tự động
<AdBanner slot="5544332211" format="auto" responsive />
```

---

## 3. Google Search Console (Khuyến nghị)

### Xác minh website

1. Truy cập [Google Search Console](https://search.google.com/search-console)
2. Thêm property: `https://phimtruyenhay.com`
3. Chọn phương thức xác minh **HTML tag**
4. Copy mã xác minh
5. Thêm vào `layout.tsx`:

```tsx
// Trong metadata object, mở phần verification:
verification: {
  google: 'your-google-verification-code',
},
```

File: `frontend/src/app/layout.tsx` — tìm phần `verification` (đã có sẵn comment).

---

## 4. Tổng hợp biến môi trường

### File `.env.local` (frontend)

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### Docker Compose Production

```yaml
frontend:
  environment:
    - NEXT_PUBLIC_API_URL=https://phimtruyenhay.com/api
    - NEXT_PUBLIC_SITE_URL=https://phimtruyenhay.com
    - NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
    - NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

---

## 5. Kiểm tra hoạt động

### Google Analytics

1. Sau khi deploy, mở website
2. Mở [GA4 Realtime Report](https://analytics.google.com/) → **Reports** → **Realtime**
3. Bạn sẽ thấy 1 active user (chính bạn)

### Google AdSense

1. AdSense cần **review website** (1-14 ngày)
2. Trong thời gian chờ, ad sẽ hiển thị dạng placeholder hoặc trống
3. Sau khi được approve, quảng cáo sẽ tự động hiển thị

### Debug

- Mở browser DevTools → Network tab → tìm `gtag` hoặc `analytics`
- Cài extension [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) để debug

---

## 6. Lưu ý quan trọng

- **NEXT*PUBLIC*** prefix là bắt buộc cho biến frontend (Next.js exposes to browser)
- Sau khi thêm env vars, cần **rebuild** frontend container
- AdSense yêu cầu website có đủ nội dung (>30 bài viết) trước khi approve
- Không click vào quảng cáo của chính mình — vi phạm policy
- GA4 data có thể mất 24-48h để hiển thị đầy đủ trong reports
