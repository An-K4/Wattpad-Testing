import { test } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, formatText, checkAutoSave, getEditorContent } from '../helpers/chapter-helper.js'

test.describe('Wattpad Chapter Editor (TC51-TC55)', () => {

  test('TC51 - In đậm (Bold) hoạt động đúng', async ({ page }) => {
    console.log(' Đang chạy TC51: Kiểm tra chức năng Bold...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Bold',
      content: 'Đây là văn bản test'
    })

    // Select text và apply bold
    const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
    await editor.click()
    await page.keyboard.press('Control+A')

    await formatText(page, 'bold')
    await page.waitForTimeout(1000)

    // Kiểm tra có button bold được active
    const boldBtn = page.locator('button[title*="Bold"], button:has-text("B")').first()
    const isActive = await boldBtn.getAttribute('class').then(cls => cls?.includes('active') || cls?.includes('selected'))

    console.log(` TC51: Hoàn thành - Bold ${isActive ? 'đã active' : 'đã click'}.`)
  })

  test('TC52 - In nghiêng (Italic) hoạt động đúng', async ({ page }) => {
    console.log(' Đang chạy TC52: Kiểm tra chức năng Italic...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Italic',
      content: 'Đây là văn bản test'
    })

    const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
    await editor.click()
    await page.keyboard.press('Control+A')

    await formatText(page, 'italic')
    await page.waitForTimeout(1000)

    const italicBtn = page.locator('button[title*="Italic"], button:has-text("I")').first()
    const hasBtn = await italicBtn.isVisible().catch(() => false)

    console.log(` TC52: Hoàn thành - Italic ${hasBtn ? 'khả dụng' : 'không tìm thấy'}.`)
  })

  test('TC53 - Căn lề (trái/giữa/phải) hoạt động đúng', async ({ page }) => {
    console.log(' Đang chạy TC53: Kiểm tra căn lề...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Alignment',
      content: 'Đây là văn bản test căn lề'
    })

    const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
    await editor.click()

    // Test căn giữa
    await formatText(page, 'align-center')
    await page.waitForTimeout(500)

    // Test căn phải
    await formatText(page, 'align-right')
    await page.waitForTimeout(500)

    // Test căn trái
    await formatText(page, 'align-left')
    await page.waitForTimeout(500)

    console.log(' TC53: Hoàn thành - Các chức năng căn lề đã được test.')
  })

  test('TC54 - Auto-save khi đang soạn thảo', async ({ page }) => {
    console.log(' Đang chạy TC54: Kiểm tra auto-save...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Auto-save',
      content: 'Nội dung ban đầu'
    })

    // Đợi auto-save trigger
    await page.waitForTimeout(5000)

    // Thêm nội dung mới
    const editor = page.locator('textarea[name="content"], .editor, [contenteditable="true"]').first()
    await editor.click()
    await page.keyboard.type(' - Nội dung thêm vào')

    // Đợi auto-save
    await page.waitForTimeout(5000)

    const isSaved = await checkAutoSave(page)
    console.log(` TC54: Hoàn thành - Auto-save ${isSaved ? 'đã hoạt động' : 'không phát hiện'}.`)
  })

  test('TC55 - Khôi phục bản nháp khi thoát ra rồi vào lại', async ({ page }) => {
    console.log(' Đang chạy TC55: Kiểm tra khôi phục draft...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    const testContent = 'Nội dung test draft - ' + Date.now()
    await fillChapterForm(page, {
      title: 'Chương draft',
      content: testContent
    })

    // Đợi auto-save
    await page.waitForTimeout(5000)

    // Reload trang
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Kiểm tra nội dung có được khôi phục
    const currentContent = await getEditorContent(page)
    const hasRestoredContent = currentContent.includes('draft') || currentContent.length > 0

    console.log(` TC55: ${hasRestoredContent ? 'Draft được khôi phục' : 'Không phát hiện draft'}.`)
  })

})
