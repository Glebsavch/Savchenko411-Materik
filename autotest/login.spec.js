import { test, expect } from '../core/fixtures.js';
import { account, demoAccount, negative, values } from '../core/data.js';
import { LoginPage } from '../ui/login-page.js';

test('ТК-А02 · Вход по почте и паролю', async ({ page, journal }) => {
  test.skip(!account.login || !account.password, 'Нужны логин и пароль учебной записи');
  const login = new LoginPage(page);
  await journal.parameters({ 'Идентификатор': 'Email', 'Пароль': 'Действующий', 'Ожидается': 'Личный кабинет владельца почты' });
  await journal.step('Открыть форму входа по паролю', () => login.visit());
  await journal.step('Ввести учетные данные, проверить маскирование и войти', async () => {
    journal.credentials(account.login, account.password);
    await login.enter(account.login, account.password);
  });
  await journal.step('Открыть личный кабинет и сверить почту владельца', () => login.profile(account.login));
});

test('ТК-А07 · Пароль скрыт при вводе', async ({ page, journal }) => {
  const login = new LoginPage(page);
  await journal.parameters({ 'Поле': 'Пароль', 'Данные': 'Вымышленная учётная запись', 'Ожидается': 'Поле типа password' });
  await journal.step('Открыть форму входа по почте', () => login.visit());
  await journal.step('Набрать пример и проверить скрытый режим поля', async () => {
    journal.credentials(demoAccount.login, demoAccount.password);
    await login.fillCredentials(demoAccount.login, demoAccount.password);
    expect(await login.pass.locator.inputValue() === demoAccount.password, 'Пароль введён полностью').toBe(true);
    await journal.screenshot('Форма входа с маскировкой', login.form);
  });
});
for (const row of negative) {
  test(row.id + ' · ' + row.title, async ({ page, journal }) => {
    const needsLogin = row.kind === 'emptyPassword' || row.kind === 'wrongPassword';
    test.skip(needsLogin && !account.login, 'Нужна почта учебной записи');
    const login = new LoginPage(page);
    const phone = /Phone$/.test(row.kind);
    await journal.parameters({ 'Идентификатор': phone ? 'Телефон' : 'Email', 'Класс данных': row.title, 'Ожидается': 'Ошибка, кабинет закрыт' });
    await journal.step('Открыть форму в чистом браузерном контексте', () => login.visit(phone));
    await journal.step('Отправить набор данных выбранного класса', async () => {
      if (phone) return login.requestCode(row.kind);
      const [id, password] = values(row.kind);
      journal.credentials(id, password);
      await login.enter(id, password);
    });
    await journal.step('Проверить сообщение об ошибке и отсутствие доступа к кабинету', () => login.denied(row.kind));
  });
}
