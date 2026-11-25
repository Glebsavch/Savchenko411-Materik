import { expect } from '@playwright/test';
import { BasePage } from './base-page.js';
import { BaseElement } from './base-element.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.trigger = page.locator('a.login.show-pvp-auth-block:visible').first();
    this.form = page.locator('#pvp-sms-auth-block .auth-form.active');
    this.user = new BaseElement(page.locator('#loginForm input[name=USER_LOGIN]:visible'), 'Логин');
    this.pass = new BaseElement(page.locator('#loginForm input[name=USER_PASSWORD]:visible'), 'Пароль');
    this.submit = page.locator('#loginForm button[name=Login]:visible');
    this.error = page.locator('.login-form-error:visible, .phone-auth label.error:visible, #pvp-sms-auth-block label.error:visible').first();
    this.owner = page.locator('input[name=EMAIL][type=email]');
    this.phoneTab = this.form.getByRole('button', { name: 'Телефон', exact: true });
    this.phone = new BaseElement(page.locator('#pvp-sms-auth-phone:visible'), 'Телефон');
    this.requestSms = this.form.getByRole('button', { name: 'Получить код', exact: true });
  }

  async visit(phone = false) {
    await this.open('/shop/stroitelnye-materialy/');
    expect(new URL(this.page.url()).origin, 'Адрес формы входа').toBe('https://www.materik-m.ru');
    await this.trigger.click();
    if (phone) await this.phoneTab.click();
  }

  async fillCredentials(id, password) {
    await this.user.fill(id);
    await this.pass.fill(password);
    await expect(this.pass.locator).toHaveAttribute('type', 'password');
  }

  async enter(id, password) {
    await this.fillCredentials(id, password);
    await this.submit.click();
  }

  async profile(expected) {
    await expect(this.submit).toBeHidden();
    await this.open('/personal/');
    await expect(this.owner).toBeVisible();
    await expect.poll(async () => (await this.owner.inputValue()).toLowerCase() === expected.toLowerCase(), { message: 'Кабинет принадлежит учебной записи' }).toBe(true);
  }

  async requestCode(kind) {
    if (kind === 'shortPhone') await this.phone.fill('123');
    await this.requestSms.click();
  }

  async denied(kind) {
    const phone = /Phone$/.test(kind);
    const message = phone ? /телефон|номер/i : /неверный логин или пароль/i;
    await expect(this.error).toContainText(message);
    await this.open('/personal/');
    await expect(this.owner).toHaveCount(0);
    await expect(this.trigger).toBeVisible();
  }
}
