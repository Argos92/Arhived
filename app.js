'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(section => observer.observe(section));
}
document.querySelector('#year').textContent = new Date().getFullYear();
const dialog = document.querySelector('#request');
document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    dialog.showModal();
    dialog.querySelector('input').focus();
  });
});
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
const leadForm = document.querySelector('#lead-form');
const leadStatus = document.querySelector('#form-status');
const submitButton = leadForm.querySelector('button[type="submit"]');
const leadConfig = window.ARHIVED_LEAD_FORM;
const fieldNames = ['name', 'contacts', 'research'];
const configured = leadConfig && fieldNames.every(name => /^entry\.\d+$/.test(leadConfig.fields?.[name])) && new Set(Object.values(leadConfig.fields)).size === 3;
let submitting = false;
let submitted = false;
if (!configured) {
  submitButton.disabled = true;
  leadStatus.textContent = 'Приём заявок временно недоступен. Пожалуйста, попробуйте позже.';
}
leadForm.addEventListener('input', event => {
  if (event.target.matches('input, textarea')) event.target.setCustomValidity('');
});
leadForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!configured || submitting || submitted) return;
  const values = {};
  for (const name of fieldNames) {
    const field = leadForm.elements[name];
    values[name] = field.value.trim();
    field.setCustomValidity(values[name] ? '' : 'Пожалуйста, заполните это поле.');
  }
  if (!leadForm.reportValidity()) return;
  const body = new URLSearchParams();
  for (const name of fieldNames) body.set(leadConfig.fields[name], values[name]);
  body.set('fvv', '1');
  body.set('pageHistory', '0');
  submitting = true;
  submitButton.disabled = true;
  leadForm.setAttribute('aria-busy', 'true');
  submitButton.textContent = 'Отправляем…';
  leadStatus.textContent = 'Пожалуйста, дождитесь завершения отправки.';
  leadStatus.className = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    // Google Forms does not expose CORS-readable acknowledgements. An opaque
    // response confirms transport completion, not validation/storage of a lead.
    await fetch(leadConfig.endpoint, {
      method: 'POST', mode: 'no-cors', credentials: 'omit',
      body, signal: controller.signal, referrerPolicy: 'no-referrer'
    });
    submitted = true;
    submitButton.textContent = 'Запрос отправлен';
    leadStatus.textContent = 'Запрос отправлен, но получение заявки ещё не подтверждено. Ожидайте обратной связи.';
    leadStatus.className = 'submission-pending';
  } catch (error) {
    submitButton.textContent = 'Повторить отправку';
    submitButton.disabled = false;
    leadStatus.className = 'submission-error';
    leadStatus.textContent = error.name === 'AbortError'
      ? 'Не удалось дождаться ответа. Возможно, запрос уже дошёл. Проверьте подключение перед повторной отправкой.'
      : 'Не удалось завершить отправку. Проверьте подключение и попробуйте ещё раз. Ваши данные остались в форме.';
  } finally {
    clearTimeout(timeout);
    submitting = false;
    leadForm.removeAttribute('aria-busy');
  }
});
