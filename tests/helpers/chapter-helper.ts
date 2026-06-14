import { type Page } from '@playwright/test'

/**
 * Navigate đến trang tạo chương mới
 */
export async function goToNewChapterPage(page: Page, storyId?: string) {
  if (storyId) {
    await page.goto(`https://www.wattpad.com/myworks/${storyId}/write`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
  } else {
    // Vào My Works và chọn truyện đầu tiên để tạo chương
    await page.goto('https://www.wattpad.com/myworks', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(2000)

    // Đóng dialog "Create series" nếu xuất hiện
    const closeDialogBtn = page.locator('button:has-text("Đã hiểu"), button:has-text("Got it")').first()
    const hasDialog = await closeDialogBtn.isVisible().catch(() => false)

    if (hasDialog) {
      await closeDialogBtn.click()
      await page.waitForTimeout(1000)
    }

    // Đóng tooltip overlay nếu có
    const tooltipOverlay = page.locator('.onboarding-tooltip-overlay').first()
    const hasOverlay = await tooltipOverlay.isVisible().catch(() => false)

    if (hasOverlay) {
      // Click vào overlay hoặc press Escape để đóng
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }

    // Click vào nút "Tiếp tục viết" của truyện đầu tiên
    const continueWriteBtn = page.locator('button:has-text("Tiếp tục viết"), button:has-text("Continue writing")').first()
    const hasBtn = await continueWriteBtn.isVisible().catch(() => false)

    if (hasBtn) {
      await continueWriteBtn.click({ force: true })
      await page.waitForTimeout(2000)

      // Click vào "Chương mới" hoặc "New Chapter" trong dropdown
      const newChapterBtn = page.locator('button:has-text("New Part"), button:has-text("Chương mới")').first()
      await newChapterBtn.click()
      await page.waitForTimeout(3000)
    } else {
      // Nếu không có nút "Tiếp tục viết", click vào truyện đầu tiên
      const firstStory = page.locator('a[href*="/myworks/"]').first()
      await firstStory.click()
      await page.waitForTimeout(2000)
    }
  }
}

/**
 * Điền form tạo chương
 */
export async function fillChapterForm(page: Page, data: {
  title?: string
  content?: string
}) {
  if (data.title !== undefined) {
    const titleInput = page.locator('#story-title').first()
    await titleInput.fill(data.title)
  }

  if (data.content !== undefined) {
    // Editor có thể là textarea hoặc contenteditable
    const editor = page.locator('.story-editor').first()
    await editor.click()
    await editor.fill(data.content)
  }
}

/**
 * Format text trong editor
 */
export async function formatText(page: Page, format: 'bold' | 'italic' | 'underline' | 'align-left' | 'align-center' | 'align-right') {
  const formatButtons: Record<string, string> = {
    'bold': '#medium-editor-toolbar-actions1 > li:nth-child(1) > button',
    'italic': '#medium-editor-toolbar-actions1 > li:nth-child(2) > button',
    'underline': '#medium-editor-toolbar-actions1 > li:nth-child(3) > button',
    'align-left': '#medium-editor-toolbar-actions1 > li:nth-child(4) > button',
    'align-center': '#medium-editor-toolbar-actions1 > li:nth-child(5) > button',
    'align-right': '#medium-editor-toolbar-actions1 > li:nth-child(6) > button'
  }

  const selector = formatButtons[format]
  if (!selector) {
    throw new Error(`Unknown format: ${format}`)
  }

  const button = page.locator(selector).first()
  await button.click()
  await page.waitForTimeout(500)
}

/**
 * Lưu chương dưới dạng Draft
 */
export async function saveDraft(page: Page) {
  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Lưu")').first()
  await saveBtn.click()
  await page.waitForTimeout(2000)
}

/**
 * Publish chương
 */
export async function publishChapter(page: Page) {
  await page.waitForTimeout(5000)
  const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Đăng tải")').first()
  await publishBtn.click()
  await page.waitForTimeout(2000)

  // Kiểm tra có redirect đến Story Details không
  const currentURL = page.url()

  if (currentURL.includes('/publish')) {
    // Trường hợp 1: Cần điền Story Details (lần đầu publish)
    const storyDetailsTab = page.locator('#tab-details').first()
    const isDetailsPage = await storyDetailsTab.isVisible().catch(() => false)

    if (isDetailsPage) {
      // Điền Title
      const titleInput = page.locator('#title').first()
      const hasTitle = await titleInput.inputValue()
      if (!hasTitle || hasTitle === 'Untitled Story') {
        await titleInput.fill('Test Story - ' + Date.now())
      }

      // Điền Description
      const descInput = page.locator('#description').first()
      const hasDesc = await descInput.inputValue()
      if (!hasDesc) {
        await descInput.fill('Đây là mô tả truyện test.')
      }

      // Chọn Story type (Fiction) và genres
      const fictionBtn = page.locator('button:has-text("Fiction")').first()
      const hasFictionBtn = await fictionBtn.isVisible().catch(() => false)
      if (hasFictionBtn) {
        await fictionBtn.click()
        await page.waitForTimeout(2000)

        const genreComboboxes = page.locator('[role="combobox"][id="fiction-type-combobox-trigger"]')
        const genreCount = await genreComboboxes.count()

        for (let i = 0; i < Math.min(3, genreCount); i++) {
          const combobox = genreComboboxes.nth(i)
          await combobox.click()
          await page.waitForTimeout(500)

          const firstOption = page.locator('[role="option"]').first()
          const hasOption = await firstOption.isVisible().catch(() => false)
          if (hasOption) {
            await firstOption.click()
            await page.waitForTimeout(500)
          }
        }
      }

      // Điền Tags
      const tagsInput = page.locator('#tags').first()
      const hasTags = await tagsInput.inputValue()
      if (!hasTags) {
        await tagsInput.fill('test story')
      }

      // Click Save & Publish
      const finalPublishBtn = page.locator('button:has-text("Save & Publish"), button:has-text("Lưu & Đăng Tải")').first()
      await finalPublishBtn.click()
      await page.waitForTimeout(2000)
    }
  }

  // Trường hợp 2: Xử lý modal "Publish your part" (luôn xuất hiện)
  const publishModal = page.locator('h2:has-text("Đăng phần truyện của bạn"), h2:has-text("Publish your part")').first()
  const hasModal = await publishModal.isVisible({ timeout: 5000 }).catch(() => false)

  if (hasModal) {
    // Đợi modal render xong
    await page.waitForTimeout(1000)

    // Tìm tất cả button "Đăng tải" và click cái cuối cùng với force
    const allPublishBtns = page.locator('button:has-text("Đăng tải")')
    const count = await allPublishBtns.count()
    console.log(`Tìm thấy ${count} button Đăng tải`)

    if (count > 0) {
      await allPublishBtns.nth(count - 1).click({ force: true })
      await page.waitForTimeout(3000)
    }
  }
}

/**
 * Schedule publish chương (đặt lịch đăng tải)
 */
export async function schedulePublishChapter(page: Page) {
  const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Đăng tải")').first()
  await publishBtn.click()
  await page.waitForTimeout(2000)

  // Kiểm tra có redirect đến Story Details không
  const currentURL = page.url()

  if (currentURL.includes('/publish')) {
    // Trường hợp lần đầu - cần điền Story Details trước
    const storyDetailsTab = page.locator('#tab-details').first()
    const isDetailsPage = await storyDetailsTab.isVisible().catch(() => false)

    if (isDetailsPage) {
      // Điền các thông tin bắt buộc (giống publishChapter)
      const titleInput = page.locator('#title').first()
      const hasTitle = await titleInput.inputValue()
      if (!hasTitle || hasTitle === 'Untitled Story') {
        await titleInput.fill('Test Story - ' + Date.now())
      }

      const descInput = page.locator('#description').first()
      const hasDesc = await descInput.inputValue()
      if (!hasDesc) {
        await descInput.fill('Đây là mô tả truyện test.')
      }

      const fictionBtn = page.locator('button:has-text("Fiction")').first()
      const hasFictionBtn = await fictionBtn.isVisible().catch(() => false)
      if (hasFictionBtn) {
        await fictionBtn.click()
        await page.waitForTimeout(2000)

        const genreComboboxes = page.locator('[role="combobox"][id="fiction-type-combobox-trigger"]')
        const genreCount = await genreComboboxes.count()

        for (let i = 0; i < Math.min(3, genreCount); i++) {
          const combobox = genreComboboxes.nth(i)
          await combobox.click()
          await page.waitForTimeout(500)

          const firstOption = page.locator('[role="option"]').first()
          const hasOption = await firstOption.isVisible().catch(() => false)
          if (hasOption) {
            await firstOption.click()
            await page.waitForTimeout(500)
          }
        }
      }

      const tagsInput = page.locator('#tags').first()
      const hasTags = await tagsInput.inputValue()
      if (!hasTags) {
        await tagsInput.fill('test story')
      }

      const finalPublishBtn = page.locator('button:has-text("Save & Publish"), button:has-text("Lưu & Đăng Tải")').first()
      await finalPublishBtn.click()
      await page.waitForTimeout(2000)
    }
  }

  // Xử lý modal "Publish your part" - chọn Schedule
  const publishModal = page.locator('h2:has-text("Đăng phần truyện của bạn"), h2:has-text("Publish your part")').first()
  const hasModal = await publishModal.isVisible({ timeout: 5000 }).catch(() => false)

  if (hasModal) {
    await page.waitForTimeout(1000)

    // Chọn radio "Lên lịch đăng tải sau"
    const scheduleRadio = page.locator('input[type="radio"][value="1"]').first()
    await scheduleRadio.check()
    await page.waitForTimeout(1000)

    // Chọn ngày tương lai (ngày mai)
    const dateInput = page.locator('input[type="date"]').first()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0] || '' // Format: YYYY-MM-DD
    await dateInput.fill(tomorrowStr)
    await page.waitForTimeout(500)

    // Chọn thời gian (chọn option đầu tiên không disabled)
    const timeSelect = page.locator('.time-form-field').first()
    await timeSelect.selectOption({ index: 1 })
    await page.waitForTimeout(500)

    // Tick checkbox xác nhận
    const confirmCheckbox = page.locator('.schedule-confirm button.react-checkbox').first()
    await confirmCheckbox.click()
    await page.waitForTimeout(500)

    // Click nút "Lên lịch"
    const scheduleBtn = page.locator('button:has-text("Lên lịch")').first()
    await scheduleBtn.click()
    await page.waitForTimeout(3000)
  }
}

/**
 * Kiểm tra auto-save đã hoạt động
 */
export async function checkAutoSave(page: Page): Promise<boolean> {
  // Kiểm tra có text "Đã lưu" hoặc save indicator không còn "Đang lưu"
  const savedIndicator = page.locator('.save-indicator:not(:has-text("Đang lưu"))').first()
  const isVisible = await savedIndicator.isVisible().catch(() => false)

  if (!isVisible) return false

  // Đảm bảo không còn text "Đang lưu"
  const text = await savedIndicator.textContent()
  return text !== null && !text.includes('Đang lưu')
}

/**
 * Kiểm tra có thông báo lỗi
 */
export async function hasChapterError(page: Page): Promise<boolean> {
  const errorLocator = page.locator('.error, .error-msg, [class*="error"], [role="alert"], .save-indicator, .warning').first()
  return await errorLocator.isVisible().catch(() => false)
}

/**
 * Lấy nội dung editor
 */
export async function getEditorContent(page: Page): Promise<string> {
  const editor = page.locator('.story-editor').first()
  return await editor.textContent() || await editor.inputValue() || ''
}

/**
 * Điều hướng đến My Works và đóng dialog nếu có
 */
export async function goToMyWorks(page: Page) {
  await page.goto('https://www.wattpad.com/myworks', {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(3000)

  // Đóng dialog "Create series" nếu xuất hiện
  const closeDialogBtn = page.locator('button:has-text("Đã hiểu")').first()
  const hasDialog = await closeDialogBtn.isVisible().catch(() => false)

  if (hasDialog) {
    await closeDialogBtn.click()
    await page.waitForTimeout(1000)
  }
}

/**
 * Tìm và mở editor của chương đã publish
 */
export async function editPublishedChapter(page: Page) {
  // Click vào truyện đầu tiên
  const firstStory = page.locator('a[href*="/myworks/"]').first()
  await firstStory.click()
  await page.waitForTimeout(3000)

  // Tìm story-part có class published và text "Đã đăng tải"
  const publishedChapter = page.locator('.story-part').filter({ hasText: 'Đã đăng tải' }).first()
  const hasPublished = await publishedChapter.isVisible().catch(() => false)

  if (!hasPublished) {
    throw new Error('Không tìm thấy chapter đã đăng tải')
  }

  // Click vào link có href chứa /write/ để mở editor
  const editLink = publishedChapter.locator('a[href*="/write/"]').first()
  await editLink.click()
  await page.waitForTimeout(3000)
}

/**
 * Publish lại các thay đổi của chương đã edit
 */
export async function publishChanges(page: Page) {
  const publishChangesBtn = page.locator('button:has-text("Đăng các thay đổi"), button:has-text("Publish Changes")').first()
  await publishChangesBtn.click()
  await page.waitForTimeout(3000)
}
