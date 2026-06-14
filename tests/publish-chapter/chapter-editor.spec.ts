import { test, expect } from '@playwright/test'
import { goToNewChapterPage, fillChapterForm, formatText, checkAutoSave, getEditorContent, saveDraft } from '../helpers/chapter-helper.js'

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
    const editor = page.locator('.story-editor').first()
    await editor.click()
    await page.keyboard.press('Control+A')

    await formatText(page, 'bold')
    await page.waitForTimeout(3000)

    const boldText = page.locator('.story-editor b, .story-editor strong').first()
    console.log('Selector for bold text:', await boldText.evaluate(node => node.outerHTML))
    expect(await boldText.isVisible()).toBe(true)

  })

  test('TC52 - In nghiêng (Italic) hoạt động đúng', async ({ page }) => {
    console.log(' Đang chạy TC52: Kiểm tra chức năng Italic...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Italic',
      content: 'Đây là văn bản test'
    })

    const editor = page.locator('.story-editor').first()
    await editor.click()
    await page.keyboard.press('Control+A')

    await formatText(page, 'italic')
    await page.waitForTimeout(1000)

    const italicText = page.locator('.story-editor i').first()
    expect(await italicText.isVisible()).toBe(true)
  })

  test('TC53 - Gạch chân (Underline) hoạt động đúng', async ({ page }) => {
    console.log(' Đang chạy TC53: Kiểm tra chức năng Underline...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Underline',
      content: 'Đây là văn bản test'
    })

    const editor = page.locator('.story-editor').first()
    await editor.click()
    await page.keyboard.press('Control+A')

    await formatText(page, 'underline')
    await page.waitForTimeout(1000)

    const underlineText = page.locator('.story-editor u').first()
    expect(await underlineText.isVisible()).toBe(true)
  })

  test('TC54 - Căn lề (trái/giữa/phải) hoạt động đúng', async ({ page }) => {
    console.log(' Đang chạy TC54: Kiểm tra căn lề...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Alignment',
      content: 'Đây là văn bản test căn lề'
    })

    const editor = page.locator('.story-editor').first()
    await editor.click()
    await page.keyboard.press('Control+A')

    // Test căn phải
    await formatText(page, 'align-right')
    await page.waitForTimeout(1000)

    const paragraph = page.locator('.story-editor p').first()
    let style = await paragraph.getAttribute('style')
    expect(style).toContain('text-align: right')

    // Test căn giữa
    await formatText(page, 'align-center')
    await page.waitForTimeout(1000)

    style = await paragraph.getAttribute('style')
    expect(style).toContain('text-align: center')

    // Test căn trái
    await formatText(page, 'align-left')
    await page.waitForTimeout(1000)

    style = await paragraph.getAttribute('style')
    expect(style).toContain('text-align: left')

    console.log(' TC54: Hoàn thành - Các chức năng căn lề hoạt động đúng.')
  })

  test('TC55 - Auto-save khi đang soạn thảo', async ({ page }) => {
    console.log(' Đang chạy TC55: Kiểm tra auto-save...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    await fillChapterForm(page, {
      title: 'Chương test Auto-save',
      content: 'Nội dung ban đầu'
    })

    // Thêm nội dung mới
    const editor = page.locator('.story-editor').first()
    await editor.click()
    await page.keyboard.type(' - Nội dung thêm vào')

    // Đợi cho "Đang lưu..." xuất hiện
    await page.waitForSelector('.save-indicator:has-text("Đang lưu"), .save-indicator:has-text("Saving")', { timeout: 10000 }).catch(() => null)

    // Đợi cho "Đang lưu..." biến mất hoặc chuyển thành "Đã lưu"
    await page.waitForSelector('.save-indicator:not(:has-text("Đang lưu")), .save-indicator:has-text("Saving")', { timeout: 120000 }).catch(() => null)

    const isSaved = await checkAutoSave(page)
    expect(isSaved).toBe(true)
    console.log(' TC55: Hoàn thành - Auto-save đã hoạt động.')
  })

  test('TC56 - Khôi phục bản nháp khi thoát ra rồi vào lại', async ({ page }) => {
    console.log(' Đang chạy TC56: Kiểm tra khôi phục draft...')
    await goToNewChapterPage(page)
    await page.waitForTimeout(3000)

    const testContent = 'Nội dung test draft - ' + Date.now()
    await fillChapterForm(page, {
      title: 'Chương draft',
      content: testContent
    })

    // Thêm thêm text để trigger auto-save
    const editor = page.locator('.story-editor').first()
    await editor.click()
    await page.keyboard.type(' UNIQUE')

    await page.waitForTimeout(1000)

    await saveDraft(page)
    await page.waitForSelector('.save-indicator:not(:has-text("Đang lưu")), .save-indicator:has-text("Saving")', { timeout: 120000 }).catch(() => null)

    // Reload trang
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Kiểm tra nội dung có được khôi phục
    const currentContent = await getEditorContent(page)
    const hasRestoredContent = currentContent.includes('UNIQUE') && currentContent.includes('draft')

    expect(hasRestoredContent).toBe(true)
    console.log(' TC56: Hoàn thành - Draft được khôi phục thành công.')
  })

})
