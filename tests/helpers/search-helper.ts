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
