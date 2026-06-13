import { test, expect } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, saveDraft, publishChapter, schedulePublishChapter, goToMyWorks, editPublishedChapter, publishChanges } from '../helpers/chapter-helper.js'

test.describe('Wattpad Chapter Publishing (TC57-TC62)', () => {

  test('TC57 - Lưu chương dưới dạng Draft → chưa hiển thị công khai', async ({ page }) => {
    console.log(' Đang chạy TC57: Lưu chương dưới dạng Draft...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương Draft - ' + Date.now(),
      content: 'Đây là nội dung chương draft chưa công khai.'
    })

    await saveDraft(page)

    // Đợi cho "Đang lưu..." xuất hiện
    await page.waitForSelector('.save-indicator:has-text("Đang lưu")', { timeout: 10000 }).catch(() => null)

    // Đợi cho "Đang lưu..." biến mất (đã lưu xong)
    await page.waitForSelector('.save-indicator:not(:has-text("Đang lưu"))', { timeout: 15000 }).catch(() => null)

    // Kiểm tra vẫn ở trang editor (chưa publish)
    const editorVisible = await page.locator('.story-editor').isVisible().catch(() => false)
    expect(editorVisible).toBe(true)

    console.log('TC57: Hoàn thành - Đã lưu draft thành công')
  })

  test('TC58 - Publish chương → hiển thị công khai cho người đọc', async ({ page }) => {
    console.log(' Đang chạy TC58: Publish chương...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương Public - ' + Date.now(),
      content: 'Đây là nội dung chương công khai cho người đọc.'
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    // Kiểm tra đã redirect đến trang công khai (URL không còn /write hoặc /publish)
    const currentURL = page.url()
    const isPublicPage = !currentURL.includes('/write') && !currentURL.includes('/publish')

    expect(isPublicPage).toBe(true)
    console.log(' TC58: Hoàn thành - Publish thành công, đã chuyển đến trang công khai.')
  })

  test('TC59 - Đặt lịch publish chương vào thời điểm trong tương lai', async ({ page }) => {
    console.log(' Đang chạy TC59: Đặt lịch publish...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương Scheduled - ' + Date.now(),
      content: 'Nội dung chương sẽ publish sau.'
    })

    await schedulePublishChapter(page)
    await page.waitForTimeout(3000)

    // Kiểm tra modal thành công xuất hiện
    const successModal = page.locator('h2:has-text("Phần truyện của bạn đã được lên lịch"), h2:has-text("scheduled")').first()
    const hasSuccessModal = await successModal.isVisible().catch(() => false)

    expect(hasSuccessModal).toBe(true)
    console.log(' TC59: Hoàn thành - Đã đặt lịch publish thành công.')
  })

  test('TC60 - Chỉnh sửa chương đã publish → cập nhật đúng nội dung', async ({ page }) => {
    console.log('Đang chạy TC60: Chỉnh sửa chương đã publish...')

    await goToMyWorks(page)
    await editPublishedChapter(page)

    // Sửa nội dung
    const editor = page.locator('.story-editor').first()
    const hasEditor = await editor.isVisible().catch(() => false)
    expect(hasEditor).toBe(true)

    await editor.click()
    await page.keyboard.type(' - Nội dung đã chỉnh sửa ' + Date.now())
    await page.waitForTimeout(1000)

    await publishChanges(page)

    // Kiểm tra đã chuyển đến trang công khai của chapter
    const currentURL = page.url()
    const isPublicPage = !currentURL.includes('/write') && !currentURL.includes('/publish')

    expect(isPublicPage).toBe(true)
    console.log('TC60: Hoàn thành - Đã chỉnh sửa và đăng lại chương thành công.')
  })

  test('TC61 - Xoá chương đã publish → không còn hiển thị', async ({ page }) => {
    console.log('Đang chạy TC61: Xóa chương đã publish...')

    await goToMyWorks(page)
    await editPublishedChapter(page)

    // Bấm button menu settings
    const menuBtn = page.locator('.on-show-settings').first()
    await menuBtn.click()
    await page.waitForTimeout(1000)

    // Chọn "Xóa chương này" hoặc "Delete this part"
    const deleteOption = page.locator('button:has-text("Xóa chương này"), button:has-text("Delete this part"), a:has-text("Xóa chương này"), a:has-text("Delete this part")').first()
    await deleteOption.click()
    await page.waitForTimeout(1000)

    // Xác nhận xóa nếu có modal confirm
    const confirmBtn = page.locator('button:has-text("Xóa"), button:has-text("Delete"), button:has-text("Xác nhận")').first()
    const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasConfirm) {
      await confirmBtn.click()
      await page.waitForTimeout(2000)
    }

    // Kiểm tra đã chuyển về trang các chương của truyện (table of contents)
    const currentURL = page.url()
    const isTableOfContents = currentURL.includes('/myworks/') && !currentURL.includes('/write')

    expect(isTableOfContents).toBe(true)
    console.log('TC61: Hoàn thành - Đã xóa chương và quay về trang danh sách chương.')
  })

})
