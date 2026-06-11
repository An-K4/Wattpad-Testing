import { type Page } from '@playwright/test'

/**
 * Navigate đến trang search với query và params tùy chỉnh
 */
export async function goToSearchPage(
  page: Page,
  query = 'romance',
  extraParams = ''
) {
  await page.goto(`https://www.wattpad.com/search/${query}${extraParams}`, {
    timeout: 45000,
    waitUntil: 'domcontentloaded'
  })
  await page.waitForFunction(
    () => document.querySelectorAll('a.story-card').length > 0,
    { timeout: 25000 }
  )
}

/**
 * Navigate đến trang chủ và đợi search box sẵn sàng
 */
export async function goToHomePage(page: Page) {
  await page.goto('https://www.wattpad.com/', {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  })
  const searchBox = page.locator('input[placeholder="Search"]').first()
  await searchBox.waitFor({ state: 'visible', timeout: 20000 })
}

/**
 * Lấy search box element
 */
export function getSearchBox(page: Page) {
  return page.locator('input[placeholder="Search"]').first()
}

/**
 * Thực hiện tìm kiếm từ trang chủ
 */
export async function performSearch(page: Page, keyword: string) {
  const searchBox = getSearchBox(page)
  await searchBox.click()
  await searchBox.fill(keyword)
  await searchBox.press('Enter')
  await page.waitForTimeout(6000)
}

/**
 * Lấy tất cả story cards
 */
export function getStoryCards(page: Page) {
  return page.locator('a.story-card')
}

/**
 * Đếm số lượng story cards hiển thị
 */
export async function countStoryCards(page: Page) {
  return await getStoryCards(page).count()
}

export async function searchByBrowse(page: Page, tagName: string): Promise<void> {
  console.log(`[DEBUG] Bắt đầu kiểm tra với dispatchEvent('click') cho tag: ${tagName}`)

  const buttonSelector = '#discover-dropdown button'
  const menuSelector = '#discover-dropdown .MaVh4'

  try {
    // THAY ĐỔI QUAN TRỌNG: Đợi phần tử tồn tại trong DOM (attached), không quan tâm ẩn hay hiện
    await page.waitForSelector(buttonSelector, { state: 'attached', timeout: 5000 })

    // Gửi mousedown trước để kích hoạt bộ lắng nghe của React
    console.log('[DEBUG] Đang gửi mousedown...')
    await page.dispatchEvent(buttonSelector, 'mousedown')

    // Sau đó gửi click
    console.log('[DEBUG] Đang gửi click...')
    await page.dispatchEvent(buttonSelector, 'click')

    // Chờ 1 giây để giao diện cập nhật trạng thái
    await page.waitForTimeout(1000)

    // Kiểm tra xem dropdown đã mở hay chưa
    const isMenuVisible: boolean = await page.locator(menuSelector).isVisible().catch((): boolean => false)

    const hasTrueClass: boolean = await page.evaluate((): boolean => {
      const container = document.querySelector('#discover-dropdown')
      return container ? container.classList.contains('true') : false
    })

    console.log(`[DEBUG] Trạng thái - Menu hiển thị: ${isMenuVisible} | Container có class 'true': ${hasTrueClass}`)

    // Nếu dropdown mở, thực hiện click vào tag tương ứng
    if (isMenuVisible || hasTrueClass) {
      console.log(`[DEBUG] Dropdown đã mở. Tiến hành click vào tag: ${tagName}`)

      const tagLink = page
        .locator('#discover-dropdown a.c97t-')
        .getByText(tagName, { exact: true })

      // Click với force: true để bỏ qua bước kiểm tra hiển thị của liên kết
      await tagLink.click({ force: true, timeout: 5000 })
      console.log(`[DEBUG] ✅ Hoàn tất tương tác với tag: ${tagName}`)
    } else {
      console.log('[DEBUG] ❌ Dropdown không hiển thị, không thể tiếp tục click tag.')
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`[DEBUG] ❌ Lỗi xảy ra trong searchByBrowse: ${errorMessage}`)
  }
}
