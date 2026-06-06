import { test, expect } from '@playwright/test';

// Chạy tuần tự để tránh rate limit API autocomplete của Wattpad
test.describe.configure({ mode: 'serial' });

test.describe('Wattpad Search Suggestions Suite (TC16–TC18)', () => {
    test.setTimeout(60000);

    async function goToHome(page: any) {
        await page.goto('https://www.wattpad.com/', {
            timeout: 45000,
            waitUntil: 'domcontentloaded'
        });
        // Selector bền vững: dùng attribute cố định thay vì class hash
        const searchBox = page.locator('input[name="query"]').first();
        await searchBox.waitFor({ state: 'visible', timeout: 20000 });
        return searchBox;
    }

    // Dùng Ctrl+A + Backspace thay vì clear() để trigger đúng React event
    async function typeAndWaitDropdown(page: any, searchBox: any, keyword: string) {
        await searchBox.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await searchBox.pressSequentially(keyword, { delay: 150 });
        // Selector bền vững: không dùng class hash
        await page.waitForSelector('form[role="search"] ul li a span', {
            state: 'attached',
            timeout: 12000
        });
    }

    async function getSuggestions(page: any): Promise<string[]> {
        return page.locator('form[role="search"] ul li a span').evaluateAll(
            (els: Element[]) => els.map(el => el.textContent?.trim() ?? '').filter(Boolean)
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TC16 – Gõ vào ô tìm kiếm → hiển thị dropdown gợi ý
    // ──────────────────────────────────────────────────────────────────────────
    test('TC16 - Gõ vào ô tìm kiếm hiển thị dropdown gợi ý', async ({ page }) => {
        console.log('⏳ TC16: Kiểm tra dropdown gợi ý xuất hiện...');
        const searchBox = await goToHome(page);
        await typeAndWaitDropdown(page, searchBox, 'romance');

        const suggestions = await getSuggestions(page);
        expect(suggestions.length).toBeGreaterThan(0);

        console.log(`✅ TC16: Dropdown có ${suggestions.length} gợi ý: [${suggestions.slice(0, 3).join(', ')}]`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC17 – Gợi ý cập nhật realtime khi gõ thêm ký tự
    // ──────────────────────────────────────────────────────────────────────────
    test('TC17 - Gợi ý cập nhật realtime khi gõ thêm', async ({ page }) => {
        console.log('⏳ TC17: Kiểm tra gợi ý thay đổi theo từng ký tự...');
        const searchBox = await goToHome(page);

        // Bước 1: gõ "rom"
        await typeAndWaitDropdown(page, searchBox, 'rom');
        const suggestionsRom = await getSuggestions(page);
        console.log(`   → "rom": [${suggestionsRom.slice(0, 2).join(', ')}]`);
        expect(suggestionsRom.length).toBeGreaterThan(0);

        // Bước 2: gõ thêm "ance" (không clear, tiếp tục từ "rom")
        await searchBox.pressSequentially('ance', { delay: 150 });
        // Đợi li thay đổi so với kết quả "rom"
        await page.waitForFunction(
            (prev: string[]) => {
                const spans = document.querySelectorAll('form[role="search"] ul li a span');
                if (spans.length === 0) return false;
                const current = Array.from(spans).map(el => el.textContent?.trim() ?? '');
                return JSON.stringify(current) !== JSON.stringify(prev);
            },
            suggestionsRom,
            { timeout: 10000 }
        );
        const suggestionsRomance = await getSuggestions(page);
        console.log(`   → "romance": [${suggestionsRomance.slice(0, 2).join(', ')}]`);
        expect(suggestionsRomance.length).toBeGreaterThan(0);

        const same = JSON.stringify(suggestionsRom) === JSON.stringify(suggestionsRomance);
        expect(same).toBe(false);

        console.log('✅ TC17: Gợi ý thay đổi theo từng ký tự gõ thêm.');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC18 – Click vào gợi ý → thực hiện tìm kiếm đúng từ khóa đó
    // ──────────────────────────────────────────────────────────────────────────
    test('TC18 - Click vào gợi ý thực hiện tìm kiếm đúng', async ({ page }) => {
        console.log('⏳ TC18: Kiểm tra click gợi ý...');
        const searchBox = await goToHome(page);
        await typeAndWaitDropdown(page, searchBox, 'romance');

        const suggestions = await getSuggestions(page);
        expect(suggestions.length).toBeGreaterThan(0);
        console.log(`   → Gợi ý được chọn: "${suggestions[0]}"`);

        const urlBefore = page.url();
        await page.locator('form[role="search"] ul li').first().click();

        await page.waitForFunction(
            (before: string) => window.location.href !== before,
            urlBefore,
            { timeout: 10000 }
        ).catch(() => null);

        const currentUrl = page.url().toLowerCase();
        const urlChanged = currentUrl.includes('search') || currentUrl.includes('story') || currentUrl.includes('stories');
        expect(urlChanged).toBe(true);

        console.log(`✅ TC18: URL = "${currentUrl.slice(0, 70)}"`);
    });

});