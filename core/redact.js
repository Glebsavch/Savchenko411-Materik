import { account, buyer } from './data.js';

export function redact(message, extraValues = []) {
  let safe = String(message);
  const values = [account.password, account.login, buyer.name, buyer.phone, buyer.email, ...extraValues];
  const variants = new Set(values.filter(Boolean).flatMap(value => [
    value, JSON.stringify(value).slice(1, -1), new URLSearchParams({ value }).toString().slice(6)
  ]));
  for (const value of [...variants].sort((a, b) => b.length - a.length)) {
    safe = safe.replaceAll(value, '***');
  }
  return safe.replace(/(\b(?:authorization|set-cookie|cookie)\s*:\s*)[^\r\n]+/gi, '$1***')
    .replace(/([?&](?:sessid|token|access_token|refresh_token|sessionid|auth|key)=)[^&\s"'<>]+/gi, '$1***')
    .replace(/[\w.+-]+@[\w.-]+\.\w+/gi, '***')
    .replace(/(?<!\d)(?:\+?7|8)[\s()-]*\d(?:[\s()-]*\d){9}(?!\d)/g, '***');
}
