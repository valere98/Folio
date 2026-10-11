document.documentElement.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navMenu.classList.toggle('is-open', !isOpen);
  });

  navMenu.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      navMenu.classList.remove('is-open');
    }
  });
}

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll('.reveal').forEach((element) => {
  if (revealObserver) revealObserver.observe(element);
  else element.classList.add('is-visible');
});

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const journalSearch = document.querySelector('#journal-search');
const articleCards = [...document.querySelectorAll('[data-article-card]')];
const journalCount = document.querySelector('#journal-count');
const journalEmpty = document.querySelector('#journal-empty');
let activeCategory = 'all';

function filterArticles() {
  const query = journalSearch instanceof HTMLInputElement ? journalSearch.value.trim().toLowerCase() : '';
  let visibleCount = 0;

  articleCards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    const categoryMatches = activeCategory === 'all' || card.dataset.category === activeCategory;
    const searchMatches = !query || text.includes(query) || (card.dataset.tags || '').toLowerCase().includes(query);
    const isVisible = categoryMatches && searchMatches;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  if (journalCount instanceof HTMLElement) {
    journalCount.textContent = visibleCount === 1 ? '1 article' : `${visibleCount} articles`;
  }
  if (journalEmpty instanceof HTMLElement) journalEmpty.hidden = visibleCount !== 0;
}

document.querySelectorAll('[data-category-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!(button instanceof HTMLButtonElement)) return;
    activeCategory = button.dataset.categoryFilter || 'all';
    document.querySelectorAll('[data-category-filter]').forEach((filterButton) => {
      filterButton.setAttribute('aria-pressed', String(filterButton === button));
    });
    filterArticles();
  });
});

if (journalSearch instanceof HTMLInputElement) {
  journalSearch.addEventListener('input', filterArticles);
  filterArticles();
}

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm instanceof HTMLFormElement) {
  const status = contactForm.querySelector('.form-status');
  const submitButton = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(status instanceof HTMLElement) || !(submitButton instanceof HTMLButtonElement)) return;

    status.textContent = 'Sending your enquiry…';
    status.dataset.state = 'sending';
    submitButton.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Enquiry service returned ${response.status}`);
      contactForm.reset();
      status.textContent = 'Thanks, your message has been sent. I’ll be in touch soon.';
      status.dataset.state = 'success';
    } catch (error) {
      console.error('Unable to send contact enquiry:', error);
      status.textContent = 'Your message could not be sent. Please email valeregmbaya@gmail.com instead.';
      status.dataset.state = 'error';
    } finally {
      submitButton.disabled = false;
    }
  });
}

const contrastInputs = [
  document.querySelector('#foreground'),
  document.querySelector('#background')
];
const contrastOutput = document.querySelector('#contrast-ratio');
const contrastStatus = document.querySelector('#contrast-status');
const contrastSample = document.querySelector('#contrast-sample');

function getLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi);
  if (!channels || channels.length !== 3) return null;
  const rgb = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]);
}

function updateContrast() {
  const [foreground, background] = contrastInputs;
  if (!(foreground instanceof HTMLInputElement) || !(background instanceof HTMLInputElement)
    || !(contrastOutput instanceof HTMLElement) || !(contrastStatus instanceof HTMLElement)
    || !(contrastSample instanceof HTMLElement)) return;

  const foregroundLuminance = getLuminance(foreground.value);
  const backgroundLuminance = getLuminance(background.value);
  if (foregroundLuminance === null || backgroundLuminance === null) return;

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const normalPass = ratio >= 4.5;
  const largePass = ratio >= 3;
  const swatches = contrastSample.querySelectorAll('.tool-swatch');
  if (swatches.length < 2) return;

  contrastOutput.textContent = `${ratio.toFixed(2)}:1`;
  contrastStatus.textContent = `Normal text: ${normalPass ? 'AA pass' : 'AA fail'} · Large text: ${largePass ? 'AA pass' : 'AA fail'}`;
  contrastStatus.dataset.state = normalPass ? 'pass' : 'fail';
  contrastSample.style.color = foreground.value;
  contrastSample.style.backgroundColor = background.value;
  swatches[0].style.backgroundColor = foreground.value;
  swatches[1].style.backgroundColor = background.value;
}

contrastInputs.forEach((input) => {
  if (input instanceof HTMLInputElement) input.addEventListener('input', updateContrast);
});
if (contrastOutput) updateContrast();
