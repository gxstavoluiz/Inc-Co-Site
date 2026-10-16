import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import './design-system.css';
import './motion.css';
import { initMotion } from './motion.js';

const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function setMenu(open, restoreFocus = false) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menu.textContent = open ? '×' : '☰';
  if (restoreFocus) menu.focus();
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (menu.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') setMenu(false, true);
  if (event.key === 'Tab') {
    const links = navigation.querySelectorAll('a');
    const first = links[0];
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); menu.focus(); }
    else if (event.shiftKey && document.activeElement === menu) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); menu.focus(); }
    else if (!event.shiftKey && document.activeElement === menu) { event.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(min-width: 768px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); }); document.querySelectorAll('.project').forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; }); }));
const projects = [{title:'Terra — de volta à essência',description:'Um estudo de marca sobre o essencial. Tipografia orgânica, tons naturais e um posicionamento que aproxima pessoas e natureza. O conceito explora estratégia de marca, identidade visual e aplicações editoriais.'},{title:'Move — o futuro em movimento',description:'Uma exploração de identidade para uma nova forma de se mover. Tipografia expressiva e um sistema visual dinâmico se encontram em uma experiência digital direta, intuitiva e cheia de personalidade.'}];
const dialog = document.querySelector('dialog');
document.querySelectorAll('[data-project]').forEach(card => card.addEventListener('click', () => {const project = projects[card.dataset.project]; document.querySelector('#project-title').textContent = project.title; document.querySelector('#project-description').textContent = project.description; dialog.showModal();}));
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-cta').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {if(event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); }});
document.querySelector('#contact-form').addEventListener('submit', event => {event.preventDefault();const data=new FormData(event.target); const subject=encodeURIComponent(`Novo projeto — ${data.get('name')}`);const body=encodeURIComponent(`Olá, Inc&Co!\n\n${data.get('message')}\n\n${data.get('name')}\n${data.get('email')}`);const link=document.createElement('a');link.href=`mailto:agenciaavengers@hotmail.com?subject=${subject}&body=${body}`;link.click();document.querySelector('#form-status').textContent='Mensagem preparada para agenciaavengers@hotmail.com. Revise e envie no seu aplicativo de e-mail.';});
document.querySelector('#year').textContent=new Date().getFullYear();
initMotion();
