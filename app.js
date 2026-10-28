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
document.querySelector('[data-open]').addEventListener('click', () => dialog.showModal());
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const text = `АРХИВЕД — анкета для обзорного поиска\n\nИмя: ${data.get('name').trim()}\n\nИзвестные сведения о семье:\n${data.get('history').trim()}\n\nПредложение на сайте: 3 870 ₽ вместо 12 000 ₽. Условия и сроки требуют согласования.\nАнкета сохранена локально и не отправлена.\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'arhived-anketa.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#form-status').textContent = 'Анкета подготовлена для скачивания. Данные не отправлялись.';
});
