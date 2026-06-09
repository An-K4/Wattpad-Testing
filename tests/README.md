# Wattpad Testing - Cấu trúc Test Suite

Dự án test automation cho Wattpad với **61 test cases** được tổ chức thành 3 module chính.

## Cấu trúc thư mục

```
tests/
├── search/                              # Module Tìm kiếm (TC01-TC18)
│   ├── wattpad-search.spec.ts          # TC01-TC07: Tìm kiếm cơ bản
│   ├── wattpad-search-results.spec.ts  # TC08-TC15: Kết quả tìm kiếm
│   └── search-suggestions.spec.ts      # TC16-TC18: Gợi ý tìm kiếm
│
├── create-story/                        # Module Tạo truyện (TC19-TC41)
│   ├── story-validation.spec.ts        # TC19-TC28: Validation form
│   ├── story-customization.spec.ts     # TC29-TC37: Tùy chỉnh truyện
│   └── story-management.spec.ts        # TC38-TC41: Quản lý truyện
│
├── publish-chapter/                     # Module Đăng chương (TC42-TC61)
│   ├── chapter-validation.spec.ts      # TC42-TC45: Validation chương
│   ├── chapter-content.spec.ts         # TC46-TC50: Nội dung chương
│   ├── chapter-editor.spec.ts          # TC51-TC55: Editor features
│   └── chapter-publishing.spec.ts      # TC56-TC61: Xuất bản chương
│
└── helpers/                             # Helper functions
    ├── search-helper.ts                # Functions cho search tests
    ├── story-helper.ts                 # Functions cho story tests
    └── chapter-helper.ts               # Functions cho chapter tests
```

## Chi tiết Test Cases

### 🔍 Tìm kiếm (18 test cases)

**Tìm kiếm cơ bản (TC01-TC07)**

- TC01: Tìm kiếm với từ khóa hợp lệ
- TC02: Tìm kiếm với từ khóa không tồn tại
- TC03: Tìm kiếm để trống
- TC04: Tìm kiếm với ký tự đặc biệt
- TC05: Tìm kiếm với chuỗi rất dài (500+ ký tự)
- TC06: Tìm kiếm với số thuần túy
- TC07: Tìm kiếm bằng tag

**Kết quả tìm kiếm (TC08-TC15)**

- TC08: Kết quả hiển thị đúng thông tin
- TC09: Click vào kết quả chuyển đúng trang
- TC10: Kết quả có thể phân trang / infinite scroll
- TC11: Lọc kết quả theo thể loại
- TC12: Lọc kết quả theo ngôn ngữ
- TC13: Sắp xếp kết quả
- TC14: Tìm kiếm theo tên tác giả
- TC15: Kết quả hiển thị cả Stories lẫn Users

**Gợi ý tìm kiếm (TC16-TC18)**

- TC16: Hiển thị dropdown gợi ý
- TC17: Gợi ý cập nhật realtime
- TC18: Click vào gợi ý thực hiện tìm kiếm

### 📖 Tạo truyện mới (23 test cases)

**Validation (TC19-TC28)**

- TC19: Tạo truyện với thông tin đầy đủ
- TC20: Tạo truyện khi chưa đăng nhập
- TC21-TC24: Bỏ trống các trường bắt buộc
- TC25-TC28: Validation tiêu đề và mô tả

**Customization (TC29-TC37)**

- TC29-TC31: Upload ảnh bìa
- TC32-TC34: Visibility settings (Public/Private/Mature)
- TC35-TC37: Quản lý tags

**Management (TC38-TC41)**

- TC38: Truyện xuất hiện trong My Works
- TC39: Thông tin hiển thị đúng
- TC40: Chỉnh sửa truyện
- TC41: Xóa truyện

### 📝 Đăng chương mới (20 test cases)

**Validation (TC42-TC45)**

- TC42: Đăng chương với thông tin đầy đủ
- TC43-TC45: Validation tiêu đề và nội dung

**Content (TC46-TC50)**

- TC46-TC47: Validation độ dài nội dung
- TC48: Ký tự đặc biệt và emoji
- TC49: Link ngoài trong nội dung
- TC50: Paste từ Word

**Editor (TC51-TC55)**

- TC51-TC53: Formatting (Bold/Italic/Alignment)
- TC54: Auto-save
- TC55: Khôi phục draft

**Publishing (TC56-TC61)**

- TC56: Lưu dưới dạng Draft
- TC57: Publish chương
- TC58: Đặt lịch publish
- TC59: Thứ tự chương
- TC60: Chỉnh sửa chương đã publish
- TC61: Xóa chương

## Chạy tests

```bash
# Chạy tất cả tests
npm test

# Chạy theo module
npx playwright test tests/search
npx playwright test tests/create-story
npx playwright test tests/publish-chapter

# Chạy một file cụ thể
npx playwright test tests/search/wattpad-search.spec.ts

# Chạy một test case cụ thể
npx playwright test -g "TC01"

# Chạy với UI mode
npx playwright test --ui

# Xem report
npx playwright show-report
```

## Helper Functions

### search-helper.ts

- `goToSearchPage()`: Navigate đến trang search
- `goToHomePage()`: Navigate đến trang chủ
- `performSearch()`: Thực hiện tìm kiếm
- `getStoryCards()`: Lấy danh sách story cards
- `countStoryCards()`: Đếm số story cards

### story-helper.ts

- `goToCreateStoryPage()`: Navigate đến trang tạo truyện
- `fillStoryForm()`: Điền form tạo truyện
- `submitStoryForm()`: Submit form
- `uploadCoverImage()`: Upload ảnh bìa
- `hasErrorMessage()`: Kiểm tra có lỗi

### chapter-helper.ts

- `goToNewChapterPage()`: Navigate đến trang tạo chương
- `fillChapterForm()`: Điền form chương
- `formatText()`: Format text (bold/italic/align)
- `saveDraft()`: Lưu draft
- `publishChapter()`: Publish chương
- `checkAutoSave()`: Kiểm tra auto-save

### auth-helper.ts

- `login()`: Đăng nhập vào Wattpad
- `logout()`: Đăng xuất
- `isLoggedIn()`: Kiểm tra trạng thái đăng nhập
- `ensureLoggedIn()`: Đảm bảo đã đăng nhập
- `loadAuth()`: Load authentication từ file
- `saveAuth()`: Lưu authentication vào file
- `clearAuth()`: Xóa authentication

## Authentication

### Tạo file auth.json (chỉ cần làm 1 lần)

```bash
# Mở browser để đăng nhập thủ công và lưu cookies
npx playwright codegen --save-storage=auth.json https://www.wattpad.com/login
```

Sau khi chạy lệnh trên:
1. Đăng nhập vào Wattpad trong browser tự động mở ra
2. Đóng browser lại
3. File `auth.json` sẽ được tạo tự động

### Sử dụng authentication trong test

```typescript
import { test } from '@playwright/test'
import { ensureLoggedIn } from './helpers/auth-helper'

test.use({ storageState: 'auth.json' })

test('Test cần đăng nhập', async ({ page }) => {
  await ensureLoggedIn(page)
  // Test code...
})
```

### Login thủ công trong test

```typescript
import { login } from './helpers/auth-helper'

test('Login test', async ({ page }) => {
  await login(page, 'your-username', 'your-password')
  // Test code...
})
```

## Nguyên tắc tổ chức

1. **Nhóm test theo chức năng**: Các test liên quan gom chung 1 file
2. **Tách helper functions**: Tái sử dụng code, dễ maintain
3. **Đặt tên rõ ràng**: File và test case dễ hiểu
4. **Independent tests**: Mỗi test độc lập, không phụ thuộc nhau
5. **Console logging**: Log rõ ràng để debug dễ dàng

## Lưu ý

- Một số test yêu cầu đăng nhập trước (sử dụng `auth.json` nếu có)
- Test upload file cần có file mẫu trong `tests/fixtures/`
- Một số chức năng của Wattpad có thể thay đổi theo thời gian
- Test cases được viết dựa trên phân tích thủ công trong `Draft.txt`
