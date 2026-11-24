import { expect } from '@playwright/test';
import { BasePage } from './base-page.js';
import { product } from '../core/data.js';
import { money } from './shop-page.js';

export class BasketPage extends BasePage {
  constructor(page) {
    super(page);
    this.rows = page.locator('.basket__item-row');
    this.row = this.rows.filter({ hasText: product.name });
    this.amount = this.row.locator('input.spinner-output');
    this.total = page.locator('.basket__result-value:visible').first();
    this.empty = page.getByText(/корзин[ае]\s*(?:пока\s*)?пуст[ао]|в корзине нет товаров|нет товаров в корзине|ваша корзина пуста/i).filter({visible:true}).first();
  }

  async visit() {
    await this.open('/basket/');
    await expect(this.rows.first().or(this.empty).first()).toBeVisible();
  }

  async snapshot() {
    const quantity = await this.row.count() ? Number(await this.amount.inputValue()) : 0;
    const total = await this.rows.count() ? money(await this.total.innerText()) : 0;
    return { quantity, total };
  }

  async waitForAddition(baseline) {
    await expect(async () => {
      await this.visit();
      await expect(this.amount).toHaveValue(String(baseline.quantity + product.quantity), {timeout: 1400});
    }).toPass({timeout: 18000, intervals: [300, 700, 1200]});
  }

  async increase() {
    const plus = this.row.locator('.js-amount-btn-increase2');
    const current = Number(await this.amount.inputValue());
    for (let i = 1; i <= product.quantity; i++) {
      await plus.click();
      await expect(this.amount).toHaveValue(String(current + i));
    }
  }

  async verify(baseline, prices) {
    const quantity = baseline.quantity + product.quantity;
    await expect(this.amount).toHaveValue(String(quantity));
    await expect(this.row).toContainText(product.query);
    await expect(this.row).toContainText(/В наличии:\s*\d+\s*упак/i);
    const unit = await this.page.locator('input[name=in_bonus_program]').isChecked() ? prices.card : prices.retail;
    const price = this.row.locator('[id^=current_price_]').first();
    const sum = this.row.locator('.basket__item-summ');
    await expect.poll(async () => money(await price.innerText())).toBe(unit);
    await expect.poll(async () => money(await sum.innerText())).toBe(unit * quantity);
    const expected = baseline.total + unit * product.quantity;
    await expect.poll(async () => money(await this.total.innerText())).toBe(expected);
    return expected;
  }

  async checkout() {
    await this.page.getByText('Самовывоз', {exact: true}).filter({visible: true}).first().click();
    const form = this.page.locator('form#basket_form_new');
    await expect(form).toHaveAttribute('action', /^\/order\/?$/);
    await form.locator('button.basket__btn').click();
    await expect(this.page).toHaveURL(/\/order\//);
  }

  async restore(baseline) {
    await this.visit();
    const current = (await this.snapshot()).quantity;
    if (current !== baseline.quantity) {
      if (current < baseline.quantity || current > baseline.quantity + product.quantity) throw new Error('Количество изменено в другом сеансе.');
      if (baseline.quantity === 0) {
        await this.row.locator('.js-del-card2').click();
        const confirm = this.page.getByRole('button', {name: /^(удалить|да)$/i}).filter({visible:true}).first();
        if (await confirm.isVisible()) await confirm.click();
        await expect(this.amount).toHaveCount(0);
      } else {
        for (let n = current; n > baseline.quantity; n--) {
          await this.row.locator('.js-amount-btn-reduce2').click();
          await expect(this.amount).toHaveValue(String(n - 1));
        }
      }
    }
    await expect(async () => {
      await this.visit();
      expect(await this.snapshot()).toEqual(baseline);
    }).toPass({timeout: 16000, intervals: [600, 1200]});
  }
}
