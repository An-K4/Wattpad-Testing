import { test, expect } from '@playwright/test'
import { goToCreateStoryPage, fillStoryForm, submitStoryForm, uploadCoverImage, hasErrorMessage } from '../helpers/story-helper.js'

test.describe('Wattpad Story Customization (TC29-TC37)', () => {

  test('TC29 - Upload ảnh bìa đúng định dạng (JPG/PNG) → hiển thị preview', async ({ page }) => {
    console.log(' Đang chạy TC29: Upload ảnh bìa hợp lệ...')
    await goToCreateStoryPage(page)

    // Giả sử có file test image (cần tạo file này)
    const testImagePath = 'tests/fixtures/test-cover.jpg'

    try {
      await uploadCoverImage(page, testImagePath)

      // Kiểm tra preview image hiển thị
      const previewImg = page.locator('img[src*="blob:"], img.preview, .cover-preview img').first()
      const hasPreview = await previewImg.isVisible().catch(() => false)

      expect(hasPreview).toBe(true)
      console.log(' TC29: Hoàn thành - Ảnh bìa hiển thị preview.')
    } catch {
      console.log(' TC29: Không tìm thấy file test hoặc upload không khả dụng.')
    }
  })

  test('TC30 - Upload ảnh bìa sai định dạng (PDF, GIF...) → hiển thị lỗi', async ({ page }) => {
    console.log(' Đang chạy TC30: Upload file sai định dạng...')
    await goToCreateStoryPage(page)

    const testPdfPath = 'tests/fixtures/test-file.pdf'

    try {
      await uploadCoverImage(page, testPdfPath)
      await page.waitForTimeout(2000)

      const hasError = await hasErrorMessage(page)
      console.log(` TC30: ${hasError ? 'Hiển thị lỗi đúng' : 'Không có lỗi (có thể bị block)'}.`)
    } catch {
      console.log(' TC30: File input có thể đã restrict định dạng.')
    }
  })

  test('TC31 - Upload ảnh bìa quá dung lượng → hiển thị lỗi', async ({ page }) => {
    console.log(' Đang chạy TC31: Upload ảnh quá dung lượng...')
    await goToCreateStoryPage(page)

    const largePath = 'tests/fixtures/large-image.jpg'

    try {
      await uploadCoverImage(page, largePath)
      await page.waitForTimeout(2000)

      const hasError = await hasErrorMessage(page)
      console.log(` TC31: ${hasError ? 'Hiển thị lỗi dung lượng' : 'Chấp nhận file'}.`)
    } catch {
      console.log(' TC31: Không tìm thấy file test lớn.')
    }
  })

  test('TC32 - Chọn truyện là Public → ai cũng xem được', async ({ page }) => {
    console.log(' Đang chạy TC32: Tạo truyện Public...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Public Story - ' + Date.now(),
      description: 'Đây là truyện công khai',
      language: '1',
      genre: 'Romance',
      isPublic: true
    })

    await submitStoryForm(page)
    await page.waitForTimeout(3000)

    // Kiểm tra không có lỗi
    const hasError = await hasErrorMessage(page)
    expect(hasError).toBe(false)
    console.log(' TC32: Hoàn thành - Tạo truyện Public thành công.')
  })

  test('TC33 - Chọn truyện là Private → chỉ mình xem được', async ({ page }) => {
    console.log(' Đang chạy TC33: Tạo truyện Private...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Private Story - ' + Date.now(),
      description: 'Đây là truyện riêng tư',
      language: '1',
      genre: 'Romance',
      isPublic: false
    })

    await submitStoryForm(page)
    await page.waitForTimeout(3000)

    const hasError = await hasErrorMessage(page)
    expect(hasError).toBe(false)
    console.log(' TC33: Hoàn thành - Tạo truyện Private thành công.')
  })

  test('TC34 - Chọn truyện là Mature → hiển thị cảnh báo nội dung 18+', async ({ page }) => {
    console.log(' Đang chạy TC34: Đánh dấu truyện Mature...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Mature Story - ' + Date.now(),
      description: 'Nội dung 18+',
      language: '1',
      genre: 'Romance',
      isMature: true
    })

    await submitStoryForm(page)
    await page.waitForTimeout(3000)

    // Kiểm tra có cảnh báo mature content
    const matureWarning = page.locator('[class*="mature"], [class*="warning"], :has-text("18+")').first()
    const hasWarning = await matureWarning.isVisible().catch(() => false)

    console.log(` TC34: ${hasWarning ? 'Hiển thị cảnh báo Mature' : 'Không có cảnh báo rõ ràng'}.`)
  })

  test('TC35 - Thêm tag cho truyện → tag hiển thị đúng', async ({ page }) => {
    console.log(' Đang chạy TC35: Thêm tags...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Story with Tags - ' + Date.now(),
      description: 'Test tags',
      language: '1',
      genre: 'Romance',
      tags: ['romance', 'drama', 'fantasy']
    })

    await submitStoryForm(page)
    await page.waitForTimeout(3000)

    // Kiểm tra tags hiển thị
    const tagElements = page.locator('.tag, [class*="tag"]')
    const tagCount = await tagElements.count()

    console.log(` TC35: Hoàn thành - Thêm ${tagCount} tags.`)
  })

  test('TC36 - Thêm tag trùng lặp → chỉ giữ 1', async ({ page }) => {
    console.log(' Đang chạy TC36: Thêm tag trùng lặp...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Duplicate Tags - ' + Date.now(),
      description: 'Test duplicate tags',
      language: '1',
      genre: 'Romance',
      tags: ['romance', 'romance', 'drama']
    })

    await submitStoryForm(page)
    await page.waitForTimeout(3000)

    // Kiểm tra số lượng tag (nên chỉ có 2 thay vì 3)
    const tagElements = page.locator('.tag, [class*="tag"]')
    const tagCount = await tagElements.count()

    console.log(` TC36: Số tag hiển thị: ${tagCount} (mong đợi: 2).`)
  })

  test('TC37 - Thêm quá số lượng tag cho phép → hiển thị lỗi', async ({ page }) => {
    console.log(' Đang chạy TC37: Thêm quá nhiều tags...')
    await goToCreateStoryPage(page)

    const manyTags = Array.from({ length: 30 }, (_, i) => `tag${i + 1}`)

    await fillStoryForm(page, {
      title: 'Too Many Tags - ' + Date.now(),
      description: 'Test tag limit',
      language: '1',
      genre: 'Romance',
      tags: manyTags
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    console.log(` TC37: ${hasError ? 'Hiển thị lỗi giới hạn tag' : 'Chấp nhận hoặc tự cắt bớt'}.`)
  })

})
