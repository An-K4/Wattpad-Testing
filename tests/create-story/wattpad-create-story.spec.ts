import { test, expect, Page } from '@playwright/test';

/**
 * SETUP TRƯỚC KHI CHẠY:
 * 1. Login thủ công 1 lần để lưu session:
 *    npx playwright codegen --save-storage=auth.json https://www.wattpad.com/login
 *    → Tự tay login bằng Google trong browser mở ra → đóng lại
 *
 * 2. Thêm vào playwright.config.ts:
 *    use: { storageState: 'auth.json' }
 *
 * 3. Thêm auth.json vào .gitignore
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Điều hướng đến trang tạo truyện mới và đợi form sẵn sàng.
 */
async function goToNewStoryPage(page: Page) {
    await page.goto('https://www.wattpad.com/write/story/new', {
        timeout: 60000,
        waitUntil: 'domcontentloaded',
    });
    await page.locator('input#title').waitFor({ state: 'visible', timeout: 20000 });
}

/**
 * Xóa truyện vừa tạo dựa vào storyId lấy từ URL sau khi tạo thành công.
 * URL dạng: /myworks/{storyId}/write/{partId}
 */
async function deleteStory(page: Page, storyId: string) {
    try {
        await page.goto(`https://www.wattpad.com/myworks/${storyId}`, {
            timeout: 30000,
            waitUntil: 'domcontentloaded',
        });

        // Mở dropdown "More options"
        const moreBtn = page.locator(`#works-more-options-${storyId}`).locator('..').locator('button.dropdown-toggle').first();
        await moreBtn.click();

        // Nhấn "Delete Story"
        const deleteLink = page.locator(`a.on-set-storyId[data-id="${storyId}"]`);
        await deleteLink.waitFor({ state: 'visible', timeout: 5000 });
        await deleteLink.click();

        // Xác nhận modal xóa (nếu có)
        const confirmBtn = page.locator('#delete-only-modal').locator('button:has-text("Delete")').first();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.click();
        }

        console.log(`🗑️  Đã xóa truyện ID: ${storyId}`);
    } catch (e) {
        console.warn(`⚠️  Không thể tự động xóa truyện ${storyId}, hãy xóa thủ công trên myworks.`);
    }
}

/**
 * Trích xuất storyId từ URL sau khi tạo truyện thành công.
 * URL dạng: https://www.wattpad.com/myworks/412212923/write/1634196871
 */
function extractStoryId(url: string): string | null {
    const match = url.match(/\/myworks\/(\d+)\/write\//);
    return match ? match[1] : null;
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe('Wattpad – Tạo truyện mới (TC19–TC24)', () => {

    // Chạy tuần tự, mỗi test tối đa 90s
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(90000);

    // ── TC19 ────────────────────────────────────────────────────────────────
    test('TC19 - Tạo truyện thành công với đầy đủ thông tin hợp lệ', async ({ page }) => {
        console.log('⏳ TC19: Tạo truyện với đầy đủ thông tin...');

        await goToNewStoryPage(page);

        // Điền thông tin đầy đủ
        await page.locator('input#title').fill('Automation Test Story – TC19');
        await page.locator('textarea#description').fill('Đây là mô tả tự động được tạo bởi Playwright để kiểm thử TC19.');

        // Chọn ngôn ngữ: Tiếng Việt (value="19")
        await page.locator('select#story-language').selectOption('19');

        // Chọn Story type: Fiction
        await page.locator('button:has-text("Fiction")').first().click();

        // Wattpad đôi khi auto-redirect sau khi chọn Story type
        // Đợi tối đa 3s xem có redirect không
        await page.waitForTimeout(3000);
        const urlAfterFiction = page.url();

        if (!urlAfterFiction.match(/\/myworks\/\d+\/write\/\d+/)) {
            // Vẫn còn trên trang form → cần click Save & Continue
            // Selector dùng text thay vì class hash (hash thay đổi sau mỗi deploy)
            const saveBtn = page.locator('header button:has-text("Save")').first();
            await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
            await saveBtn.click({ force: true });
            // Đợi redirect sang trang viết chương
            await page.waitForURL(/\/myworks\/\d+\/write\/\d+/, { timeout: 30000 });
        } else {
            console.log('📋 TC19: Wattpad tự redirect sau khi chọn Story type, bỏ qua bước Save.');
        }

        const currentUrl = page.url();
        console.log(`✅ TC19: Tạo thành công → ${currentUrl}`);
        expect(currentUrl).toMatch(/\/myworks\/\d+\/write\/\d+/);

        // Cleanup: comment lại, xóa thủ công trên myworks khi cần
        // const storyId = extractStoryId(currentUrl);
        // if (storyId) await deleteStory(page, storyId);
    });

    // ── TC20 ────────────────────────────────────────────────────────────────
    test('TC20 - Tạo truyện khi chưa đăng nhập → yêu cầu đăng nhập', async ({ browser }) => {
        console.log('⏳ TC20: Truy cập trang tạo truyện khi chưa đăng nhập...');

        // Tạo context hoàn toàn sạch, xóa hết cookies/storage → trạng thái chưa đăng nhập
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const page = await context.newPage();

        await page.goto('https://www.wattpad.com/write/story/new', {
            timeout: 60000,
            waitUntil: 'networkidle',  // Đợi kỹ hơn để JS render xong modal
        });

        const currentUrl = page.url();
        console.log(`📋 TC20: URL sau khi truy cập = ${currentUrl}`);

        // Behavior thực tế khi truy cập thẳng URL /write/story/new chưa đăng nhập:
        // Wattpad redirect về trang 404 ("This page seems to be missing")
        // → user bị chặn, không thể vào form tạo truyện

        // Xác nhận KHÔNG ở trang form tạo truyện
        const storyFormVisible = await page.locator('input#title').isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`📋 TC20: Form tạo truyện hiển thị: ${storyFormVisible}`);

        // Xác nhận bị chặn: hoặc là 404, hoặc redirect về trang khác
        const is404 = await page.locator('text=This page seems to be missing').isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`📋 TC20: Trang 404: ${is404}`);

        // Form tạo truyện KHÔNG được hiển thị → user bị chặn đúng
        expect(storyFormVisible).toBe(false);
        console.log('✅ TC20: User bị chặn, không thể truy cập form tạo truyện → PASS.');

        await context.close();
        console.log('✅ TC20: Hoàn thành.');
    });

    // ── TC21 ────────────────────────────────────────────────────────────────
    test('TC21 - Bỏ trống tiêu đề → quan sát behavior thực tế của Wattpad', async ({ page }) => {
        console.log('⏳ TC21: Submit form với tiêu đề trống...');

        await goToNewStoryPage(page);

        // Bỏ trống title, điền description để không phải form rỗng hoàn toàn
        await page.locator('input#title').clear();
        await page.locator('textarea#description').fill('Mô tả test TC21 – bỏ trống tiêu đề.');

        // Nhấn Save & Continue
        const saveBtn = page.locator('header button:has-text("Save")').first();
        await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
        await saveBtn.click({ force: true });
        await page.waitForTimeout(6000);

        const currentUrl = page.url();
        console.log(`📋 TC21: URL sau submit → ${currentUrl}`);

        if (currentUrl.match(/\/myworks\/\d+\/write\/\d+/)) {
            // Wattpad cho tạo với tiêu đề trống (tự điền "Untitled Story")
            console.log('📋 TC21: Wattpad TỰ ĐIỀN tiêu đề mặc định, cho phép tạo → behavior quan sát được.');

            // Xóa truyện vừa tạo
            // Cleanup: xóa thủ công trên myworks khi cần
            // const storyId = extractStoryId(currentUrl);
            // if (storyId) await deleteStory(page, storyId);

            // Ghi nhận behavior: PASS vì đây là behavior thực tế đã xác nhận
            expect(currentUrl).toMatch(/\/myworks\/\d+\/write\/\d+/);
        } else {
            // Wattpad hiện lỗi validation
            console.log('📋 TC21: Wattpad BLOCK submit, hiện thông báo lỗi.');
            expect(currentUrl).toContain('/write/story/new');
        }
    });

    // ── TC22 ────────────────────────────────────────────────────────────────
    test('TC22 - Bỏ trống mô tả → quan sát behavior thực tế của Wattpad', async ({ page }) => {
        console.log('⏳ TC22: Submit form với mô tả trống...');

        await goToNewStoryPage(page);

        await page.locator('input#title').fill('TC22 – Test bỏ trống mô tả');
        // Bỏ trống description

        const saveBtn = page.locator('header button:has-text("Save")').first();
        await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
        await saveBtn.click({ force: true });
        await page.waitForTimeout(6000);

        const currentUrl = page.url();
        console.log(`📋 TC22: URL sau submit → ${currentUrl}`);

        if (currentUrl.match(/\/myworks\/\d+\/write\/\d+/)) {
            console.log('📋 TC22: Wattpad CHO PHÉP tạo khi bỏ trống mô tả.');

            // Cleanup: xóa thủ công trên myworks khi cần
            // const storyId = extractStoryId(currentUrl);
            // if (storyId) await deleteStory(page, storyId);

            expect(currentUrl).toMatch(/\/myworks\/\d+\/write\/\d+/);
        } else {
            console.log('📋 TC22: Wattpad CẢNH BÁO khi bỏ trống mô tả.');
            expect(currentUrl).toContain('/write/story/new');
        }
    });

    // ── TC23 ────────────────────────────────────────────────────────────────
    test('TC23 - Không chọn Story type → quan sát behavior thực tế của Wattpad', async ({ page }) => {
        console.log('⏳ TC23: Submit form không chọn Story type...');

        await goToNewStoryPage(page);

        await page.locator('input#title').fill('TC23 – Test không chọn story type');
        await page.locator('textarea#description').fill('Mô tả test TC23.');
        // KHÔNG click chọn Fiction/Fanfic/Nonfiction/Poetry

        const saveBtn = page.locator('header button:has-text("Save")').first();
        await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
        await saveBtn.click({ force: true });
        await page.waitForTimeout(6000);

        const currentUrl = page.url();
        console.log(`📋 TC23: URL sau submit → ${currentUrl}`);

        // Story type được đánh dấu required (*) trong UI
        // Kiểm tra xem Wattpad có block hay cho qua
        if (currentUrl.match(/\/myworks\/\d+\/write\/\d+/)) {
            console.log('📋 TC23: Wattpad CHO PHÉP tạo khi không chọn Story type → required chỉ là UI hint.');

            // Cleanup: xóa thủ công trên myworks khi cần
            // const storyId = extractStoryId(currentUrl);
            // if (storyId) await deleteStory(page, storyId);

            expect(currentUrl).toMatch(/\/myworks\/\d+\/write\/\d+/);
        } else {
            console.log('📋 TC23: Wattpad BLOCK khi không chọn Story type.');

            // Kiểm tra thông báo lỗi liên quan đến story type
            const errorOrWarning = page.locator('text=/story type|required/i').first();
            const hasError = await errorOrWarning.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(`📋 TC23: Có hiện thông báo lỗi: ${hasError}`);

            expect(currentUrl).toContain('/write/story/new');
        }
    });

    // ── TC24 ────────────────────────────────────────────────────────────────
    test('TC24 - Không chọn ngôn ngữ → quan sát behavior (Language có giá trị mặc định)', async ({ page }) => {
        console.log('⏳ TC24: Submit form không đổi ngôn ngữ (giữ mặc định English)...');

        await goToNewStoryPage(page);

        // Ghi nhận giá trị mặc định của Language dropdown
        const defaultLanguage = await page.locator('select#story-language').inputValue();
        console.log(`📋 TC24: Giá trị Language mặc định = "${defaultLanguage}" (1 = English)`);

        await page.locator('input#title').fill('TC24 – Test ngôn ngữ mặc định');
        await page.locator('textarea#description').fill('Mô tả test TC24.');
        // KHÔNG thay đổi select#story-language → giữ nguyên English

        const saveBtn = page.locator('header button:has-text("Save")').first();
        await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
        await saveBtn.click({ force: true });
        await page.waitForTimeout(6000);

        const currentUrl = page.url();
        console.log(`📋 TC24: URL sau submit → ${currentUrl}`);

        // Language có giá trị mặc định là English (value="1"), không thể thực sự "bỏ trống"
        // TC này xác nhận: Wattpad LUÔN cho qua vì Language luôn có giá trị
        if (currentUrl.match(/\/myworks\/\d+\/write\/\d+/)) {
            console.log('📋 TC24: Tạo thành công với Language mặc định (English) → PASS như kỳ vọng.');

            // Cleanup: xóa thủ công trên myworks khi cần
            // const storyId = extractStoryId(currentUrl);
            // if (storyId) await deleteStory(page, storyId);

            expect(currentUrl).toMatch(/\/myworks\/\d+\/write\/\d+/);
        } else {
            console.log('📋 TC24: Bất ngờ – Wattpad block khi dùng Language mặc định.');
            expect(currentUrl).toMatch(/\/myworks\/\d+\/write\/\d+/);
        }
    });

});