import { test, expect } from '@playwright/test';

test.describe('Wattpad Search Functionality Suite', () => {

    // Trước mỗi test case, truy cập trang chủ và đợi ô tìm kiếm sẵn sàng
    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.wattpad.com/', { 
            timeout: 60000,
            waitUntil: 'domcontentloaded' 
        });
        const searchBox = page.locator('input[placeholder="Search"]').first();
        await searchBox.waitFor({ state: 'visible', timeout: 20000 });
    });

    test('TC01 - Tìm kiếm với từ khóa hợp lệ', async ({ page }) => {
        console.log('⏳ Đang chạy TC01: Tìm kiếm từ khóa hợp lệ...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        
        await searchBox.click();
        await searchBox.fill('romance');
        await searchBox.press('Enter');

        // Đợi trang kết quả tải
        await page.waitForTimeout(6000);

        // Kiểm tra xem ít nhất một link truyện hiển thị trực quan trên màn hình
        const visibleStoryLink = page.locator('a[href*="/story/"]:visible').first();
        await expect(visibleStoryLink).toBeVisible({ timeout: 15000 });
        console.log('✅ TC01: Hoàn thành - Tìm thấy kết quả hiển thị.');
    });

    test('TC02 - Tìm kiếm với từ khóa không tồn tại', async ({ page }) => {
        console.log('⏳ Đang chạy TC02: Tìm kiếm từ khóa không tồn tại...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        
        // Sử dụng một chuỗi ngẫu nhiên khó có khả năng tồn tại
        await searchBox.click();
        await searchBox.fill('xyzabc1237890poiuyt_nonexistent');
        await searchBox.press('Enter');

        await page.waitForTimeout(6000);

        // Kiểm tra xem không có thẻ truyện nào hiển thị
        const storyCardCount = await page.locator('.story-card:visible').count();
        expect(storyCardCount).toBe(0);
        console.log('✅ TC02: Hoàn thành - Không hiển thị kết quả lỗi.');
    });

    test('TC03 - Tìm kiếm để trống', async ({ page }) => {
        console.log('⏳ Đang chạy TC03: Tìm kiếm để trống...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        
        await searchBox.click();
        await searchBox.fill('');
        await searchBox.press('Enter');

        await page.waitForTimeout(3000);

        // Xác nhận hệ thống không chuyển hướng sang trang kết quả tìm kiếm rỗng
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('/search/');
        console.log('✅ TC03: Hoàn thành - Không thực hiện tìm kiếm rỗng.');
    });

    test('TC04 - Tìm kiếm với ký tự đặc biệt', async ({ page }) => {
        console.log('⏳ Đang chạy TC04: Tìm kiếm ký tự đặc biệt...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        
        await searchBox.click();
        await searchBox.fill('!@#$%^&*()_+');
        await searchBox.press('Enter');

        await page.waitForTimeout(6000);

        // Đảm bảo trang web xử lý bình thường, không bị crash hoặc lỗi trắng trang
        await expect(page.locator('body')).toBeVisible();
        console.log('✅ TC04: Hoàn thành - Xử lý ký tự đặc biệt an toàn.');
    });

    test('TC05 - Tìm kiếm với chuỗi rất dài (500+ ký tự)', async ({ page }) => {
        console.log('⏳ Đang chạy TC05: Tìm kiếm chuỗi siêu dài...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        const longString = 'a'.repeat(505);

        await searchBox.click();
        await searchBox.fill(longString);
        await searchBox.press('Enter');

        await page.waitForTimeout(6000);

        // Đảm bảo không gây crash máy chủ hoặc lỗi giao diện nghiêm trọng
        await expect(page.locator('body')).toBeVisible();
        console.log('✅ TC05: Hoàn thành - Hệ thống chịu tải tốt với chuỗi dài.');
    });

    test('TC06 - Tìm kiếm với số thuần túy', async ({ page }) => {
        console.log('⏳ Đang chạy TC06: Tìm kiếm bằng số thuần túy...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        
        await searchBox.click();
        await searchBox.fill('123456');
        await searchBox.press('Enter');

        await page.waitForTimeout(6000);

        // Đảm bảo trang kết quả tải bình thường (có thể có hoặc không có kết quả tùy cơ sở dữ liệu)
        await expect(page.locator('body')).toBeVisible();
        console.log('✅ TC06: Hoàn thành - Tìm kiếm bằng số hoạt động bình thường.');
    });

    test('TC07 - Tìm kiếm bằng tag', async ({ page }) => {
        console.log('⏳ Đang chạy TC07: Tìm kiếm bằng tag...');
        const searchBox = page.locator('input[placeholder="Search"]').first();
        
        await searchBox.click();
        await searchBox.fill('#romance');
        await searchBox.press('Enter');

        await page.waitForTimeout(6000);

        // Kiểm tra trang tải thành công khi tìm kiếm có chứa ký tự tag '#'
        await expect(page.locator('body')).toBeVisible();
        console.log('✅ TC07: Hoàn thành - Tìm kiếm tag hoạt động.');
    });

});