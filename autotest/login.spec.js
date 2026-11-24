import { test, expect } from '../core/fixtures.js';
import { account, negative, values } from '../core/data.js';
import { LoginPage } from '../ui/login-page.js';

test.beforeEach(() => {
  if (!account.login || !account.password) throw new Error('Для запуска введите данные учебной записи через run.cmd.');
});

test('ТК-А02 · Вход по почте и паролю', async ({ page, journal }) => {
  const login = new LoginPage(page);
  await journal.parameters({ 'Идентификатор': 'Email', 'Пароль': 'Действующий', 'Ожидается': 'Личный кабинет владельца почты' });
  await journal.step('Открыть форму входа по паролю', () => login.visit());
  await journal.step('Ввести учетные данные, проверить маскирование и войти', () => login.enter(account.login, account.password));
  await journal.step('Открыть личный кабинет и сверить почту владельца', () => login.profile(account.login));
});

test('ТК-А07 · Пароль скрыт при вводе', async ({ page, journal }) => {
  const login = new LoginPage(page);
  await journal.parameters({ 'Поле': 'Пароль', 'Данные': 'Демонстрационная строка', 'Ожидается': 'Поле типа password' });
  await journal.step('Открыть форму входа по почте', () => login.visit());
  await journal.step('Набрать пример и проверить скрытый режим поля', async () => {
    await login.pass.fill('Demo-411');
    await expect(login.pass.locator).toHaveAttribute('type', 'password');
    expect(await login.pass.locator.inputValue()).toHaveLength(8);
  });
});
for (const row of negative) {
  test(row.id + ' · ' + row.title, async ({ page, journal }) => {
    const login = new LoginPage(page);
    const phone = /Phone$/.test(row.kind);
    await journal.parameters({ 'Идентификатор': phone ? 'Телефон' : 'Email', 'Класс данных': row.title, 'Ожидается': 'Ошибка, кабинет закрыт' });
    await journal.step('Открыть форму в чистом браузерном контексте', () => login.visit(phone));
    await journal.step('Отправить набор данных выбранного класса', () =>
      phone ? login.requestCode(row.kind) : login.enter(...values(row.kind)));
    await journal.step('Проверить сообщение об ошибке и отсутствие доступа к кабинету', () => login.denied(row.kind));
  });
}
