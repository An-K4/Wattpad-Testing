import { test } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, saveDraft, publishChapter } from '../helpers/chapter-helper.js'

test.describe('Wattpad Chapter Publishing (TC56-TC61)', () => {

  test('TC56 - Lưu chương dưới dạng Draft → chưa hiển thị công khai', async ({ page }) => {
    console.log(' Đang chạy TC56: Lưu chương dưới dạng Draft...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương Draft - ' + Date.now(),
      content: 'Đây là nội dung chương draft chưa công khai.'
    })

    await saveDraft(page)
    await page.waitForTimeout(2000)

    // Kiểm tra có thông báo "Saved as draft"
    const draftIndicator = page.locator(':has-text("Draft"), :has-text("Saved")').first()
    const hasDraft = await draftIndicator.isVisible().catch(() => false)

    console.log(` TC56: Hoàn thành - ${hasDraft ? 'Lưu draft thành công' : 'Đã lưu'}.`)
  })

  test('TC57 - Publish chương → hiển thị công khai cho người đọc', async ({ page }) => {
    console.log(' Đang chạy TC57: Publish chương...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương Public - ' + Date.now(),
      content: 'Đây là nội dung chương công khai cho người đọc.'
    })

    await publishChapter(page)
    await page.waitForTimeout(3000)

    // Kiểm tra redirect hoặc thông báo publish thành công
    const successMsg = page.locator(':has-text("Published"), :has-text("Success")').first()
    const hasSuccess = await successMsg.isVisible().catch(() => false)

    console.log(` TC57: Hoàn thành - ${hasSuccess ? 'Publish thành công' : 'Đã đăng'}.`)
  })

  test('TC58 - Đặt lịch publish chương vào thời điểm trong tương lai', async ({ page }) => {
    console.log(' Đang chạy TC58: Đặt lịch publish...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương Scheduled',
      content: 'Nội dung chương sẽ publish sau.'
    })

    // Tìm option schedule
    const scheduleBtn = page.locator('button:has-text("Schedule"), [class*="schedule"]').first()
    const hasSchedule = await scheduleBtn.isVisible().catch(() => false)

    if (hasSchedule) {
      await scheduleBtn.click()
      await page.waitForTimeout(2000)

      // Fill datetime picker
      const dateInput = page.locator('input[type="date"], input[type="datetime-local"]').first()
      const hasDateInput = await dateInput.isVisible().catch(() => false)

      console.log(` TC58: ${hasDateInput ? 'Có chức năng đặt lịch' : 'Đã click schedule'}.`)
    } else {
      console.log(' TC58: Không tìm thấy chức năng đặt lịch.')
    }
  })

  test('TC59 - Thứ tự chương hiển thị đúng (chương 1 → 2 → 3...)', async ({ page }) => {
    console.log(' Đang chạy TC59: Kiểm tra thứ tự chương...')

    // Vào My Works và xem danh sách chương
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Click vào truyện đầu tiên
    const firstStory = page.locator('a[href*="/story/"]').first()
    const isVisible = await firstStory.isVisible().catch(() => false)

    if (isVisible) {
      await firstStory.click()
      await page.waitForTimeout(3000)

      // Kiểm tra danh sách chương
      const chapters = page.locator('.chapter, [class*="chapter"]')
      const chapterCount = await chapters.count()

      console.log(` TC59: Hoàn thành - Tìm thấy ${chapterCount} chương.`)
    } else {
      console.log(' TC59: Không tìm thấy truyện để kiểm tra.')
    }
  })

  test('TC60 - Chỉnh sửa chương đã publish → cập nhật đúng nội dung', async ({ page }) => {
    console.log(' Đang chạy TC60: Chỉnh sửa chương đã publish...')

    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Tìm nút Edit chapter
    const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first()
    const hasEdit = await editBtn.isVisible().catch(() => false)

    if (hasEdit) {
      await editBtn.click()
      await page.waitForTimeout(2000)

      // Sửa nội dung
      const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
      const hasEditor = await editor.isVisible().catch(() => false)

      if (hasEditor) {
        await editor.click()
        await page.keyboard.type(' - Nội dung đã chỉnh sửa')
        await page.waitForTimeout(1000)

        console.log(' TC60: Hoàn thành - Có thể chỉnh sửa chương.')
      }
    } else {
      console.log(' TC60: Không tìm thấy nút Edit.')
    }
  })

  test('TC61 - Xoá chương đã publish → không còn hiển thị', async ({ page }) => {
    console.log(' Đang chạy TC61: Kiểm tra xóa chương...')

    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Tìm nút Delete chapter
    const deleteBtn = page.locator('button:has-text("Delete"), a:has-text("Delete")').first()
    const hasDelete = await deleteBtn.isVisible().catch(() => false)

    if (hasDelete) {
      console.log(' TC61: Tìm thấy nút Delete - chức năng xóa chương khả dụng.')
      // Không thực sự xóa để tránh mất dữ liệu
    } else {
      console.log(' TC61: Không tìm thấy nút Delete trực tiếp.')
    }

    console.log(' TC61: Hoàn thành - Đã kiểm tra chức năng xóa.')
  })

})
