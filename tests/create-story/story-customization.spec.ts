import { test, expect } from '@playwright/test'
import {
  goToNewStoryPage,
  fillTitle,
  fillDescription,
  submitStoryForm,
  isWriterPage,
  uploadCover,
  getCoverPreview,
  toggleMature,
  isMatureChecked,
  addTag,
  getTagsValue
  // extractStoryId,
  // deleteStory,
} from '../helpers/story-helper.js'

test.describe('Wattpad - Tuỳ chỉnh truyện (TC29-TC34)', () => {

  test.describe.configure({ mode: 'serial' })
  test.setTimeout(90000)

  // ── TC29 ─────────────────────────────────────────────────────────────────
  test('TC29 - Upload ảnh bìa đúng định dạng (JPG/PNG) → hiển thị preview', async ({ page }) => {
    console.log('TC29: Upload ảnh bìa hợp lệ...')

    await goToNewStoryPage(page)

    // DEBUG: Kiểm tra trạng thái trước khi upload
    const beforeUpload = await page.locator('[data-testid="cover"] img').count()
    console.log(`Số lượng img trước upload: ${beforeUpload}`)

    // Upload cover với debug
    await uploadCover(page, 'tests/fixtures/test-cover.jpg')

    // DEBUG: Chờ và kiểm tra sau upload
    await page.waitForTimeout(3000)
    const afterUpload = await page.locator('[data-testid="cover"] img').count()
    console.log(`Số lượng img sau upload: ${afterUpload}`)

    // Chụp ảnh màn hình để xem trạng thái
    await page.screenshot({ path: 'test-results/after-upload.png' })

    const preview = getCoverPreview(page)
    await preview.waitFor({ state: 'visible', timeout: 15000 })

    const src = await preview.getAttribute('src')
    console.log(`Số lượng img sau upload: ${afterUpload}`)

    expect(src).toMatch(/^data:image\//)
    console.log('TC29: Ảnh bìa hợp lệ hiển thị preview → PASS.')
  })

  // ── TC30 ─────────────────────────────────────────────────────────────────
  test('TC30 - Upload ảnh bìa sai định dạng (PDF) → bị chặn lặng lẽ, vẫn tạo được truyện', async ({ page }) => {
    console.log('TC30: Upload file PDF làm ảnh bìa...')

    await goToNewStoryPage(page)

    // input có accept="image/jpeg, image/png, image/gif" nhưng Playwright
    // vẫn set được file PDF trực tiếp (bypass dialog OS)
    await uploadCover(page, 'tests/fixtures/test-file.pdf')
    await page.waitForTimeout(2000)

    // Behavior thực tế: Wattpad không upload, không hiện lỗi, preview KHÔNG xuất hiện
    const preview = getCoverPreview(page)
    const hasPreview = await preview.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`TC30: Preview ảnh xuất hiện: ${hasPreview} (kỳ vọng: false)`)
    expect(hasPreview).toBe(false)

    // Vẫn tạo truyện được bình thường, Wattpad dùng ảnh đại diện làm cover mặc định
    await fillTitle(page, 'TC30 - Test cover sai định dạng')
    await fillDescription(page, 'Mô tả test TC30.')

    const url = await submitStoryForm(page)
    console.log(`TC30: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC30: Upload PDF bị chặn lặng lẽ, vẫn tạo truyện thành công → PASS.')

    // const storyId = extractStoryId(url)
    // if (storyId) await deleteStory(page, storyId)
  })

  // ── TC31 ─────────────────────────────────────────────────────────────────
  test('TC31 - Upload ảnh bìa quá dung lượng (100MB) → trang bị treo/crash khi lưu', async ({ page }) => {
    console.log('TC31: Upload ảnh bìa 100MB...')

    // Test này document một BUG đã biết: trang bị crash/đứng khi save với ảnh quá lớn.
    // Đánh dấu expected fail để không làm đỏ toàn bộ suite, nhưng vẫn hiện rõ trong report.
    test.fail()

    await goToNewStoryPage(page)
    await uploadCover(page, 'tests/fixtures/large-image.jpg')

    await fillTitle(page, 'TC31 - Test cover quá dung lượng')
    await fillDescription(page, 'Mô tả test TC31.')

    // Bấm Save & chỉ đợi tối đa 30s. Nếu Wattpad xử lý đúng (báo lỗi dung lượng /
    // không cho upload) thì redirect hoặc thông báo lỗi sẽ xuất hiện sớm.
    // Nếu trang bị treo (bug thực tế), waitForURL sẽ timeout → test fail (đúng như mong đợi).
    const saveBtn = page.locator('header button:has-text("Save")').first()
    await saveBtn.click({ force: true })

    await page.waitForURL(/\/myworks\/\d+\/write\/\d+/, { timeout: 30000 })

    console.log('TC31: Wattpad xử lý được ảnh lớn mà không crash (bug đã fix?).')
  })

  // ── TC32 ─────────────────────────────────────────────────────────────────
  test('TC32 - Chọn truyện là Mature → toggle hoạt động đúng', async ({ page }) => {
    console.log('TC32: Bật toggle Mature...')

    await goToNewStoryPage(page)

    // Cuộn đến toggle Mature
    await page.locator('input#mature').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const before = await isMatureChecked(page)
    console.log(`TC32: Trạng thái Mature trước khi bật: ${before}`)
    expect(before).toBe(false)

    await toggleMature(page)
    await page.waitForTimeout(500)

    const after = await isMatureChecked(page)
    console.log(`TC32: Trạng thái Mature sau khi bật: ${after}`)
    expect(after).toBe(true)

    const url = await submitStoryForm(page)
    console.log(`TC32: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC32: Toggle Mature hoạt động, tạo truyện thành công → PASS.')
  })

  // ── TC33 ─────────────────────────────────────────────────────────────────
  test('TC33 - Thêm tag cho truyện → tag hiển thị đúng', async ({ page }) => {
    console.log('TC33: Thêm các tag...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'TC33 - Test thêm tags')
    await fillDescription(page, 'Mô tả test TC33.')

    await addTag(page, 'romance')
    await addTag(page, 'fantasy')

    const tagsValue = await getTagsValue(page)
    console.log(`TC33: Giá trị tags ghi nhận: "${tagsValue}"`)

    expect(tagsValue).toContain('romance')
    expect(tagsValue).toContain('fantasy')
    console.log('TC33: Tags hiển thị đúng → PASS.')
  })

  // ── TC34 ─────────────────────────────────────────────────────────────────
  test('TC34 - Thêm tag trùng lặp → chỉ giữ 1', async ({ page }) => {
    console.log('⏳ TC34: Thêm tag trùng lặp...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'TC34 - Test tag trùng lặp')
    await fillDescription(page, 'Mô tả test TC34.')

    await addTag(page, 'romance')
    await addTag(page, 'romance')
    await addTag(page, 'drama')

    const tagsValue = await getTagsValue(page)
    console.log(`TC34: Giá trị tags ghi nhận: "${tagsValue}"`)

    // Đếm số lần "romance" xuất hiện như một tag riêng biệt (phân tách bởi space)
    const tagList = tagsValue.trim().split(/\s+/).filter(Boolean)
    const romanceCount = tagList.filter(t => t.toLowerCase() === 'romance').length
    console.log(`TC34: Số lần "romance" xuất hiện: ${romanceCount} (kỳ vọng: 1)`)

    expect(romanceCount).toBe(1)
    console.log('TC34: Tag trùng lặp chỉ giữ 1 → PASS.')
  })

  test('TC35 - Thêm quá số lượng tag cho phép → bị giới hạn bởi maxlength=128', async ({ page }) => {
    console.log('TC35: Thêm nhiều tag vượt giới hạn...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'TC35 - Test quá nhiều tags')
    await fillDescription(page, 'Mô tả test TC35.')

    let previousCount = 0
    let stuckCount = 0

    for (let i = 1; i <= 30; i++) {
      const tagName = `tag${i}`

      // Lấy số tag hiện tại
      const currentValue = await getTagsValue(page)
      const currentCount = currentValue.trim().split(/\s+/).filter(Boolean).length

      console.log(`Trước lần ${i}: ${currentCount} tags`)

      // Nếu số tag không đổi so với lần trước
      if (currentCount === previousCount && previousCount > 0) {
        stuckCount++
        console.log(`Tag không tăng (lần ${stuckCount}/3)`)

        if (stuckCount >= 3) {
          console.log(`Đã đạt giới hạn tag ở mức ${currentCount} tags`)
          break
        }
      } else {
        stuckCount = 0
      }

      previousCount = currentCount

      // Thử thêm tag
      const success = await addTag(page, tagName)

      if (!success) {
        console.log(`Không thể thêm tag "${tagName}", dừng lại`)
        break
      }

      await page.waitForTimeout(300)
    }

    const finalTagsValue = await getTagsValue(page)
    const finalTagCount = finalTagsValue.trim().split(/\s+/).filter(Boolean).length

    console.log(`TC35: Số tag cuối cùng: ${finalTagCount}`)

    // Kiểm tra số tag không vượt quá 25 (giới hạn thực tế của Wattpad)
    expect(finalTagCount).toBeLessThanOrEqual(25)

    console.log('TC35: Wattpad tự giới hạn số lượng tag → PASS.')
  })
})
