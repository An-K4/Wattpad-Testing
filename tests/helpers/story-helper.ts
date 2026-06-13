import { type Page, type Browser } from '@playwright/test'

// ─── Navigation ──────────────────────────────────────────────────────────────

/**
 * Điều hướng đến trang tạo truyện và đợi form sẵn sàng.
 */
export async function goToNewStoryPage(page: Page) {
  await page.goto('https://www.wattpad.com/write/story/new', {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  })
  await page.locator('input#title').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(2000)
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
  await page.locator('input#title').clear()
  await page.locator('input#title').fill(title)
}

/**
 * Điền description vào form tạo truyện.
 */
export async function fillDescription(page: Page, description: string) {
  await page.locator('textarea#description').clear()
  await page.locator('textarea#description').fill(description)
}

/**
 * Chọn ngôn ngữ. Giá trị mặc định là '1' (English).
 * Một số giá trị: 1=English, 19=Tiếng Việt, 2=Français, 7=Русский
 */
export async function selectLanguage(page: Page, languageValue: string) {
  const languageSelect = page.locator('select#story-language')
  await languageSelect.selectOption(languageValue)
  await page.waitForTimeout(1000)
}

/**
 * Chọn Story type: 'Fiction' | 'Fanfic' | 'Nonfiction' | 'Poetry'
 * Lưu ý: Wattpad có thể auto-redirect ngay sau khi chọn.
 */
export async function selectStoryType(page: Page, type: 'Fiction' | 'Fanfic' | 'Nonfiction' | 'Poetry') {
  await page.locator(`button:has-text("${type}")`).first().click()
  await page.waitForTimeout(1000)
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
    console.log('submitStoryForm: Wattpad đã tự redirect, bỏ qua bước Save.')
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

// ─── Cover upload ───────────────────────────────────────────────────────────

/**
 * Upload ảnh bìa. Input file thật bị `hidden` nhưng Playwright vẫn set được trực tiếp,
 * không cần click qua dropdown "Add a cover".
 */
export async function uploadCover(page: Page, filePath: string) {
  console.log('Bắt đầu upload...')

  // Dispatch click event vào nút Add a cover
  await page.locator('button._3jpO-.transparent-button, body > form > main > section.dkgE- > div > div.By3pD > div > button').dispatchEvent('click')
  console.log('Đã dispatch click vào Add a cover')

  await page.waitForTimeout(1000)

  // Dispatch click vào menu item Upload Cover
  await page.locator('button[data-testid="action-menu-upload-cover"]').dispatchEvent('click')
  console.log('Đã dispatch click vào Upload Cover')

  await page.waitForTimeout(500)

  // Set file
  await page.locator('input#add-cover-input').setInputFiles(filePath)
  console.log('Đã set file')

  // Dispatch change event
  await page.locator('input#add-cover-input').dispatchEvent('change')
  console.log('Đã dispatch change event')

  await page.waitForTimeout(3000)

  const imgCount = await page.locator('[data-testid="cover"] img').count()
  console.log(`Số lượng img sau upload: ${imgCount}`)
}

/**
 * Locator cho ảnh preview bìa sau khi upload thành công.
 */
export function getCoverPreview(page: Page) {
  return page.locator('img[data-testid="image"]')
}

// ─── Mature toggle ──────────────────────────────────────────────────────────

/**
 * Bật/tắt toggle Mature.
 */
export async function toggleMature(page: Page) {
  // Click vào label chứa chữ "Mature" hoặc span toggle
  const matureLabel = page.locator('.zN2VK:has-text("Mature") .nPsU7, label[for="mature"]').first()
  await matureLabel.click()
}

/**
 * Kiểm tra trạng thái toggle Mature (true = đang bật).
 */
export async function isMatureChecked(page: Page): Promise<boolean> {
  return (await page.locator('input#mature').getAttribute('aria-checked')) === 'true'
}

// ─── Tags ───────────────────────────────────────────────────────────────────

/**
 * Gõ một tag vào ô Tags rồi nhấn space để xác nhận (theo placeholder
 * "Separate tags with a space").
 */
export async function addTag(page: Page, tag: string) {
  try {
    const tagInput = page.locator('input#tags')

    // Kiểm tra xem input có bị disabled không
    const isDisabled = await tagInput.getAttribute('disabled')
    const isReadOnly = await tagInput.getAttribute('readonly')

    if (isDisabled !== null || isReadOnly !== null) {
      console.log(`Input tag đã bị disabled/readonly, không thể thêm tag "${tag}"`)
      return false
    }

    // Cuộn đến input tag
    await tagInput.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    // Click vào input
    await tagInput.click({ timeout: 2000 })
    await page.waitForTimeout(200)

    // Gõ từng ký tự như người thật
    for (const char of tag) {
      await tagInput.press(char, { delay: 80 })
    }
    await page.waitForTimeout(200)

    // Gõ space để hoàn thành tag
    await tagInput.press(' ', { delay: 100 })
    await page.waitForTimeout(300)

    return true
  } catch (error) {
    console.log(`Không thể thêm tag "${tag}": ${String(error)}`)
    return false
  }
}

/**
 * Đọc giá trị thực tế của tags đã được Wattpad ghi nhận, thông qua
 * input[type="hidden"][name="tags"] (input cuối cùng trong DOM là input đang active).
 */
export async function getTagsValue(page: Page): Promise<string> {
  const hidden = page.locator('input[type="hidden"][name="tags"]').last()
  return (await hidden.inputValue()) ?? ''
}

/**
 * Đọc giá trị hiện tại còn lại trong ô input#tags (sau khi đã "chốt" các tag bằng space,
 * phần text chưa có space cuối vẫn còn trong input).
 */
export async function getTagInputValue(page: Page): Promise<string> {
  return await page.locator('input#tags').inputValue()
}

export async function handleCreateSeriesTooltip(page: Page) {
  try {
    const gotItButton = page.locator('.tooltip-content .confirm-button:has-text("Got it"), .confirm-button:has-text("Đã hiểu")').first()
    const isVisible = await gotItButton.isVisible({ timeout: 3000 })

    if (isVisible) {
      await gotItButton.click()
      console.log('Đã click "Got it" trên tooltip Create series')
      await page.waitForTimeout(500)
    }
  } catch {
    // Tooltip không xuất hiện, không cần xử lý
    console.log('Không thấy tooltip Create series')
  }
}
// ─── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Xóa truyện theo storyId. Comment lại nếu muốn kiểm tra thủ công trên myworks.
 */
export async function deleteStory(page: Page, storyId: string) {
  try {
    // Click nút 3 chấm để mở menu
    const moreBtn = page.locator(`#works-more-options-${storyId}`).locator('..').locator('button.dropdown-toggle').first()
    await moreBtn.click()
    await page.waitForTimeout(500)

    // Click Delete Story
    const deleteLink = page.locator(`a.on-set-storyId[data-id="${storyId}"]`)
    await deleteLink.waitFor({ state: 'visible', timeout: 5000 })
    await deleteLink.click()
    await page.waitForTimeout(500)

    // Xử lý dialog xác nhận
    const confirmBtn = page.locator('#delete-story-modal .btn-red:has-text("Yes, delete my story"), #delete-story-modal .btn-red:has-text("Vâng, xóa truyện của tôi")')
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click()
      console.log('Đã click confirm delete')
    }

    console.log(`Đã xóa truyện ID: ${storyId}`)
  } catch (error) {
    console.warn(`Không thể tự động xóa truyện ${storyId}: ${String(error)}`)
  }
}
