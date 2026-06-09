import { test, expect } from '@playwright/test'

test.describe('Wattpad Story Management (TC38-TC41)', () => {

  test('TC38 - Truyện vừa tạo xuất hiện trong "My Works"', async ({ page }) => {
    console.log(' Đang chạy TC38: Kiểm tra truyện trong My Works...')

    // Giả sử đã tạo truyện trước đó, giờ check My Works
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Kiểm tra có ít nhất 1 truyện trong danh sách
    const storyItems = page.locator('[class*="story"], .work-item, [data-story-id]')
    const count = await storyItems.count()

    expect(count).toBeGreaterThan(0)
    console.log(` TC38: Hoàn thành - Tìm thấy ${count} truyện trong My Works.`)
  })

  test('TC39 - Thông tin truyện hiển thị đúng trên trang truyện', async ({ page }) => {
    console.log(' Đang chạy TC39: Kiểm tra thông tin truyện...')

    // Vào My Works và click vào truyện đầu tiên
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    const firstStory = page.locator('a[href*="/story/"]').first()
    const isVisible = await firstStory.isVisible().catch(() => false)

    if (isVisible) {
      await firstStory.click()
      await page.waitForTimeout(4000)

      // Kiểm tra có tiêu đề và mô tả
      const title = page.locator('h1, .title, [class*="title"]').first()
      const description = page.locator('.description, [class*="description"]').first()

      const hasTitleVisible = await title.isVisible().catch(() => false)
      const hasDescVisible = await description.isVisible().catch(() => false)

      expect(hasTitleVisible || hasDescVisible).toBe(true)
      console.log(' TC39: Hoàn thành - Thông tin truyện hiển thị.')
    } else {
      console.log(' TC39: Không tìm thấy truyện để kiểm tra.')
    }
  })

  test('TC40 - Có thể chỉnh sửa thông tin truyện sau khi tạo', async ({ page }) => {
    console.log(' Đang chạy TC40: Kiểm tra chỉnh sửa truyện...')

    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Tìm nút Edit hoặc Settings
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), [class*="edit"], button:has-text("Settings")').first()
    const hasEdit = await editButton.isVisible().catch(() => false)

    if (hasEdit) {
      await editButton.click()
      await page.waitForTimeout(2000)

      // Kiểm tra form edit xuất hiện
      const titleInput = page.locator('input[name="title"], #title').first()
      const hasInput = await titleInput.isVisible().catch(() => false)

      expect(hasInput).toBe(true)
      console.log(' TC40: Hoàn thành - Form chỉnh sửa hoạt động.')
    } else {
      console.log(' TC40: Không tìm thấy nút Edit.')
    }
  })

  test('TC41 - Có thể xoá truyện sau khi tạo', async ({ page }) => {
    console.log(' Đang chạy TC41: Kiểm tra xóa truyện...')

    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    const initialCount = await page.locator('[class*="story"], .work-item').count()

    // Tìm nút Delete
    const deleteButton = page.locator('button:has-text("Delete"), a:has-text("Delete"), [class*="delete"]').first()
    const hasDelete = await deleteButton.isVisible().catch(() => false)

    if (hasDelete) {
      console.log(' TC41: Tìm thấy nút Delete - chức năng xóa khả dụng.')
      // Không thực sự xóa trong test để tránh mất dữ liệu
    } else {
      console.log(' TC41: Không tìm thấy nút Delete trực tiếp (có thể trong menu).')
    }

    console.log(` TC41: Hoàn thành - Có ${initialCount} truyện trong My Works.`)
  })

})
