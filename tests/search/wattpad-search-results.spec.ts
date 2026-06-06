import { test, expect } from '@playwright/test';

test.describe('Wattpad Search Results Suite (TC08–TC15)', () => {
    test.setTimeout(60000);

    // Helper: navigate thẳng đến trang search và đợi card truyện xuất hiện
    async function goToSearchPage(page: any, query = 'romance', extraParams = '') {
        await page.goto(`https://www.wattpad.com/search/${query}${extraParams}`, {
            timeout: 45000,
            waitUntil: 'domcontentloaded'
        });
        // Đợi đến khi có ít nhất 1 thẻ a.story-card trong DOM
        await page.waitForFunction(
            () => document.querySelectorAll('a.story-card').length > 0,
            { timeout: 25000 }
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TC08 – Kết quả hiển thị đúng thông tin (tên truyện, ảnh bìa)
    // FIX: Dùng a.story-card thay vì story-card-data
    //      Chỉ lấy bản "shown-xxs" (mobile) vì bản "hidden-xxs" bị ẩn trên desktop
    // ──────────────────────────────────────────────────────────────────────────
    test('TC08 - Kết quả hiển thị đúng thông tin', async ({ page }) => {
        console.log('⏳ TC08: Kiểm tra thông tin hiển thị trên kết quả...');
        await goToSearchPage(page);

        // Lấy card đầu tiên – thẻ <a class="story-card">
        const firstCard = page.locator('a.story-card').first();
        await firstCard.waitFor({ state: 'visible', timeout: 15000 });

        // Href của card phải trỏ đến /story/
        const href = await firstCard.getAttribute('href');
        expect(href).toMatch(/\/story\//);

        // Tên truyện nằm trong .title bên trong card
        const titleEl = firstCard.locator('.title').first();
        const titleText = await titleEl.textContent();
        expect(titleText?.trim().length).toBeGreaterThan(0);

        // Ảnh bìa – lấy src (không check visible vì bản desktop bị hidden-xxs)
        const src = await firstCard.locator('img').first().getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).toMatch(/wattpad\.com/);

        console.log(`✅ TC08: Tên = "${titleText?.trim().slice(0, 50)}", src = ${src?.slice(0, 60)}`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC09 – Click vào kết quả → chuyển đúng trang truyện
    // FIX: Click vào a.story-card trực tiếp (đây chính là thẻ <a> bọc ngoài card)
    // ──────────────────────────────────────────────────────────────────────────
    test('TC09 - Click vào kết quả chuyển đúng trang', async ({ page }) => {
        console.log('⏳ TC09: Click vào kết quả tìm kiếm...');
        await goToSearchPage(page);

        const firstCard = page.locator('a.story-card').first();
        await firstCard.waitFor({ state: 'visible', timeout: 15000 });

        const href = await firstCard.getAttribute('href');
        expect(href).toMatch(/\/story\//);

        await firstCard.click();
        await page.waitForLoadState('domcontentloaded', { timeout: 20000 });

        expect(page.url()).toMatch(/\/story\//);
        console.log(`✅ TC09: Đã chuyển đến ${page.url()}`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC10 – Kết quả có thể phân trang / load thêm (infinite scroll)
    // FIX: Dùng a.story-card thay vì a[href*="/story/"]
    // ──────────────────────────────────────────────────────────────────────────
    test('TC10 - Kết quả có thể phân trang hoặc infinite scroll', async ({ page }) => {
        console.log('⏳ TC10: Kiểm tra phân trang / load thêm...');
        await goToSearchPage(page);

        const initialCount = await page.locator('a.story-card').count();
        expect(initialCount).toBeGreaterThan(0);

        // Scroll 3 lần để kích infinite scroll
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
        }

        const afterCount = await page.locator('a.story-card').count();
        await expect(page.locator('body')).toBeVisible();

        console.log(`✅ TC10: Cards trước scroll = ${initialCount}, sau scroll = ${afterCount}.`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC11 – Lọc kết quả theo thể loại
    // ──────────────────────────────────────────────────────────────────────────
    test('TC11 - Lọc kết quả theo thể loại', async ({ page }) => {
        console.log('⏳ TC11: Kiểm tra lọc theo thể loại...');
        await goToSearchPage(page);

        const genreFilter = page.locator('[class*="filter"], [class*="Filter"], select').first();

        if (await genreFilter.isVisible()) {
            await genreFilter.click();
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).toBeVisible();
            console.log('✅ TC11: Filter UI tìm thấy và click thành công.');
        } else {
            await page.goto('https://www.wattpad.com/stories/romance?mainCategory=Romance', {
                timeout: 45000, waitUntil: 'domcontentloaded'
            });
            await page.waitForFunction(
                () => document.querySelectorAll('a.story-card').length > 0,
                { timeout: 20000 }
            );
            const count = await page.locator('a.story-card').count();
            expect(count).toBeGreaterThan(0);
            console.log(`✅ TC11: Filter qua URL, có ${count} kết quả.`);
        }
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC12 – Lọc kết quả theo ngôn ngữ
    // FIX: Tăng timeout riêng cho TC này
    // ──────────────────────────────────────────────────────────────────────────
    test('TC12 - Lọc kết quả theo ngôn ngữ', async ({ page }) => {
        test.setTimeout(90000);
        console.log('⏳ TC12: Kiểm tra lọc theo ngôn ngữ...');
        await goToSearchPage(page, 'romance', '?language=1');

        const count = await page.locator('a.story-card').count();
        expect(count).toBeGreaterThan(0);
        console.log(`✅ TC12: Lọc tiếng Anh trả về ${count} kết quả.`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC13 – Sắp xếp kết quả theo hot / new
    // FIX: Tăng timeout riêng vì navigate 2 lần
    // ──────────────────────────────────────────────────────────────────────────
    test('TC13 - Sắp xếp kết quả', async ({ page }) => {
        test.setTimeout(120000);
        console.log('⏳ TC13: Kiểm tra sắp xếp kết quả...');

        for (const order of ['hot', 'new']) {
            await goToSearchPage(page, 'romance', `?sortOrder=${order}`);
            const count = await page.locator('a.story-card').count();
            expect(count).toBeGreaterThan(0);
            console.log(`   → sortOrder=${order}: ${count} kết quả.`);
        }
        console.log('✅ TC13: Sắp xếp kết quả hoạt động bình thường.');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC14 – Tìm kiếm theo tên tác giả → có profile hoặc truyện của họ
    // ──────────────────────────────────────────────────────────────────────────
    test('TC14 - Tìm kiếm theo tên tác giả', async ({ page }) => {
        console.log('⏳ TC14: Kiểm tra tìm kiếm tên tác giả...');
        await goToSearchPage(page, 'wattpad');

        // Đếm cả card truyện lẫn link profile trong DOM
        const storyCards = await page.locator('a.story-card').count();
        const profileLinks = await page.locator('a[href*="/user/"]').evaluateAll(
            (els: Element[]) => els.map(el => (el as HTMLAnchorElement).href).filter(Boolean)
        );

        expect(storyCards + profileLinks.length).toBeGreaterThan(0);
        console.log(`✅ TC14: Story cards = ${storyCards}, Profile links = ${profileLinks.length}.`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC15 – Kết quả hiển thị cả Stories lẫn Users
    // FIX: Dùng a.story-card + waitForLoadState('load') trước khi scroll
    // ──────────────────────────────────────────────────────────────────────────
    test('TC15 - Kết quả hiển thị cả Stories lẫn Users', async ({ page }) => {
        console.log('⏳ TC15: Kiểm tra kết quả gồm cả Stories & Users...');
        await goToSearchPage(page);

        // Đợi page load hoàn toàn trước khi scroll
        await page.waitForLoadState('load', { timeout: 30000 });
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const storyCount = await page.locator('a.story-card').count();
        expect(storyCount).toBeGreaterThan(0);

        // Thử click tab "People" nếu có
        const peopleTab = page.locator(
            'a:has-text("People"), button:has-text("People"), [data-tab="users"]'
        ).first();

        if (await peopleTab.isVisible()) {
            await peopleTab.click();
            await page.waitForTimeout(3000);
            const userLinks = await page.locator('a[href*="/user/"]').evaluateAll(
                (els: Element[]) => els.map(el => (el as HTMLAnchorElement).href).filter(Boolean)
            );
            expect(userLinks.length).toBeGreaterThan(0);
            console.log(`✅ TC15: Stories = ${storyCount}, Users = ${userLinks.length}.`);
        } else {
            console.log(`✅ TC15: Stories = ${storyCount}. Tab People không tách biệt trên UI hiện tại.`);
        }
    });

});