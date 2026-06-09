import { type Page } from '@playwright/test'

/**
 * Navigate đến trang tạo chương mới
 */
export async function goToNewChapterPage(page: Page, storyId?: string) {
  if (storyId) {
    await page.goto(`https://www.wattpad.com/myworks/${storyId}/write`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
  } else {
    // Vào My Works và chọn truyện đầu tiên để tạo chương
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
  }
}

/**
 * Điền form tạo chương
 */
export async function fillChapterForm(page: Page, data: {
  title?: string
  content?: string
}) {
  if (data.title !== undefined) {
    const titleInput = page.locator('input[name="title"], #chapter-title, .chapter-title').first()
    await titleInput.fill(data.title)
  }

  if (data.content !== undefined) {
    // Editor có thể là textarea hoặc contenteditable
    const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
    await editor.click()
    await editor.fill(data.content)
  }
}

/**
 * Format text trong editor
 */
export async function formatText(page: Page, format: 'bold' | 'italic' | 'align-left' | 'align-center' | 'align-right') {
  const formatButtons: Record<string, string> = {
    'bold': 'button[title*="Bold"], button:has-text("B")',
    'italic': 'button[title*="Italic"], button:has-text("I")',
    'align-left': 'button[title*="Left"]',
    'align-center': 'button[title*="Center"]',
    'align-right': 'button[title*="Right"]'
  }

  const selector = formatButtons[format]
  if (!selector) {
    throw new Error(`Unknown format: ${format}`)
  }

  const button = page.locator(selector).first()
  await button.click()
  await page.waitForTimeout(500)
}

/**
 * Lưu chương dưới dạng Draft
 */
export async function saveDraft(page: Page) {
  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Draft")').first()
  await saveBtn.click()
  await page.waitForTimeout(2000)
}

/**
 * Publish chương
 */
export async function publishChapter(page: Page) {
  const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Đăng")').first()
  await publishBtn.click()
  await page.waitForTimeout(3000)
}

/**
 * Kiểm tra auto-save đã hoạt động
 */
export async function checkAutoSave(page: Page): Promise<boolean> {
  const saveIndicator = page.locator('[class*="saved"], [class*="auto-save"], :has-text("Saved")').first()
  return await saveIndicator.isVisible().catch(() => false)
}

/**
 * Kiểm tra có thông báo lỗi
 */
export async function hasChapterError(page: Page): Promise<boolean> {
  const errorLocator = page.locator('.error, [class*="error"], [role="alert"]').first()
  return await errorLocator.isVisible().catch(() => false)
}

/**
 * Lấy nội dung editor
 */
export async function getEditorContent(page: Page): Promise<string> {
  const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
  return await editor.textContent() || await editor.inputValue() || ''
}
