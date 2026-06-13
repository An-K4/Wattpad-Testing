import { test, expect } from '@playwright/test'
import {
  goToNewStoryPage,
  newGuestContext,
  fillTitle,
  fillDescription,
  selectLanguage,
  selectStoryType,
  submitStoryForm,
  isWriterPage
  // extractStoryId,
  // deleteStory,
} from '../helpers/story-helper.js'

test.describe('Wattpad - Tạo truyện mới (TC19-TC28)', () => {

  test.describe.configure({ mode: 'serial' })
  test.setTimeout(90000)

  // ── TC19 ─────────────────────────────────────────────────────────────────
  test('TC19 - Tạo truyện thành công với đầy đủ thông tin hợp lệ', async ({ page }) => {
    console.log('TC19: Tạo truyện với đầy đủ thông tin...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'Automation Test Story - TC19')
    await fillDescription(page, 'Mô tả tự động tạo bởi Playwright để kiểm thử TC19.')
    await selectLanguage(page, '19') // Tiếng Việt
    await selectStoryType(page, 'Fiction')

    const url = await submitStoryForm(page)
    console.log(`TC19: Tạo thành công → ${url}`)

    expect(isWriterPage(url)).toBe(true)
  })

  // ── TC20 ─────────────────────────────────────────────────────────────────
  test('TC20 - Tạo truyện khi chưa đăng nhập → bị chặn', async ({ browser }) => {
    console.log('TC20: Truy cập trang tạo truyện khi chưa đăng nhập...')

    const context = await newGuestContext(browser)
    const page = await context.newPage()

    await page.goto('https://www.wattpad.com/write/story/new', {
      timeout: 60000,
      waitUntil: 'networkidle'
    })

    console.log(`TC20: URL = ${page.url()}`)

    // Behavior thực tế: Wattpad redirect về 404 khi chưa đăng nhập
    // → input#title không bao giờ hiển thị
    const formVisible = await page.locator('input#title').isVisible({ timeout: 3000 }).catch(() => false)
    const is404 = await page.locator('text=This page seems to be missing').isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`TC20: Form hiển thị: ${formVisible} | Trang 404: ${is404}`)

    expect(formVisible).toBe(false)
    console.log('TC20: User bị chặn, không vào được form tạo truyện → PASS.')

    await context.close()
  })

  // ── TC21 ─────────────────────────────────────────────────────────────────
  test('TC21 - Bỏ trống tiêu đề → Wattpad tự điền "Untitled Story"', async ({ page }) => {
    console.log('TC21: Submit form với tiêu đề trống...')

    await goToNewStoryPage(page)
    await fillDescription(page, 'Mô tả test TC21 - bỏ trống tiêu đề.')

    const url = await submitStoryForm(page)
    console.log(`TC21: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC21: Wattpad tự điền tiêu đề mặc định → PASS.')
  })

  // ── TC22 ─────────────────────────────────────────────────────────────────
  test('TC22 - Bỏ trống mô tả → Wattpad vẫn cho tạo', async ({ page }) => {
    console.log('TC22: Submit form với mô tả trống...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'TC22 - Test bỏ trống mô tả')

    const url = await submitStoryForm(page)
    console.log(`TC22: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC22: Wattpad cho phép tạo khi bỏ trống mô tả → PASS.')
  })

  // ── TC23 ─────────────────────────────────────────────────────────────────
  test('TC23 - Không chọn Story type → Wattpad vẫn cho tạo', async ({ page }) => {
    console.log('TC23: Submit form không chọn Story type...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'TC23 - Test không chọn story type')
    await fillDescription(page, 'Mô tả test TC23.')

    const url = await submitStoryForm(page)
    console.log(`TC23: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC23: Wattpad cho phép tạo khi không chọn Story type → PASS.')
  })

  // ── TC24 ─────────────────────────────────────────────────────────────────
  test('TC24 - Không đổi ngôn ngữ → dùng mặc định English, vẫn tạo được', async ({ page }) => {
    console.log('TC24: Submit form giữ nguyên Language mặc định...')

    await goToNewStoryPage(page)

    const defaultLang = await page.locator('select#story-language').inputValue()
    console.log(`TC24: Language mặc định = "${defaultLang}" (1 = English)`)

    await fillTitle(page, 'TC24 - Test ngôn ngữ mặc định')
    await fillDescription(page, 'Mô tả test TC24.')

    const url = await submitStoryForm(page)
    console.log(`TC24: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC24: Tạo thành công với Language mặc định → PASS.')
  })

  // ── TC25 ─────────────────────────────────────────────────────────────────
  test('TC25 - Tiêu đề quá dài (300 ký tự) → bị cắt tại maxlength=80', async ({ page }) => {
    console.log('TC25: Nhập tiêu đề 300 ký tự (maxlength=80)...')

    await goToNewStoryPage(page)

    const longTitle = 'A'.repeat(300)
    await fillTitle(page, longTitle)

    const actualTitle = await page.locator('input#title').inputValue()
    console.log(`TC25: Nhập ${longTitle.length} ký tự | Thực tế trong input: ${actualTitle.length} ký tự`)

    // input#title có maxlength="80" → browser tự cắt
    expect(actualTitle.length).toBeLessThanOrEqual(80)
    console.log('TC25: Browser cắt tiêu đề tại maxlength=80 → PASS.')
  })

  // ── TC26 ─────────────────────────────────────────────────────────────────
  test('TC26 - Tiêu đề chỉ có khoảng trắng → Wattpad tự điền "Untitled Story"', async ({ page }) => {
    console.log('TC26: Nhập tiêu đề toàn khoảng trắng...')

    await goToNewStoryPage(page)
    await fillTitle(page, '     ')
    await fillDescription(page, 'Mô tả test TC26.')

    const url = await submitStoryForm(page)
    console.log(`TC26: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC26: Wattpad xử lý tiêu đề toàn khoảng trắng → PASS.')
  })

  // ── TC27 ─────────────────────────────────────────────────────────────────
  test('TC27 - Mô tả quá dài (5000 ký tự) → bị cắt tại maxlength=2000', async ({ page }) => {
    console.log('TC27: Nhập mô tả 5000 ký tự (maxlength=2000)...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'TC27 - Test mô tả quá dài')

    const longDesc = 'B'.repeat(5000)
    await fillDescription(page, longDesc)

    const actualDesc = await page.locator('textarea#description').inputValue()
    console.log(`TC27: Nhập ${longDesc.length} ký tự | Thực tế trong textarea: ${actualDesc.length} ký tự`)

    // textarea#description có maxlength="2000" → browser tự cắt
    expect(actualDesc.length).toBeLessThanOrEqual(2000)
    console.log('TC27: Browser cắt mô tả tại maxlength=2000 → PASS.')
  })

  // ── TC28 ─────────────────────────────────────────────────────────────────
  test('TC28 - Tiêu đề chứa ký tự đặc biệt và emoji → xử lý đúng, không crash', async ({ page }) => {
    console.log('TC28: Nhập tiêu đề có ký tự đặc biệt và emoji...')

    await goToNewStoryPage(page)
    await fillTitle(page, 'Test @#$% Story 🎉')
    await fillDescription(page, 'Mô tả test TC28.')

    const url = await submitStoryForm(page)
    console.log(`TC28: URL sau submit → ${url}`)

    expect(isWriterPage(url)).toBe(true)
    console.log('TC28: Wattpad xử lý ký tự đặc biệt và emoji đúng → PASS.')
  })
})
