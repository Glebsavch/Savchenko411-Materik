import { randomUUID } from 'node:crypto';

export const account = { login: process.env.MATERIK_LOGIN || '', password: process.env.MATERIK_PASSWORD || '' };
export const demoAccount = { login: 'demo-411@example.invalid', password: 'Demo-411-Materik' };
export const buyer = { name: 'Иван Тестовый', email: 'student@example.test', phone: '79000000003' };
export const product = {
  query: '00-00066857',
  name: 'Саморезы КНАУФ по металлу с прессшайбой LN 4,2 х 13 мм 1000 шт/упак с битой PH2',
  quantity: 2
};

export const negative = [
  { id: 'ТК-А05', title: 'Пустой идентификатор', kind: 'emptyLogin' },
  { id: 'ТК-А06', title: 'Пустой пароль', kind: 'emptyPassword' },
  { id: 'ТК-А03', title: 'Неверный пароль', kind: 'wrongPassword' },
  { id: 'ТК-А04', title: 'Незарегистрированная почта', kind: 'absent' },
  { id: 'ТК-А04.Ф', title: 'Email без домена', kind: 'format' },
  { id: 'ТК-А09', title: 'Неполный номер телефона', kind: 'shortPhone' }
];

export function values(kind) {
  const id = { emptyLogin: '', absent: 'qa-' + randomUUID() + '@example.invalid', format: 'student@' };
  const pw = { emptyPassword: '', wrongPassword: 'Invalid-' + randomUUID() };
  return [id[kind] ?? account.login, pw[kind] ?? demoAccount.password];
}
