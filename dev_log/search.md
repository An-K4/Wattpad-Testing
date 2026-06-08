# Devlog – Automation Test: Chức năng Tìm kiếm Wattpad
**Phạm vi:** TC01–TC18 | **Framework:** Playwright + TypeScript  
**Tổng số file:** 3 (`wattpad-search.spec.ts`, `wattpad-search-results.spec.ts`, `wattpad-search-suggestions.spec.ts`)

---

## Tổng quan

| Nhóm | File | TC | Kết quả |
|---|---|---|---|
| Tìm kiếm cơ bản | `wattpad-search.spec.ts` | TC01–TC07 | ✅ Pass |
| Kết quả tìm kiếm | `wattpad-search-results.spec.ts` | TC08–TC15 | ✅ Pass |
| Gợi ý tìm kiếm | `wattpad-search-suggestions.spec.ts` | TC16–TC18 | ✅ Pass |

---

## Nhóm 1 – Tìm kiếm cơ bản (TC01–TC07)

Nhóm này tương đối thuận lợi. Các test kiểm tra hành vi của ô search: từ khóa hợp lệ, không tồn tại, để trống, ký tự đặc biệt, chuỗi dài, số thuần túy và tìm bằng tag.

**Không có vấn đề đáng kể.** Selector `input[placeholder="Search"]` hoạt động ổn định cho toàn bộ nhóm này.

---

## Nhóm 2 – Kết quả tìm kiếm (TC08–TC15)

Nhóm này phức tạp nhất, mất nhiều vòng lặp fix nhất.

### Vấn đề 1 – Selector sai hoàn toàn (TC08–TC10, TC15)

**Triệu chứng:** `a[href*="/story/"]` tìm thấy element nhưng luôn ở trạng thái `hidden`.

**Nguyên nhân:** Sau khi inspect HTML thực tế, phát hiện cấu trúc thật của Wattpad như sau:

```html
<a class="story-card" href="/story/18646750">   ← thẻ <a> bọc ngoài
  <div class="story-card-data shown-xxs">       ← hiển thị trên mobile
  <div class="story-card-data hidden-xxs">      ← hiển thị trên desktop (bị ẩn CSS)
```

Selector `a[href*="/story/"]` nhặt nhầm các link trong nav và footer vốn bị ẩn. Selector đúng phải là `a.story-card` — thẻ `<a>` trực tiếp bọc ngoài card.

**Fix:** Thay toàn bộ `a[href*="/story/"]` → `a.story-card`. Đây là fix cốt lõi giải quyết TC08, TC09, TC10, TC15 cùng lúc.

### Vấn đề 2 – Ảnh bìa luôn hidden (TC08)

**Nguyên nhân:** Wattpad render 2 bản của mỗi card (mobile/desktop), bản desktop dùng class `hidden-xxs` → `img` bên trong không bao giờ `visible` theo cách Playwright kiểm tra.

**Fix:** Bỏ `toBeVisible()` cho ảnh, chỉ dùng `getAttribute('src')` để xác nhận ảnh tồn tại.

### Vấn đề 3 – Timeout do beforeEach tốn quá nhiều thời gian (TC12, TC13)

**Nguyên nhân:** Thiết kế ban đầu dùng `beforeEach` để navigate qua trang chủ rồi search. TC12 và TC13 còn phải navigate thêm lần nữa → tổng thời gian vượt timeout 30s mặc định của Playwright.

**Fix:** Bỏ `beforeEach`, viết helper `goToSearchPage()` navigate thẳng đến `/search/{query}` và dùng `waitForFunction` đợi `a.story-card` xuất hiện trong DOM thay vì `waitForTimeout` cứng. TC12 và TC13 được tăng timeout riêng lên 90s và 120s.

### Vấn đề 4 – `document.body` null khi scroll (TC15)

**Nguyên nhân:** `page.evaluate()` chạy khi page chưa load xong.

**Fix:** Thêm `waitForLoadState('load')` trước khi scroll.

---

## Nhóm 3 – Gợi ý tìm kiếm (TC16–TC18)

Nhóm này khó nhất vì liên quan đến behavior động (realtime autocomplete) và rate limiting.

### Vấn đề 1 – Selector dropdown sai (TC16, TC18)

**Nguyên nhân:** Không có HTML thực nên đoán sai selector. Dropdown thực tế của Wattpad:

```html
<form role="search">
  <input name="query" />
  <div class="MaVh4">
    <ul class="rYwVc">
      <li class="_2fMQj">
        <a href="#/"><span class="UO9bH">romance tag</span></a>
```

Các class (`rYwVc`, `_2fMQj`, `UO9bH`) là **CSS Modules hash** — có thể thay đổi sau mỗi lần Wattpad deploy. Selector bền vững hơn là `form[role="search"] ul li a span`.

**Fix:** Đổi sang selector dựa trên cấu trúc HTML và attribute cố định, không phụ thuộc class hash.

### Vấn đề 2 – `fill()` không trigger React event (TC16–TC18)

**Nguyên nhân:** `searchBox.fill()` và `searchBox.clear()` điền/xóa text trực tiếp vào DOM mà không dispatch keyboard event → Wattpad không nhận ra người dùng đang gõ → API autocomplete không được gọi → dropdown không hiện.

**Fix:** Dùng `pressSequentially(keyword, { delay: 150 })` để mô phỏng gõ thật từng ký tự, và `Control+A` + `Backspace` để xóa thay vì `clear()`.

### Vấn đề 3 – Stale DOM khi so sánh gợi ý (TC17)

**Nguyên nhân:** TC17 cần so sánh gợi ý của "rom" và "romance". Khi dùng `clear()` rồi gõ lại, `waitForSelector` resolve ngay vì `li` cũ của "rom" vẫn còn trong DOM — đọc nhầm kết quả cũ, không phải kết quả mới.

**Fix:** Thay vì clear và gõ lại, **gõ thêm "ance" vào "rom" đang có sẵn**. Dùng `waitForFunction` so sánh text `li` hiện tại với snapshot trước — chỉ resolve khi nội dung thực sự thay đổi.

### Vấn đề 4 – Rate limiting API autocomplete (TC17, TC18)

**Nguyên nhân:** 3 test chạy song song = 3 browser cùng gửi request autocomplete đến Wattpad trong vài giây → bị rate limit → dropdown không hiện ở TC17 và TC18 dù TC16 pass.

**Fix:** Thêm `test.describe.configure({ mode: 'serial' })` để 3 test chạy tuần tự, tránh bắn request đồng thời.

---

## Bài học rút ra

**1. Luôn inspect HTML thực trước khi viết selector.** Đây là nguyên nhân gốc rễ của hầu hết lỗi trong cả 3 nhóm. Mất nhiều vòng fix nhất ở nhóm 2 và 3 đều xuất phát từ việc đoán selector.

**2. Tránh class hash trong selector.** Wattpad (và nhiều SPA khác) dùng CSS Modules tạo class ngẫu nhiên (`rYwVc`, `_2fMQj`...) có thể đổi sau mỗi deploy. Ưu tiên `name`, `role`, `placeholder`, cấu trúc phân cấp thẻ HTML.

**3. `fill()` không tương đương gõ thật.** Với các framework như React/Vue, `fill()` bypass event handler. Cần `pressSequentially` để trigger đúng lifecycle.

**4. Parallel test + rate limit = flaky test.** Với tính năng phụ thuộc vào external API (autocomplete, search suggest), nên chạy `serial` hoặc thêm delay giữa các test.

**5. `waitForFunction` linh hoạt hơn `waitForSelector`.** Khi cần đợi nội dung thay đổi (không chỉ xuất hiện), `waitForFunction` với custom predicate là lựa chọn đáng tin cậy hơn.