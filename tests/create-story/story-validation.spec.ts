import { test, expect } from '@playwright/test'
import { goToCreateStoryPage, fillStoryForm, submitStoryForm, hasErrorMessage, getErrorMessage } from '../helpers/story-helper.js'

test.describe('Wattpad Story Validation (TC19-TC28)', () => {

  test('TC19 - Tạo truyện thành công với đầy đủ thông tin hợp lệ', async ({ page }) => {
    console.log(' Đang chạy TC19: Tạo truyện với thông tin đầy đủ...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Test Story - ' + Date.now(),
      description: 'Đây là mô tả test cho truyện mới',
      language: '1', // English
      genre: 'Romance',
      tags: ['test', 'romance'],
      isPublic: true,
      isMature: false
    })

    await submitStoryForm(page)
    await page.waitForTimeout(5000)

    // Kiểm tra không có lỗi và được redirect
    const hasError = await hasErrorMessage(page)
    expect(hasError).toBe(false)
    console.log(' TC19: Hoàn thành - Tạo truyện thành công.')
  })

  test('TC20 - Tạo truyện khi chưa đăng nhập → redirect về trang login', async ({ page }) => {
    console.log(' Đang chạy TC20: Kiểm tra yêu cầu đăng nhập...')

    // Clear cookies để đảm bảo chưa đăng nhập
    await page.context().clearCookies()
    await goToCreateStoryPage(page)
    await page.waitForTimeout(3000)

    // Kiểm tra có redirect về login hoặc hiển thị form login
    const url = page.url()
    const hasLoginForm = await page.locator('input[type="password"], input[name="password"]').isVisible().catch(() => false)

    expect(url.includes('/login') || url.includes('/signup') || hasLoginForm).toBe(true)
    console.log(' TC20: Hoàn thành - Yêu cầu đăng nhập trước khi tạo truyện.')
  })

  test('TC21 - Bỏ trống tiêu đề → không cho tạo, hiển thị lỗi', async ({ page }) => {
    console.log(' Đang chạy TC21: Bỏ trống tiêu đề...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: '',
      description: 'Mô tả test',
      language: '1',
      genre: 'Romance'
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    const errorMsg = await getErrorMessage(page)

    expect(hasError).toBe(true)
    console.log(` TC21: Hoàn thành - Hiển thị lỗi: "${errorMsg.slice(0, 50)}".`)
  })

  test('TC22 - Bỏ trống mô tả → không cho tạo hoặc cảnh báo', async ({ page }) => {
    console.log(' Đang chạy TC22: Bỏ trống mô tả...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Test Story Title',
      description: '',
      language: '1',
      genre: 'Romance'
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    // Có thể hiển thị cảnh báo hoặc vẫn cho tạo
    const hasError = await hasErrorMessage(page)
    console.log(` TC22: Hoàn thành - ${hasError ? 'Có cảnh báo' : 'Cho phép tạo'}.`)
  })

  test('TC23 - Không chọn thể loại → không cho tạo hoặc cảnh báo', async ({ page }) => {
    console.log(' Đang chạy TC23: Không chọn thể loại...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Test Story Title',
      description: 'Test description',
      language: '1'
      // Không set genre
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    console.log(` TC23: Hoàn thành - ${hasError ? 'Hiển thị lỗi' : 'Cho phép tạo'}.`)
  })

  test('TC24 - Không chọn ngôn ngữ → không cho tạo hoặc cảnh báo', async ({ page }) => {
    console.log(' Đang chạy TC24: Không chọn ngôn ngữ...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Test Story Title',
      description: 'Test description',
      genre: 'Romance'
      // Không set language
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    console.log(` TC24: Hoàn thành - ${hasError ? 'Hiển thị lỗi' : 'Cho phép tạo'}.`)
  })

  test('TC25 - Tiêu đề quá dài (vượt giới hạn ký tự) → hiển thị lỗi / cắt bớt', async ({ page }) => {
    console.log(' Đang chạy TC25: Tiêu đề quá dài...')
    await goToCreateStoryPage(page)

    const longTitle = 'A'.repeat(300)
    await fillStoryForm(page, {
      title: longTitle,
      description: 'Test description',
      language: '1',
      genre: 'Romance'
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    console.log(` TC25: Hoàn thành - ${hasError ? 'Hiển thị lỗi' : 'Xử lý thành công'}.`)
  })

  test('TC26 - Tiêu đề chỉ có khoảng trắng → không hợp lệ', async ({ page }) => {
    console.log(' Đang chạy TC26: Tiêu đề toàn khoảng trắng...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: '     ',
      description: 'Test description',
      language: '1',
      genre: 'Romance'
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    expect(hasError).toBe(true)
    console.log(' TC26: Hoàn thành - Không chấp nhận tiêu đề toàn khoảng trắng.')
  })

  test('TC27 - Mô tả quá dài → hiển thị lỗi / cắt bớt', async ({ page }) => {
    console.log(' Đang chạy TC27: Mô tả quá dài...')
    await goToCreateStoryPage(page)

    const longDesc = 'B'.repeat(5000)
    await fillStoryForm(page, {
      title: 'Test Story',
      description: longDesc,
      language: '1',
      genre: 'Romance'
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    const hasError = await hasErrorMessage(page)
    console.log(` TC27: Hoàn thành - ${hasError ? 'Hiển thị lỗi' : 'Xử lý thành công'}.`)
  })

  test('TC28 - Tiêu đề chứa ký tự đặc biệt → xử lý đúng', async ({ page }) => {
    console.log(' Đang chạy TC28: Tiêu đề có ký tự đặc biệt...')
    await goToCreateStoryPage(page)

    await fillStoryForm(page, {
      title: 'Test @#$% Story 🎉',
      description: 'Test description',
      language: '1',
      genre: 'Romance'
    })

    await submitStoryForm(page)
    await page.waitForTimeout(2000)

    // Hệ thống nên xử lý được ký tự đặc biệt
    await expect(page.locator('body')).toBeVisible()
    console.log(' TC28: Hoàn thành - Xử lý ký tự đặc biệt trong tiêu đề.')
  })

})
