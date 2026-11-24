import { expect } from '@playwright/test';
import { BasePage } from './base-page.js';
import { BaseElement } from './base-element.js';
import { buyer } from '../core/data.js';
import { money } from './shop-page.js';

export class CheckoutPage extends BasePage {
  async verify(expected) {
    const p = this.page;
    const point = p.locator('label.order__points-label-radio').filter({hasText: 'Якорная'});
    await point.locator('.order__points-name').click();
    await expect(point.locator('input')).toBeChecked();
    await new BaseElement(p.locator('#js-person-name'), 'Имя и фамилия').fill(buyer.name);
    const phone = p.locator('#js-person-phone');
    await phone.focus(); await phone.press('ControlOrMeta+A'); await phone.press('Backspace'); await phone.press('Home'); await phone.pressSequentially(buyer.phone.slice(-10));
    expect((await phone.inputValue()).replace(/\D/g,'').slice(-10) === buyer.phone.slice(-10), 'Телефон заполнен по маске').toBe(true);
    const cash = p.locator('#nal_pay_system');
    await cash.click();
    await expect(cash.locator('input')).toBeChecked();
    await expect.poll(async () => money(await p.locator('.order__result .js-total-order-sum').innerText())).toBe(expected);
    await expect(p.locator('.order__remark--right')).toContainText(/согласие на обработку/i);
    await expect(p.locator('.order__result button.js-btn-order-save')).toBeEnabled();
  }
}
