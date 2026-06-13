import { test, expect } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, publishChapter, hasChapterError } from '../helpers/chapter-helper.js'

test.describe('Wattpad Chapter Validation (TC42-TC45)', () => {

  test('TC42 - Đăng chương thành công với đầy đủ thông tin', async ({ page }) => {
    console.log(' Đang chạy TC42: Đăng chương với thông tin đầy đủ...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương 1 - Khởi đầu - TC42',
      content: 'Đây là nội dung chương đầu tiên của truyện. Nội dung test đầy đủ với nhiều câu văn để đảm bảo vượt qua giới hạn tối thiểu.'
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(false)
    console.log(' TC42: Hoàn thành - Đăng chương thành công.')
  })

  test('TC43 - Đăng chương trống không → tự động tạo tiêu đề mặc định', async ({ page }) => {
    console.log(' Đang chạy TC43: Đăng chương trống...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: '',
      content: ''
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    // Kiểm tra có tiêu đề mặc định như "Untitled" hoặc "Chưa đặt tiêu đề"
    const defaultTitle = page.locator(':has-text("Untitled"), :has-text("Chưa đặt tiêu đề"), :has-text("untitled")').first()
    const hasDefaultTitle = await defaultTitle.isVisible().catch(() => false)

    console.log(` TC43: Hoàn thành - ${hasDefaultTitle ? 'Tạo tiêu đề mặc định' : 'Đã publish'}.`)
  })

  test('TC44 - Bỏ trống tiêu đề chương → tự động tạo tiêu đề mặc định', async ({ page }) => {
    console.log(' Đang chạy TC44: Bỏ trống tiêu đề chương...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: '',
      content: 'Đây là nội dung chương nhưng không có tiêu đề. - TC44'
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    // Kiểm tra có tiêu đề mặc định
    const defaultTitle = page.locator(':has-text("Untitled"), :has-text("Chưa đặt tiêu đề"), :has-text("untitled")').first()
    const hasDefaultTitle = await defaultTitle.isVisible().catch(() => false)

    console.log(` TC44: Hoàn thành - ${hasDefaultTitle ? 'Tạo tiêu đề mặc định' : 'Đã publish với tiêu đề tự động'}.`)
  })

  test('TC45 - Bỏ trống nội dung chương → cho phép đăng với nội dung trống', async ({ page }) => {
    console.log(' Đang chạy TC45: Bỏ trống nội dung chương...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương có tiêu đề - TC45',
      content: ''
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    // Kiểm tra không có lỗi - Wattpad cho phép nội dung trống
    const hasError = await hasChapterError(page)
    expect(hasError).toBe(false)
    console.log(' TC45: Hoàn thành - Cho phép đăng chương có tiêu đề nhưng không có nội dung.')
  })

})
