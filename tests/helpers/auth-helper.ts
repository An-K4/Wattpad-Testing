import { type Page, type BrowserContext } from '@playwright/test'
import * as fs from 'fs'

const AUTH_FILE = 'auth.json'

/**
 * Kiểm tra xem file auth.json có tồn tại không
 */
export function hasAuthFile(): boolean {
  return fs.existsSync(AUTH_FILE)
}

/**
 * Load authentication state từ file
 */
export async function loadAuth(context: BrowserContext) {
  if (hasAuthFile()) {
    const authData = fs.readFileSync(AUTH_FILE, 'utf-8')
    const parsed = JSON.parse(authData) as { cookies: Array<{
      name: string
      value: string
      domain?: string
      path?: string
      expires?: number
      httpOnly?: boolean
      secure?: boolean
      sameSite?: 'Strict' | 'Lax' | 'None'
    }> }
    await context.addCookies(parsed.cookies)
  }
}

/**
 * Lưu authentication state vào file
 */
export async function saveAuth(context: BrowserContext) {
  const cookies = await context.cookies()
  const authData = { cookies }
  fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2))
}

/**
 * Login vào Wattpad
 */
export async function login(page: Page, username: string, password: string) {
  await page.goto('https://www.wattpad.com/login', {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(2000)

  // Điền username
  const usernameInput = page.locator('input[name="username"], input[type="text"]').first()
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 })
  await usernameInput.fill(username)

  // Điền password
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
  await passwordInput.fill(password)

  // Click login button
  const loginButton = page.locator('button[type="submit"], button:has-text("Log in")').first()
  await loginButton.click()

  // Đợi redirect về trang chủ hoặc dashboard
  await page.waitForTimeout(5000)
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Logout khỏi Wattpad
 */
export async function logout(page: Page) {
  // Click vào avatar/menu
  const avatarMenu = page.locator('[class*="avatar"], [class*="profile-menu"]').first()
  await avatarMenu.click()
  await page.waitForTimeout(1000)

  // Click logout
  const logoutBtn = page.locator('a:has-text("Log out"), button:has-text("Log out")').first()
  await logoutBtn.click()
  await page.waitForTimeout(2000)
}

/**
 * Kiểm tra xem đã đăng nhập chưa
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto('https://www.wattpad.com/', {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(2000)

  // Kiểm tra có avatar/profile menu không
  const avatar = page.locator('[class*="avatar"], [class*="profile"]').first()
  const hasAvatar = await avatar.isVisible().catch(() => false)

  // Hoặc kiểm tra có nút "Log in" không (nếu chưa đăng nhập)
  const loginBtn = page.locator('a:has-text("Log in"), button:has-text("Log in")').first()
  const hasLoginBtn = await loginBtn.isVisible().catch(() => false)

  return hasAvatar || !hasLoginBtn
}

/**
 * Đảm bảo đã đăng nhập (dùng auth.json hoặc login mới)
 */
export async function ensureLoggedIn(page: Page, username?: string, password?: string) {
  const loggedIn = await isLoggedIn(page)

  if (!loggedIn) {
    if (!username || !password) {
      throw new Error('Chưa đăng nhập và không có credentials để login!')
    }
    await login(page, username, password)
  }
}

/**
 * Clear authentication (xóa cookies và file auth)
 */
export async function clearAuth(context: BrowserContext) {
  await context.clearCookies()
  if (hasAuthFile()) {
    fs.unlinkSync(AUTH_FILE)
  }
}
