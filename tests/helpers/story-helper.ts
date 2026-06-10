import { type Page, type Browser } from '@playwright/test'

// ─── Navigation ──────────────────────────────────────────────────────────────

/**
 * Điều hướng đến trang tạo truyện và đợi form sẵn sàng.
 */
export async function goToNewStoryPage(page: Page) {
    await page.goto('https://www.wattpad.com/write/story/new', {
        timeout: 60000,
        waitUntil: 'domcontentloaded',
    })
    await page.locator('input#title').waitFor({ state: 'visible', timeout: 20000 })
}

/**
 * Tạo browser context hoàn toàn sạch (không có session/cookie).
 * Dùng cho các test yêu cầu trạng thái chưa đăng nhập.
 */
export async function newGuestContext(browser: Browser) {
    return browser.newContext({ storageState: { cookies: [], origins: [] } })
}

// ─── Form interaction ─────────────────────────────────────────────────────────

/**
 * Điền title vào form tạo truyện.
 */
export async function fillTitle(page: Page, title: string) {
    await page.locator('input#title').fill(title)
}

/**
 * Điền description vào form tạo truyện.
 */
export async function fillDescription(page: Page, description: string) {
    await page.locator('textarea#description').fill(description)
}

/**
 * Chọn ngôn ngữ. Giá trị mặc định là '1' (English).
 * Một số giá trị: 1=English, 19=Tiếng Việt, 2=Français, 7=Русский
 */
export async function selectLanguage(page: Page, value: string) {
    await page.locator('select#story-language').selectOption(value)
}

/**
 * Chọn Story type: 'Fiction' | 'Fanfic' | 'Nonfiction' | 'Poetry'
 * Lưu ý: Wattpad có thể auto-redirect ngay sau khi chọn.
 */
export async function selectStoryType(page: Page, type: 'Fiction' | 'Fanfic' | 'Nonfiction' | 'Poetry') {
    await page.locator(`button:has-text("${type}")`).first().click()
}

/**
 * Click nút "Save & Continue" trên header.
 * Dùng selector text thay vì class hash vì Wattpad dùng CSS Modules (hash đổi sau mỗi deploy).
 */
export async function clickSave(page: Page) {
    const saveBtn = page.locator('header button:has-text("Save")').first()
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 })
    await saveBtn.click({ force: true })
}

// ─── Submit & redirect ────────────────────────────────────────────────────────

/**
 * Submit form tạo truyện và đợi kết quả.
 * Xử lý cả 2 trường hợp:
 *   - Wattpad auto-redirect sau khi chọn Story type
 *   - Wattpad cần click "Save & Continue" thủ công
 * Trả về URL sau khi submit (dù thành công hay không).
 */
export async function submitStoryForm(page: Page): Promise<string> {
    // Đợi xem Wattpad có tự redirect không (xảy ra sau khi chọn Story type)
    await page.waitForTimeout(3000)

    if (!page.url().match(/\/myworks\/\d+\/write\/\d+/)) {
        await clickSave(page)
        await page.waitForTimeout(6000)
    } else {
        console.log('📋 submitStoryForm: Wattpad đã tự redirect, bỏ qua bước Save.')
    }

    return page.url()
}

// ─── Assertions helpers ───────────────────────────────────────────────────────

/**
 * Kiểm tra URL có phải trang viết chương (redirect thành công) không.
 * URL dạng: /myworks/{storyId}/write/{partId}
 */
export function isWriterPage(url: string): boolean {
    return /\/myworks\/\d+\/write\/\d+/.test(url)
}

/**
 * Trích xuất storyId từ URL trang viết chương.
 */
export function extractStoryId(url: string): string | null {
    const match = url.match(/\/myworks\/(\d+)\/write\//)
    return match?.[1] ?? null
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Xóa truyện theo storyId. Comment lại nếu muốn kiểm tra thủ công trên myworks.
 */
export async function deleteStory(page: Page, storyId: string) {
    try {
        await page.goto(`https://www.wattpad.com/myworks/${storyId}`, {
            timeout: 30000,
            waitUntil: 'domcontentloaded',
        })
        const moreBtn = page.locator(`#works-more-options-${storyId}`).locator('..').locator('button.dropdown-toggle').first()
        await moreBtn.click()
        const deleteLink = page.locator(`a.on-set-storyId[data-id="${storyId}"]`)
        await deleteLink.waitFor({ state: 'visible', timeout: 5000 })
        await deleteLink.click()
        const confirmBtn = page.locator('#delete-only-modal button:has-text("Delete")').first()
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.click()
        }
        console.log(`🗑️  Đã xóa truyện ID: ${storyId}`)
    } catch {
        console.warn(`⚠️  Không thể tự động xóa truyện ${storyId}, xóa thủ công trên myworks.`)
    }
}