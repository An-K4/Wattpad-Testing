import { test, expect } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, publishChapter, hasChapterError } from '../helpers/chapter-helper.js'

test.describe('Wattpad Chapter Validation (TC42-TC45)', () => {

  test('TC42 - Đăng chương thành công với đầy đủ thông tin', async ({ page }) => {
    console.log(' Đang chạy TC42: Đăng chương với thông tin đầy đủ...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương 1 - Khởi đầu',
      content: 'Đây là nội dung chương đầu tiên của truyện. Nội dung test đầy đủ với nhiều câu văn để đảm bảo vượt qua giới hạn tối thiểu.'
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(false)
    console.log(' TC42: Hoàn thành - Đăng chương thành công.')
  })

  test('TC43 - Đăng chương trống không → bị từ chối', async ({ page }) => {
    console.log(' Đang chạy TC43: Đăng chương trống...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: '',
      content: ''
    })

    await publishChapter(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(true)
    console.log(' TC43: Hoàn thành - Không cho đăng chương trống.')
  })

  test('TC44 - Bỏ trống tiêu đề chương → không cho đăng, hiển thị lỗi', async ({ page }) => {
    console.log(' Đang chạy TC44: Bỏ trống tiêu đề chương...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: '',
      content: 'Đây là nội dung chương nhưng không có tiêu đề.'
    })

    await publishChapter(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(true)
    console.log(' TC44: Hoàn thành - Yêu cầu nhập tiêu đề chương.')
  })

  test('TC45 - Bỏ trống nội dung chương → không cho đăng, hiển thị lỗi', async ({ page }) => {
    console.log(' Đang chạy TC45: Bỏ trống nội dung chương...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương có tiêu đề',
      content: ''
    })

    await publishChapter(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(true)
    console.log(' TC45: Hoàn thành - Yêu cầu nhập nội dung chương.')
  })

})
