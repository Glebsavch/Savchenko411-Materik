import { expect } from '@playwright/test';
import { BasePage } from './base-page.js';
import { BaseElement } from './base-element.js';
import { product } from '../core/data.js';

export function money(text) {
  const match = text.replace(/[\s\u00a0\u202f]/g, '').match(/\d+(?:[.,]\d{1,2})?/);
  if (!match) throw new Error('На странице не найдена цена.');
  return Math.round(Number(match[0].replace(',', '.')) * 100);
}

export class ShopPage extends BasePage {
  constructor(page) {
    super(page);
    this.add = page.locator('.product__order .btn_add_basket:visible').first();
  }

  async search() {
    await this.open('/shop/stroitelnye-materialy/');
    const field = this.page.locator('input[name=q]:visible').first();
    await new BaseElement(field, 'Запрос').fill(product.query);
    await field.press('Enter');
    const link = this.page.locator('a.product-card-new__title:visible, a.digi-product__label:visible').filter({ hasText: product.name }).first();
    await expect(link).toBeVisible();
    const target = new URL(await link.getAttribute('href'), this.page.url());
    expect(target.origin).toBe(new URL(this.page.url()).origin);
    await this.open(target.href);
    await expect(this.page.locator('h1:visible').first()).toHaveText(product.name);
  }

  async prices() {
    await expect(this.page.locator('.product__price-note:visible').first()).toContainText('упак');
    await expect(this.page.getByText(product.query, { exact: false }).filter({visible:true}).last()).toBeVisible();
    await expect(this.add).toBeVisible();
    const card = money(await this.page.locator('.product__price-option--main .product__price-value:visible').first().innerText());
    const retail = money(await this.page.locator('.product__price-option:not(.product__price-option--main) .product__price-value:visible').first().innerText());
    expect(card).toBeGreaterThan(0); expect(retail).toBeGreaterThanOrEqual(card);
    return { retail, card };
  }

  async addToBasket() {
    const quantity = this.page.locator('.product__order input[name=quantity]:visible');
    await quantity.fill(String(product.quantity));
    await quantity.press('Tab');
    await expect(quantity).toHaveValue(String(product.quantity));
    await this.add.click();
  }
}
