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

export async function searchByBrowse(page: Page, tagNames: string[]): Promise<string> {
  console.log(`[DEBUG] Bắt đầu tìm kiếm các tag: ${tagNames.join(', ')}`)

  // Click vào nút Browse (discover-dropdown) sử dụng testid
  await page.waitForTimeout(2000)
  await page.getByTestId('discover-dropdown').getByTestId('wp_chevron_down').click()
  console.log('[DEBUG] Đã bấm nút Browse, chờ dropdown hiển thị...')

  await page.waitForTimeout(1500)

  // Chờ dropdown menu hiển thị
  const dropdownMenu = page.locator('#discover-dropdown > div').first()
  await dropdownMenu.waitFor({ state: 'visible', timeout: 5000 })
  console.log('[DEBUG] Dropdown đã hiển thị, đang tìm tag phù hợp...')

  for (const tagName of tagNames) {
    try {
      // Tìm link trong discover-dropdown sử dụng role và name
      const tagLink = page.getByTestId('discover-dropdown').getByRole('link', { name: tagName })
      const isVisible = await tagLink.isVisible().catch(() => false)

      if (isVisible) {
        console.log(`[DEBUG] Tìm thấy tag "${tagName}", đang click...`)
        await tagLink.click()
        return tagName
      }
    } catch (error) {
      console.log(`[DEBUG] Không tìm thấy tag "${tagName}":`, error)
    }
  }

  throw new Error(`Không tìm thấy tag nào trong danh sách: ${tagNames.join(', ')}`)
}
