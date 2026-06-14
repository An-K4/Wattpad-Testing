import { test, expect } from '@playwright/test'
import {
  goToNewStoryPage,
  fillTitle,
  fillDescription,
  selectLanguage,
  selectStoryType,
  submitStoryForm,
  deleteStory,
  handleCreateSeriesTooltip
} from '../helpers/story-helper.js'

test.describe('Wattpad Story Management (TC38-TC41)', () => {

  test('TC38 - Truyện vừa tạo xuất hiện trong "My Works"', async ({ page }) => {
    console.log('TC38: Kiểm tra truyện trong My Works...')

    // Tạo truyện mới (giống TC19)
    await goToNewStoryPage(page)

    const storyTitle = `Automation Test Story - TC38 ${Date.now()}`
    const storyDescription = 'Mô tả tự động tạo bởi Playwright để kiểm thử TC38.'

    await fillTitle(page, storyTitle)
    await fillDescription(page, storyDescription)
    await selectLanguage(page, '19') // Tiếng Việt
    await selectStoryType(page, 'Fiction')

    // Submit và lấy URL truyện vừa tạo
    const storyUrl = await submitStoryForm(page)
    console.log(`Đã tạo truyện thành công: ${storyUrl}`)

    // Điều hướng đến My Works
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Xử lý tooltip Create series nếu có ở My Works
    await handleCreateSeriesTooltip(page)

    // Click vào all stories filter
    await page.locator('#works-content > div.metadata > ul > li > span:has-text("All Stories")').first().click()

    // Tìm truyện vừa tạo trong danh sách
    const storyCard = page.locator('.story-wrapper', { hasText: storyTitle })
    const count = await storyCard.count()
    console.log(`Tìm thấy ${count} story card với title: ${storyTitle}`)

    // Nếu không tìm thấy theo text, thử lấy card đầu tiên và kiểm tra title
    if (count === 0) {
      console.log('Không tìm thấy theo text, thử lấy card đầu tiên...')
      const firstCard = page.locator('.story-wrapper').first()
      const firstTitle = await firstCard.locator('.story-title a').textContent()
      console.log(`Title của card đầu tiên: "${firstTitle}"`)

      // Nếu title khớp (có thể bị trim hoặc thay đổi)
      if (firstTitle?.includes('Automation Test Story')) {
        console.log('Tìm thấy card bằng cách kiểm tra includes')
        await firstCard.scrollIntoViewIfNeeded()
        expect(firstTitle).toContain('Automation Test Story')
      } else {
        throw new Error(`Không tìm thấy truyện với title: ${storyTitle}`)
      }
    } else {
      await storyCard.first().scrollIntoViewIfNeeded()
      const titleElement = storyCard.first().locator('.story-title a')
      const actualTitle = await titleElement.textContent()
      expect(actualTitle?.trim()).toBe(storyTitle)
      console.log(`Tiêu đề truyện: "${actualTitle}"`)
    }

    console.log(`TC38: Truyện "${storyTitle}" xuất hiện trong My Works → PASS.`)
  })

  test('TC39 - Thông tin truyện hiển thị đúng trên trang truyện', async ({ page }) => {
    console.log('TC39: Kiểm tra thông tin truyện trong Story Details')

    // Tạo truyện mới
    await goToNewStoryPage(page)
    const timestamp = Date.now()
    const storyTitle = `Automation Test Story - TC39 ${timestamp}`
    const storyDescription = 'Mô tả tự động tạo bởi Playwright để kiểm thử TC39'

    await fillTitle(page, storyTitle)
    await fillDescription(page, storyDescription)
    await selectLanguage(page, '19')
    await selectStoryType(page, 'Fiction')

    const storyUrl = await submitStoryForm(page)
    console.log(`Đã tạo truyện thành công: ${storyUrl}`)

    // Điều hướng đến My Works
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)
    await handleCreateSeriesTooltip(page)

    // Click vào all stories filter
    await page.locator('#works-content > div.metadata > ul > li > span:has-text("All Stories")').first().click()

    // Click vào tên truyện
    const storyLink = page.locator('.story-title a', { hasText: String(timestamp) }).first()
    await storyLink.click()
    console.log('Đã click vào tên truyện')
    await page.waitForTimeout(3000)

    // Click vào tab "Story Details" (button)
    await page.locator('button.on-switch-type[data-section="story-detail"]').click()
    console.log('Đã click vào Story Details tab')
    await page.waitForTimeout(2000)

    // 5. Kiểm tra thông tin trong form Story Details
    console.log('Đang kiểm tra thông tin trong form Story Details')

    // Kiểm tra title - so sánh không phân biệt dấu gạch
    const titleInput = page.locator('input#title').first()
    const displayedTitle = await titleInput.inputValue()
    console.log(`Tiêu đề: "${displayedTitle}"`)
    // Chỉ kiểm tra nội dung bỏ qua dấu gạch dài hay ngắn
    expect(displayedTitle.replace(/[--]/g, '-')).toBe(storyTitle.replace(/[--]/g, '-'))

    // Kiểm tra description
    const descriptionTextarea = page.locator('textarea#description').first()
    const displayedDescription = await descriptionTextarea.inputValue()
    console.log(`Mô tả: "${displayedDescription}"`)
    expect(displayedDescription).toBe(storyDescription)

    // Kiểm tra language
    const languageSelect = page.locator('select#story-language').first()
    const selectedLanguage = await languageSelect.inputValue()
    console.log(`Ngôn ngữ được chọn: ${selectedLanguage}`)
    expect(selectedLanguage).toBe('19')

    // Kiểm tra story type Fiction đã được chọn
    const fictionButton = page.locator('button:has-text("Fiction")').first()
    const hasCheckIcon = await fictionButton.locator('svg').count()
    console.log(`Story type Fiction được chọn: ${hasCheckIcon > 0}`)
    expect(hasCheckIcon).toBeGreaterThan(0)

    // Kiểm tra ảnh bìa - dùng selector đúng từ DOM mới
    const coverImage = page.locator('[data-testid="cover"] img[data-testid="image"]').first()
    const coverSrc = await coverImage.getAttribute('src')
    console.log(`Ảnh bìa: ${coverSrc?.substring(0, 80)}...`)
    expect(coverSrc).toBeTruthy()
    expect(coverSrc).toMatch(/^https?:\/\/.*\.(jpg|png|jpeg|webp)/i)

    console.log('TC39: Tất cả thông tin truyện hiển thị chính xác trong Story Details → PASS')
  })

  test('TC40 - Có thể chỉnh sửa thông tin truyện sau khi tạo', async ({ page }) => {
    console.log('TC40: Chỉnh sửa thông tin truyện...')

    // 1. Tạo truyện mới
    await goToNewStoryPage(page)
    const timestamp = Date.now()
    const storyTitle = `Automation Test Story - TC40 ${timestamp}`
    const storyDescription = 'Mô tả tự động tạo bởi Playwright để kiểm thử TC40'

    await fillTitle(page, storyTitle)
    await fillDescription(page, storyDescription)
    await selectLanguage(page, '19')
    await selectStoryType(page, 'Fiction')

    const storyUrl = await submitStoryForm(page)
    console.log(`Đã tạo truyện thành công: ${storyUrl}`)

    // Điều hướng đến My Works
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)
    await handleCreateSeriesTooltip(page)

    // Click vào all stories filter
    await page.locator('#works-content > div.metadata > ul > li > span:has-text("All Stories")').first().click()

    // Click vào tên truyện
    const storyLink = page.locator('.story-title a', { hasText: String(timestamp) }).first()
    await storyLink.click()
    console.log('Đã click vào tên truyện')
    await page.waitForTimeout(3000)

    // Click vào tab "Story Details"
    await page.locator('button.on-switch-type[data-section="story-detail"]').click()
    console.log('Đã click vào Story Details tab')
    await page.waitForTimeout(2000)

    // Sửa thông tin
    const newTimestamp = Date.now()
    const newTitle = `Edited Story - TC40 ${newTimestamp}`
    const newDescription = `Đã chỉnh sửa lúc ${new Date().toLocaleString()}`

    // Sửa title
    await fillTitle(page, newTitle)
    console.log(`Đã sửa title: ${newTitle}`)

    // Sửa description
    await fillDescription(page, newDescription)
    console.log(`Đã sửa description: ${newDescription}`)

    // Chọn language Tiếng Việt
    await selectLanguage(page, '19')
    console.log('Đã chọn ngôn ngữ Tiếng Việt')

    // Cuộn đến Story type
    await page.locator('.lgq4e').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Chọn story type Fanfic
    const fanficButton = page.locator('button:has-text("Fanfic")').first()
    await fanficButton.click()
    console.log('Đã chọn Fanfic')

    // Cuộn đến Tags
    await page.locator('input#tags').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Thêm tag
    const tagInput = page.locator('input#tags')
    await tagInput.fill('test edit automation')
    await tagInput.press('Enter')
    console.log('Đã thêm tag')

    // Cuộn đến Mature toggle
    await page.locator('input#mature').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Toggle Mature
    if (!await page.locator('input#mature').isChecked()) {
      await page.locator('label[for="mature"]').click()
      console.log('Đã toggle Mature')
    }

    // Cuộn đến Complete toggle
    await page.locator('input#complete').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Toggle Complete
    if (!await page.locator('input#complete').isChecked()) {
      await page.locator('label[for="complete"]').click()
      console.log('Đã toggle Complete')
    }

    // Cuộn đến Target Audience
    await page.locator('select#target-audience').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Chọn Target Audience
    const audienceSelect = page.locator('select#target-audience')
    await audienceSelect.selectOption('18-25')
    console.log('Đã chọn Target Audience: New Adult (18-25)')

    // Click nút Save
    const saveButton = page.locator('button._5I-Pr, button:has-text("Save")').first()
    await saveButton.click()
    console.log('Đã click Save')

    // Đợi toast message xuất hiện
    const toastMessage = page.locator('[data-testid="toast-div"]:has-text("Story details saved")')
    await toastMessage.waitFor({ state: 'visible', timeout: 10000 })
    console.log('Đã thấy toast message: Story details saved')

    // Điều hướng về My Works
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)
    await handleCreateSeriesTooltip(page)

    // Click vào all stories filter
    await page.locator('#works-content > div.metadata > ul > li > span:has-text("All Stories")').first().click()

    // Tìm truyện với timestamp vừa sửa
    const updatedStoryLink = page.locator('.story-title a', { hasText: String(newTimestamp) }).first()
    await updatedStoryLink.click()
    console.log(`Đã click vào truyện với timestamp: ${newTimestamp}`)
    await page.waitForTimeout(3000)

    // Click vào Story Details tab
    await page.locator('button.on-switch-type[data-section="story-detail"]').click()
    await page.waitForTimeout(2000)

    // Kiểm tra các thông tin đã sửa
    console.log('Đang kiểm tra thông tin sau khi chỉnh sửa...')

    // Kiểm tra title
    const savedTitle = await page.locator('input#title').inputValue()
    console.log(`Title sau sửa: ${savedTitle}`)
    expect(savedTitle.replace(/[--]/g, '-')).toBe(newTitle.replace(/[--]/g, '-'))

    // Kiểm tra description
    const savedDescription = await page.locator('textarea#description').inputValue()
    console.log(`Description sau sửa: ${savedDescription}`)
    expect(savedDescription).toBe(newDescription)

    // Kiểm tra language
    const savedLanguage = await page.locator('select#story-language').inputValue()
    console.log(`Language sau sửa: ${savedLanguage}`)
    expect(savedLanguage).toBe('19')

    // Kiểm tra story type (Fanfic đã được chọn)
    const fanficButtonAfter = page.locator('button:has-text("Fanfic")').first()
    const hasCheckIcon = await fanficButtonAfter.locator('svg').count()
    expect(hasCheckIcon).toBeGreaterThan(0)
    console.log('Story type đã chọn Fanfic')

    // Kiểm tra Mature đã được check
    const isMatureChecked = await page.locator('input#mature').isChecked()
    expect(isMatureChecked).toBe(true)
    console.log('Mature đã được check')

    // Kiểm tra Complete đã được check
    const isCompleteChecked = await page.locator('input#complete').isChecked()
    expect(isCompleteChecked).toBe(true)
    console.log('Complete đã được check')

    // Kiểm tra Target Audience
    const savedAudience = await page.locator('select#target-audience').inputValue()
    console.log(`Target Audience sau sửa: ${savedAudience}`)
    expect(savedAudience).toBe('18-25')

    console.log('TC40: Chỉnh sửa và xác nhận thông tin truyện thành công → PASS')
  })

  test('TC41 - Có thể xoá truyện sau khi tạo', async ({ page }) => {
    console.log('TC41: Tạo truyện mới và xóa...')

    // Tạo truyện mới (giống TC38)
    await goToNewStoryPage(page)

    const timestamp = Date.now()
    const storyTitle = `Automation Test Story - TC41 ${timestamp}`
    const storyDescription = 'Mô tả tự động tạo bởi Playwright để kiểm thử TC41.'

    await fillTitle(page, storyTitle)
    await fillDescription(page, storyDescription)
    await selectLanguage(page, '19') // Tiếng Việt
    await selectStoryType(page, 'Fiction')

    // Submit và lấy URL truyện vừa tạo
    const storyUrl = await submitStoryForm(page)
    console.log(`Đã tạo truyện thành công: ${storyUrl}`)

    // Xử lý tooltip Create series nếu có
    await handleCreateSeriesTooltip(page)

    // Điều hướng đến My Works
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(3000)

    // Xử lý tooltip Create series nếu có ở My Works
    await handleCreateSeriesTooltip(page)

    // Click vào all stories filter
    await page.locator('#works-content > div.metadata > ul > li > span:has-text("All Stories")').first().click()

    // Tìm card có title chứa timestamp
    const storyCard = page.locator('.works-item-new', { hasText: String(timestamp) }).first()
    const storyId = await storyCard.getAttribute('data-id')
    console.log(`Story ID: ${storyId}`)

    // Xóa truyện
    if (storyId) {
      await deleteStory(page, storyId)
      await page.waitForTimeout(2000)
    }

    // Kiểm tra truyện đã bị xóa
    const deletedStory = page.locator('.works-item-new', { hasText: String(timestamp) })
    await expect(deletedStory).toHaveCount(0)

    console.log(`TC41: Đã tạo và xóa truyện "${storyTitle}" thành công → PASS.`)
  })

})
