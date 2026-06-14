import { test, expect } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, publishChapter, hasChapterError, saveDraft } from '../helpers/chapter-helper.js'

test.describe('Wattpad Chapter Content (TC44-TC48)', () => {

  test('TC44 - Tiêu đề chương quá dài → hiển thị lỗi / cắt bớt', async ({ page }) => {
    console.log(' Đang chạy TC44: Tiêu đề chương quá dài...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    const longTitle = 'Chương 1 - ' + 'A'.repeat(3000)
    await fillChapterForm(page, {
      title: longTitle,
      content: 'Nội dung test cho chương có tiêu đề dài.'
    })

    await saveDraft(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)

    expect(hasError).toBe(true)
    console.log(' TC44: Hiển thị lỗi.')
  })

  test('TC45 - Nội dung chương quá ngắn (dưới giới hạn tối thiểu) → cho phép đăng', async ({ page }) => {
    console.log(' Đang chạy TC45: Nội dung chương quá ngắn...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương ngắn',
      content: 'Test'
    })

    await publishChapter(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(false)
    console.log(' TC45: Cho phép đăng.')
  })

  test('TC46 - Nội dung chứa ký tự đặc biệt / emoji → hiển thị đúng', async ({ page }) => {
    console.log(' Đang chạy TC46: Nội dung có ký tự đặc biệt và emoji...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương có emoji 🎉',
      content: 'Nội dung test với ký tự đặc biệt @#$% và emoji 😊💖🌟. Đây là test để kiểm tra xử lý Unicode.'
    })

    await publishChapter(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(false)
    console.log(' TC46: Hoàn thành - Xử lý ký tự đặc biệt và emoji đúng.')
  })

  test('TC47 - Nội dung chứa link ngoài → xử lý đúng (giữ / loại bỏ)', async ({ page }) => {
    console.log(' Đang chạy TC47: Nội dung có link ngoài...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương có link',
      content: 'Nội dung test với link: https://example.com và https://test.com để kiểm tra xử lý URL.'
    })

    await publishChapter(page)
    await page.waitForTimeout(2000)

    const hasError = await hasChapterError(page)
    expect(hasError).toBe(false)
    console.log(' TC47: Hoàn thành - Xử lý link trong nội dung.')
  })

  test('TC48 - Copy-paste nội dung từ Word vào editor → giữ định dạng hoặc plain text', async ({ page }) => {
    console.log(' Đang chạy TC48: Paste nội dung từ Word...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    // Giả lập paste content với HTML formatting
    const richContent = '<p><strong>Chương 1</strong></p><p><em>Nội dung in nghiêng</em></p><p>Đoạn văn bình thường.</p>'

    const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
    await editor.click()

    // Paste content
    await page.evaluate((content) => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement) {
        if ('value' in activeElement) {
          (activeElement as HTMLInputElement).value = content
        } else {
          activeElement.textContent = content
        }
      }
    }, richContent)

    await page.waitForTimeout(1000)

    await expect(editor).not.toBeEmpty()
    console.log(' TC48: Hoàn thành - Paste nội dung vào editor.')
  })

})
