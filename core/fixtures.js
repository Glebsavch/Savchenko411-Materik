import { test as base, expect } from '@playwright/test';
import pino from 'pino';
import * as allure from 'allure-js-commons';
import { redact } from './redact.js';

async function attachScreenshot(page, info, name, region) {
  const mask = [page.locator(
    'input:visible, textarea:visible, .personal-link:visible, .auth_wr_inner:visible, ' +
    '.bx-soa-customer:visible, #bx-soa-properties:visible, [class*=user-name]:visible, [class*=profile-name]:visible'
  )];
  const options = { mask, maskColor: '#373b47', animations: 'disabled', timeout: 10_000 };
  const clip = await region?.boundingBox({ timeout: 6000 });
  const heading = page.locator('h1:visible').first();
  let body;
  if (clip) {
    body = await page.screenshot({ ...options, clip });
  } else if (await heading.isVisible()) {
    body = await heading.screenshot(options);
  } else {
    body = await page.screenshot({
      ...options, style: 'body * { color: transparent !important; text-shadow: none !important; }'
    });
  }
  await info.attach(name, { body, contentType: 'image/png' });
}

export const test = base.extend({
  journal: async ({ page }, use, info) => {
    const lines = [];
    const requestedLevel = (process.env.LOG_LEVEL || 'debug').toLowerCase();
    const level = requestedLevel === 'warning' ? 'warn' : requestedLevel;
    const logger = pino({
      level, base: null, timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: label => ({ level: label.toUpperCase() }) }
    }, { write: line => lines.push(line.trimEnd()) });
    function log(severity, message) {
      const method = severity === 'WARNING' ? 'warn' : severity.toLowerCase();
      logger[method](redact(message));
    }
    const [caseId] = info.title.split(' · ');
    await allure.label('caseId', caseId);
    await allure.parameter('Тест-кейс', caseId);
    const journal = {
      log,
      credentials(login, password) {
        const message = `Данные входа: login=${login || '(пусто)'} password=${password || '(пусто)'}`;
        const masked = redact(message, [login, password]);
        log('INFO', masked);
        if (process.env.QA_DEMO === '1') console.log(masked);
      },
      async parameters(values) {
        for (const [name, value] of Object.entries(values)) await allure.parameter(name, redact(value));
      },
      step: (name, action) => test.step(name, async () => {
        log('INFO', name);
        log('DEBUG', 'Начато действие или ожидание: ' + name);
        try {
          const result = await action();
          log('DEBUG', 'Шаг завершен');
          return result;
        } catch (error) {
          log('ERROR', 'Сбой при выполнении шага «' + name + '»');
          throw error;
        }
      }),
      screenshot: (name, region) => attachScreenshot(page, info, name, region)
    };
    log('DEBUG', 'Открыт изолированный контекст браузера');
    await use(journal);
    if (info.status !== info.expectedStatus) {
      log('ERROR', 'Проверка завершилась ошибкой. Подробности — в шаге отчёта.');
      try { await attachScreenshot(page, info, 'Страница при падении'); }
      catch (error) {
        const reason = page.isClosed() ? 'Страница браузера закрыта.'
          : redact(String(error.message || error.name).split('\n')[0]);
        log('ERROR', 'Снимок недоступен: ' + reason);
        await info.attach('Причина отсутствия снимка', { body: reason, contentType: 'text/plain' });
      }
    }
    await info.attach('Журнал прогона', { body: Buffer.from(lines.join('\n'), 'utf8'), contentType: 'text/plain' });
  }
});
export { expect };
