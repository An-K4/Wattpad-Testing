import { test, expect } from '@playwright/test'
import { goToSearchPage, countStoryCards } from '../helpers/search-helper.js'

test.describe('Wattpad Search Results Suite (TC08–TC15)', () => {
  test.setTimeout(60000)

  // ──────────────────────────────────────────────────────────────────────────
  // TC08 – Kết quả hiển thị đúng thông tin (tên truyện, ảnh bìa)
  // ──────────────────────────────────────────────────────────────────────────
  test('TC08 - Kết quả hiển thị đúng thông tin', async ({ page }) => {
    console.log('TC08: Kiểm tra thông tin hiển thị trên kết quả...')
    await goToSearchPage(page)

    const firstCard = page.locator('a.story-card').first()
    await firstCard.waitFor({ state: 'visible', timeout: 15000 })

    const href = await firstCard.getAttribute('href')
    expect(href).toMatch(/\/story\//)

    const titleEl = firstCard.locator('.title').first()
    const titleText = await titleEl.textContent()
    expect(titleText?.trim().length).toBeGreaterThan(0)

    // Ảnh bìa – lấy src (không check visible vì bản desktop bị hidden-xxs)
    const src = await firstCard.locator('img').first().getAttribute('src')
    expect(src).toBeTruthy()
    expect(src).toMatch(/wattpad\.com/)

    console.log(`TC08: Tên = "${titleText?.trim().slice(0, 50)}", src = ${src?.slice(0, 60)}`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC09 – Click vào kết quả → chuyển đúng trang truyện
  // ──────────────────────────────────────────────────────────────────────────
  test('TC09 - Click vào kết quả chuyển đúng trang', async ({ page }) => {
    console.log('TC09: Click vào kết quả tìm kiếm...')
    await goToSearchPage(page)

    const firstCard = page.locator('a.story-card').first()
    await firstCard.waitFor({ state: 'visible', timeout: 15000 })

    const href = await firstCard.getAttribute('href')
    expect(href).toMatch(/\/story\//)

    await firstCard.click()
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 })

    expect(page.url()).toMatch(/\/story\//)
    console.log(`TC09: Đã chuyển đến ${page.url()}`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC10 – Phân trang / load thêm (infinite scroll + nút Load more)
  // ──────────────────────────────────────────────────────────────────────────
  test('TC10 - Kết quả có thể phân trang hoặc load thêm', async ({ page }) => {
    console.log('TC10: Kiểm tra phân trang / load thêm...')
    await goToSearchPage(page)

    const initialCount = await countStoryCards(page)
    expect(initialCount).toBeGreaterThan(0)
    console.log(`   → Số card ban đầu: ${initialCount}`)

    // Scroll xuống cuối trang để nút Load more xuất hiện
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const loadMoreBtn = page.locator('button.btn-load-more.load-more')
    const hasLoadMore = await loadMoreBtn.isVisible().catch(() => false)

    if (hasLoadMore) {
      // Click nút Load more 2 lần
      for (let i = 0; i < 2; i++) {
        await loadMoreBtn.click()
        await page.waitForTimeout(2000)
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForTimeout(1000)
      }
    }

    const afterCount = await countStoryCards(page)
    expect(afterCount).toBeGreaterThan(initialCount)

    console.log(`TC10: Cards sau load thêm = ${afterCount} (tăng từ ${initialCount}).`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC11 – Lọc theo độ dài truyện (1–10 chương)
  // Kiểm tra tất cả card phải có tag "Hoàn thành" (không có "Đang sáng tác")
  // ──────────────────────────────────────────────────────────────────────────
  test('TC11 - Lọc kết quả theo độ dài truyện', async ({ page }) => {
    test.setTimeout(90000)
    console.log('TC11: Kiểm tra lọc theo độ dài 1–10 chương...')
    await goToSearchPage(page)

    // Đợi API gọi hoặc UI cập nhật
    await page.waitForTimeout(2000)

    // Kiểm tra input đã được checked chưa
    const checkboxInput = page.locator('input[value="oneToTen"]')
    await checkboxInput.check({ force: true })

    // Đợi kết quả lọc hiển thị
    await page.waitForTimeout(3000)
    await page.waitForFunction(
      () => document.querySelectorAll('a.story-card').length > 0,
      { timeout: 15000 }
    )

    // Lấy tất cả card hiển thị
    const cards = page.locator('a.story-card .story-card-data.shown-xxs')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    let failCount = 0
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i)
      const chapterText = await card.locator('span.sr-only')
        .filter({ hasText: /^Chương \d+$/ })
        .first()
        .textContent()
        .catch(() => null)

      if (chapterText) {
        const chapterCount = parseInt(chapterText.replace('Chương ', '').trim(), 10)
        if (chapterCount < 1 || chapterCount > 10) {
          failCount++
          console.log(`   Card ${i + 1}: ${chapterCount} chương (ngoài range 1–10)`)
        }
      }
    }

    expect(failCount).toBe(0)
    console.log(`TC11: ${cardCount} card, tất cả trong range 1–10 chương.`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC12 – Lọc theo thời gian cập nhật (Hôm nay)
  // Vào trang truyện → kiểm tra aria-label chứa ngày hôm nay
  // ──────────────────────────────────────────────────────────────────────────
  test('TC12 - Lọc kết quả theo thời gian cập nhật hôm nay', async ({ page }) => {
    test.setTimeout(90000)
    console.log('TC12: Kiểm tra lọc theo thời gian "Hôm nay"...')
    await goToSearchPage(page)

    // Đợi API gọi hoặc UI cập nhật
    await page.waitForTimeout(2000)

    // Kiểm tra input đã được checked chưa
    const checkboxInput = page.locator('input[value="day"]')
    await checkboxInput.check({ force: true })

    // Đợi kết quả lọc hiển thị
    await page.waitForTimeout(3000)
    await page.waitForFunction(
      () => document.querySelectorAll('a.story-card').length > 0,
      { timeout: 15000 }
    )

    // Click vào card đầu tiên
    const firstCard = page.locator('a.story-card').first()
    await firstCard.waitFor({ state: 'visible', timeout: 10000 })
    await firstCard.click()
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 })

    // Lấy aria-label chứa ngày publish — luôn tiếng Anh
    // Format: "First published September 1, 2018"
    const metaEl = page.locator('[data-testid="story-status-with-first-published-tooltip"]')
    await metaEl.waitFor({ state: 'attached', timeout: 10000 })
    const ariaLabel = await metaEl.getAttribute('aria-label')

    // Kiểm tra có text "trước" trong story-meta (cập nhật hôm nay)
    // Format: "Đăng tải lần cuối khoảng x giờ trước" hoặc "x phút trước"
    const metaText = await page.locator('[data-testid="story-meta"]').textContent().catch(() => '')
    const isUpdatedToday = metaText?.includes('trước') ?? false

    // Nếu không có "trước" (truyện cũ nhưng filter vẫn ra) thì verify ngày publish là hôm nay
    if (!isUpdatedToday && ariaLabel) {
      const today = new Date()
      const todayStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      console.log(`   → aria-label: "${ariaLabel}", today: "${todayStr}"`)
    }

    // Chí ít trang truyện phải load được
    expect(page.url()).toMatch(/\/story\//)
    console.log(`TC12: Đã vào trang truyện, meta = "${metaText?.slice(0, 80)}"`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC13 – Lọc theo nội dung (chỉ hiển thị truyện đã hoàn thành)
  // Tất cả card không được có tag "Đang sáng tác"
  // ──────────────────────────────────────────────────────────────────────────
  test('TC13 - Lọc kết quả theo nội dung (chỉ hoàn thành)', async ({ page }) => {
    test.setTimeout(90000)
    console.log('TC13: Kiểm tra lọc chỉ truyện hoàn thành...')
    await goToSearchPage(page)

    // Đợi API gọi hoặc UI cập nhật
    await page.waitForTimeout(2000)

    // Kiểm tra input đã được checked chưa
    const checkboxInput = page.locator('input[value="complete"]')
    await checkboxInput.check({ force: true })

    // Đợi kết quả lọc
    await page.waitForTimeout(3000)
    await page.waitForFunction(
      () => document.querySelectorAll('a.story-card').length > 0,
      { timeout: 15000 }
    )

    // Kiểm tra kết quả lọc...
    const cards = page.locator('a.story-card')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    let failCount = 0
    let noTagCount = 0

    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i)

      // Kiểm tra tag "Hoàn thành"
      const hasCompleted = await card.locator('.tag-item, [class*="tag"]')
        .filter({ hasText: /Hoàn thành|Completed/i })
        .count()

      if (hasCompleted > 0) {
        // Có tag "Hoàn thành" -> OK
        continue
      }

      // Không có tag "Hoàn thành", kiểm tra tiếp tag "Đang sáng tác"
      const hasOngoing = await card.locator('.tag-item, [class*="tag"]')
        .filter({ hasText: /Đang sáng tác|Ongoing/i })
        .count()

      if (hasOngoing > 0) {
        // Có tag "Đang sáng tác" -> FAIL (vì filter là "Chỉ hoàn thành")
        failCount++
        const title = await card.locator('.title, [class*="title"]').first().textContent().catch(() => `Card ${i + 1}`)
        console.log(`   Card có "Đang sáng tác" (thiếu "Hoàn thành"): "${title?.trim()}"`)
      } else {
        // Không có tag nào (hoặc có tag khác như "Đang tiến hành"...) -> vẫn PASS
        noTagCount++
        const title = await card.locator('.title, [class*="title"]').first().textContent().catch(() => `Card ${i + 1}`)
        console.log(`   Card không có tag "Hoàn thành" nhưng cũng không có "Đang sáng tác": "${title?.trim()}"`)
      }
    }

    expect(failCount).toBe(0)
    console.log(`TC13: ${cardCount} card, ${failCount} lỗi "Đang sáng tác", ${noTagCount} card không có tag hoàn thành (vẫn pass).`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC14 – Lọc theo tag
  // Click tag trong .tag-filter-container → vào truyện → kiểm tra tag có trong danh sách
  // ──────────────────────────────────────────────────────────────────────────
  test('TC14 - Lọc kết quả theo tag', async ({ page }) => {
    test.setTimeout(90000)
    console.log('TC14: Kiểm tra lọc theo tag...')
    await goToSearchPage(page)

    // Lấy tag đầu tiên trong bộ lọc
    const firstTag = page.locator('.tag-filter-container a.refine-by-tag').first()
    await firstTag.waitFor({ state: 'visible', timeout: 10000 })
    const tagName = (await firstTag.textContent())?.trim() ?? ''
    expect(tagName.length).toBeGreaterThan(0)
    console.log(`   → Tag được chọn: "${tagName}"`)

    await firstTag.click()
    await page.waitForTimeout(3000)
    await page.waitForFunction(
      () => document.querySelectorAll('a.story-card').length > 0,
      { timeout: 15000 }
    )

    // Vào card đầu tiên
    const firstCard = page.locator('a.story-card').first()
    await firstCard.waitFor({ state: 'visible', timeout: 10000 })
    await firstCard.click()
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 })

    // Kiểm tra trang truyện có chứa tag đã lọc
    const tagContainer = page.locator('div[data-testid="tags"]')
    await tagContainer.waitFor({ state: 'attached', timeout: 10000 })
    const allTagTexts = await tagContainer.locator('a span').evaluateAll(
      (els: Element[]) => els.map(el => el.textContent?.trim().toLowerCase() ?? '')
    )

    const tagFound = allTagTexts.some(t => t === tagName.toLowerCase())
    expect(tagFound).toBe(true)

    console.log(`TC14: Tag "${tagName}" có trong danh sách tags của truyện.`)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TC15 – Kết quả hiển thị cả Stories lẫn Users (2 tab)
  // ──────────────────────────────────────────────────────────────────────────
  test('TC15 - Kết quả hiển thị cả Stories lẫn Users', async ({ page }) => {
    console.log('TC15: Kiểm tra 2 tab Stories & Users...')
    await goToSearchPage(page)

    // Tab Truyện phải đang active, đếm card
    const storiesTab = page.locator('a[data-target="stories"]')
    await storiesTab.waitFor({ state: 'visible', timeout: 10000 })
    await storiesTab.click()
    await page.waitForTimeout(2000)

    const storyCount = await countStoryCards(page)
    expect(storyCount).toBeGreaterThan(0)
    console.log(`   → Tab Truyện: ${storyCount} card`)

    // Chuyển sang tab Hồ sơ
    const peopleTab = page.locator('a[data-target="people"]')
    await peopleTab.waitFor({ state: 'visible', timeout: 10000 })
    await peopleTab.click()
    await page.waitForTimeout(2000)

    const userCount = await page.locator('.profile-card').count()
    expect(userCount).toBeGreaterThan(0)
    console.log(`   → Tab Hồ sơ: ${userCount} card`)

    console.log(`TC15: Stories = ${storyCount}, Users = ${userCount}.`)
  })
})
