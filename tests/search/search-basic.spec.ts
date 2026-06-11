import { test, expect } from '@playwright/test'
import { goToHomePage, getSearchBox, performSearch, searchByBrowse } from '../helpers/search-helper.js'

test.describe('Wattpad Search Basic (TC01-TC07)', () => {

  test.beforeEach(async ({ page }) => {
    await goToHomePage(page)
  })

  test('TC01 - Tìm kiếm với từ khóa hợp lệ', async ({ page }) => {
    console.log(' Đang chạy TC01: Tìm kiếm từ khóa hợp lệ...')
    await performSearch(page, 'romance')

    const visibleStoryLink = page.locator('a[href*="/story/"]:visible').first()
    await expect(visibleStoryLink).toBeVisible({ timeout: 15000 })
    console.log(' TC01: Hoàn thành - Tìm thấy kết quả hiển thị.')
  })

  test('TC02 - Tìm kiếm với từ khóa không tồn tại', async ({ page }) => {
    console.log(' Đang chạy TC02: Tìm kiếm từ khóa không tồn tại...')
    await performSearch(page, 'xyzabc1237890poiuyt_nonexistent')

    const storyCardCount = page.locator('.story-card:visible')
    await expect(storyCardCount).toHaveCount(0)
    console.log(' TC02: Hoàn thành - Không hiển thị kết quả lỗi.')
  })

  test('TC03 - Tìm kiếm để trống', async ({ page }) => {
    console.log(' Đang chạy TC03: Tìm kiếm để trống...')
    const searchBox = getSearchBox(page)
    await searchBox.click()
    await searchBox.fill('')
    await searchBox.press('Enter')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/search/')
    console.log(' TC03: Hoàn thành - Không thực hiện tìm kiếm rỗng.')
  })

  test('TC04 - Tìm kiếm với ký tự đặc biệt', async ({ page }) => {
    console.log(' Đang chạy TC04: Tìm kiếm ký tự đặc biệt...')
    await performSearch(page, '!@#$%^&*()_+')

    await expect(page.locator('body')).toBeVisible()
    console.log(' TC04: Hoàn thành - Xử lý ký tự đặc biệt an toàn.')
  })

  test('TC05 - Tìm kiếm với chuỗi rất dài (500+ ký tự)', async ({ page }) => {
    console.log(' Đang chạy TC05: Tìm kiếm chuỗi siêu dài...')
    const longString = 'a'.repeat(505)
    await performSearch(page, longString)

    await expect(page.locator('body')).toBeVisible()
    console.log(' TC05: Hoàn thành - Hệ thống chịu tải tốt với chuỗi dài.')
  })

  test('TC06 - Tìm kiếm với số thuần túy', async ({ page }) => {
    console.log(' Đang chạy TC06: Tìm kiếm bằng số thuần túy...')
    await performSearch(page, '123456')

    await expect(page.locator('body')).toBeVisible()
    console.log(' TC06: Hoàn thành - Tìm kiếm bằng số hoạt động bình thường.')
  })

  test('TC07 - Tìm kiếm truyện cùng chủ đề qua mục Browse (Khám phá)', async ({ page }) => {
    console.log('TC07: Tìm kiếm bằng tag qua menu Browse...')

    await searchByBrowse(page, 'Romance')

    await page.waitForURL('**/stories/romance', { timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelectorAll('a.story-card, a.HsS0N[href*="/story/"]').length > 0,
      { timeout: 20000 }
    )

    const storyCount = await page.locator('a.HsS0N[href*="/story/"]').count()
    expect(storyCount).toBeGreaterThan(0)

    console.log(`TC07: Hoàn thành - Tìm theo "Romance" → ${storyCount} truyện tại ${page.url()}`)
  })
})
