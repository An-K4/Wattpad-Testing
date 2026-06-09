import { type Page } from '@playwright/test'

/**
 * Navigate đến trang tạo truyện mới
 */
export async function goToCreateStoryPage(page: Page) {
  await page.goto('https://www.wattpad.com/myworks/new', {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  })
}

/**
 * Điền form tạo truyện với các thông tin đầy đủ
 */
export async function fillStoryForm(page: Page, data: {
  title?: string
  description?: string
  language?: string
  genre?: string
  tags?: string[]
  isPublic?: boolean
  isMature?: boolean
}) {
  if (data.title !== undefined) {
    const titleInput = page.locator('input[name="title"], #title').first()
    await titleInput.fill(data.title)
  }

  if (data.description !== undefined) {
    const descInput = page.locator('textarea[name="description"], #description').first()
    await descInput.fill(data.description)
  }

  if (data.language) {
    const langSelect = page.locator('select[name="language"], #language').first()
    await langSelect.selectOption(data.language)
  }

  if (data.genre) {
    const genreSelect = page.locator('select[name="category"], select[name="genre"], #genre').first()
    await genreSelect.selectOption(data.genre)
  }

  if (data.tags && data.tags.length > 0) {
    const tagInput = page.locator('input[name="tags"], #tags').first()
    for (const tag of data.tags) {
      await tagInput.fill(tag)
      await tagInput.press('Enter')
      await page.waitForTimeout(500)
    }
  }

  if (data.isPublic !== undefined) {
    const visibilityRadio = page.locator(`input[type="radio"][value="${data.isPublic ? 'public' : 'private'}"]`).first()
    await visibilityRadio.check()
  }

  if (data.isMature !== undefined && data.isMature) {
    const matureCheckbox = page.locator('input[type="checkbox"][name="mature"], #mature').first()
    await matureCheckbox.check()
  }
}

/**
 * Click nút tạo truyện
 */
export async function submitStoryForm(page: Page) {
  const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Tạo")').first()
  await submitBtn.click()
  await page.waitForTimeout(3000)
}

/**
 * Upload ảnh bìa truyện
 */
export async function uploadCoverImage(page: Page, imagePath: string) {
  const fileInput = page.locator('input[type="file"][accept*="image"]').first()
  await fileInput.setInputFiles(imagePath)
  await page.waitForTimeout(2000)
}

/**
 * Kiểm tra có thông báo lỗi hiển thị
 */
export async function hasErrorMessage(page: Page): Promise<boolean> {
  const errorLocator = page.locator('.error, [class*="error"], [role="alert"], .alert-danger').first()
  return await errorLocator.isVisible().catch(() => false)
}

/**
 * Lấy text của thông báo lỗi
 */
export async function getErrorMessage(page: Page): Promise<string> {
  const errorLocator = page.locator('.error, [class*="error"], [role="alert"], .alert-danger').first()
  return await errorLocator.textContent() || ''
}
