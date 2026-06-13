import { test, expect } from '@playwright/test'
import { goToHomePage, getSearchBox } from '../helpers/search-helper.js'

test.describe('Wattpad Search Suggestions (TC16-TC18)', () => {

  test.beforeEach(async ({ page }) => {
    await goToHomePage(page)
    await page.waitForTimeout(2000)
  })

  test('TC16 - Gõ vào ô tìm kiếm → hiển thị dropdown gợi ý', async ({ page }) => {
    console.log('Đang chạy TC16: Kiểm tra dropdown gợi ý...')
    const searchBox = getSearchBox(page)

    await searchBox.click()

    // Gõ 'rom' với tốc độ chậm
    await searchBox.pressSequentially('rom', { delay: 300 })

    // Đợi 4 giây cho dropdown ổn định
    await page.waitForTimeout(4000)

    // Kiểm tra dropdown container
    const dropdown = page.locator('div.MaVh4.jYEar')
    await expect(dropdown).toBeVisible({ timeout: 3000 })

    // Kiểm tra có ít nhất 1 suggestion
    const items = dropdown.locator('li._2fMQj span.UO9bH')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)

    // Log ra tất cả suggestions để debug
    const suggestions = await items.allTextContents()
    console.log('Các gợi ý tìm thấy:', suggestions)

    // Kiểm tra có suggestion chứa 'romeo'
    expect(suggestions.some(text => text.toLowerCase().includes('romeo'))).toBe(true)

    console.log(`TC16: Hoàn thành - Dropdown hiển thị ${count} gợi ý.`)
  })

  test('TC17 - Gợi ý cập nhật realtime khi gõ thêm ký tự', async ({ page }) => {
    console.log('Đang chạy TC17: Kiểm tra cập nhật realtime...')
    const searchBox = getSearchBox(page)

    await searchBox.click()

    // Gõ 'ro' - từng chữ một
    await searchBox.pressSequentially('ro', { delay: 300 })
    await page.waitForTimeout(4000) // Đợi dropdown ổn định

    // Lấy danh sách suggestions khi gõ 'ro'
    const dropdown = page.locator('div.MaVh4.jYEar')
    const isDropdownVisible1 = await dropdown.isVisible().catch(() => false)

    let suggestionsBefore = 0
    let suggestionsTextBefore: string[] = []

    if (isDropdownVisible1) {
      const items = dropdown.locator('li._2fMQj span.UO9bH')
      suggestionsBefore = await items.count()
      suggestionsTextBefore = await items.allTextContents()
      console.log(`Gợi ý khi gõ "ro": ${suggestionsBefore} kết quả`)
      console.log(`  - ${suggestionsTextBefore.slice(0, 3).join(', ')}`)
    } else {
      console.log('Dropdown chưa xuất hiện khi gõ "ro"')
    }

    // Gõ thêm 'm' để thành 'rom'
    await searchBox.pressSequentially('m', { delay: 300 })
    await page.waitForTimeout(4000) // Đợi dropdown cập nhật

    // Lấy danh sách suggestions khi gõ 'rom'
    const isDropdownVisible2 = await dropdown.isVisible().catch(() => false)

    let suggestionsAfter = 0
    let suggestionsTextAfter: string[] = []

    if (isDropdownVisible2) {
      const items = dropdown.locator('li._2fMQj span.UO9bH')
      suggestionsAfter = await items.count()
      suggestionsTextAfter = await items.allTextContents()
      console.log(`Gợi ý khi gõ "rom": ${suggestionsAfter} kết quả`)
      console.log(`  - ${suggestionsTextAfter.slice(0, 3).join(', ')}`)
    }

    // Kiểm tra suggestions có thay đổi (số lượng hoặc nội dung)
    if (isDropdownVisible1 && isDropdownVisible2) {
      const hasChanged = suggestionsBefore !== suggestionsAfter ||
        JSON.stringify(suggestionsTextBefore) !== JSON.stringify(suggestionsTextAfter)

      expect(hasChanged).toBe(true)
      console.log(`TC17: Hoàn thành - Gợi ý đã cập nhật realtime (${suggestionsBefore} → ${suggestionsAfter})`)
    } else if (!isDropdownVisible1 && isDropdownVisible2) {
      console.log('TC17: Hoàn thành - Dropdown chỉ xuất hiện sau khi gõ "rom"')
      expect(isDropdownVisible2).toBe(true)
    } else {
      console.log('TC17: Fail - Dropdown không xuất hiện hoặc không cập nhật')
      throw new Error('Suggestions did not update realtime')
    }
  })

  test('TC18 - Click vào gợi ý → thực hiện tìm kiếm đúng từ khóa đó', async ({ page }) => {
    console.log('Đang chạy TC18: Click vào gợi ý...')
    const searchBox = getSearchBox(page)

    await searchBox.click()

    // Gõ 'rom' từng chữ và đợi 4 giây
    await searchBox.pressSequentially('rom', { delay: 300 })
    await page.waitForTimeout(4000)

    // Tìm dropdown và suggestion đầu tiên bằng selector chi tiết
    const dropdown = page.locator('div.MaVh4.jYEar')
    const isDropdownVisible = await dropdown.isVisible().catch(() => false)

    if (isDropdownVisible) {
      // Lấy suggestion đầu tiên
      const firstSuggestion = dropdown.locator('li._2fMQj').first()
      const suggestionLink = firstSuggestion.locator('a._8oV22')
      const suggestionText = await firstSuggestion.locator('span.UO9bH').textContent()

      console.log(`Suggestion đầu tiên: "${suggestionText}"`)

      // Click vào suggestion
      await suggestionLink.click()

      // Đợi navigation hoàn tất
      await page.waitForTimeout(3000)

      // Kiểm tra URL chứa từ khóa tìm kiếm
      const currentUrl = page.url()
      const expectedKeyword = suggestionText?.toLowerCase().replace(/\s+/g, '-')

      // Kiểm tra URL có chứa từ khóa hoặc '/search/'
      const hasSearchPath = currentUrl.includes('/search/') ||
        currentUrl.includes(`/${expectedKeyword}`) ||
        currentUrl.includes(encodeURIComponent(suggestionText || ''))

      expect(hasSearchPath).toBe(true)

      console.log(`TC18: Hoàn thành - Click gợi ý "${suggestionText}" → Chuyển đến ${currentUrl}`)
    } else {
      console.log('TC18: Fail - Không tìm thấy dropdown suggestions để click')
      throw new Error('No suggestion visible to click')
    }
  })
})
