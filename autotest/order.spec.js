import { fileURLToPath } from 'node:url';
import { test } from '../core/fixtures.js';
import { account, product } from '../core/data.js';
import { LoginPage } from '../ui/login-page.js';
import { ShopPage } from '../ui/shop-page.js';
import { BasketPage } from '../ui/basket-page.js';
import { CheckoutPage } from '../ui/checkout-page.js';

test('ТК-М08 → ТК-М22 · От поиска товара до оформления самовывоза', async ({ page, journal }, info) => {
  await info.attach('Тестовые данные', { path: fileURLToPath(new URL('../report/Тестовые данные.pdf', import.meta.url)), contentType: 'application/pdf' });
  await journal.parameters({ 'Поиск': product.query, 'Товар': product.name, 'Добавляемое количество': String(product.quantity), 'Получение': 'Самовывоз' });
  const login = new LoginPage(page), shop = new ShopPage(page), cart = new BasketPage(page);
  await journal.step('Войти по почте и подтвердить владельца кабинета', async () => {
    await login.visit(); await login.enter(account.login, account.password); await login.profile(account.login);
  });
  const before = await journal.step('Запомнить исходное количество и сумму корзины', async () => {
    await cart.visit(); return cart.snapshot();
  });
  await journal.step('Найти товар по запросу и открыть нужную карточку', () => shop.search());
  const prices = await journal.step('Проверить данные карточки и прочитать цену', () => shop.prices());
  try {
    await journal.step('Добавить выбранное количество товара', async () => {
      if (before.quantity) { await cart.visit(); await cart.increase(); }
      else await shop.addToBasket();
      await cart.waitForAddition(before);
    });
    const total = await journal.step('Сверить товар, количество, цену, стоимость строки и итог корзины', () => cart.verify(before, prices));
    journal.log('INFO', 'Сумма товаров в корзине: ' + total / 100 + ' руб.');
    await journal.step('Перейти к оформлению', () => cart.checkout());
    await journal.step('Проверить покупателя, получение, оплату, согласие и итог до отправки', () => new CheckoutPage(page).verify(total));
    await journal.screenshot('Оформление заказа');
  } finally {
    await journal.step('Восстановить корзину и сверить с исходным состоянием', () => cart.restore(before));
  }
});
