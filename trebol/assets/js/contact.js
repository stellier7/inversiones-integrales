let selectedCountry = COUNTRY_DIAL_CODES[0];

function formatLeadPhone() {
  const local = document.getElementById('lead-phone')?.value.trim() || '';
  if (!local) return '';
  return `+${selectedCountry.dial} ${local}`;
}

function greetingLine() {
  const seller = getActiveSeller();
  if (seller) {
    return `Hola ${seller.firstName}, quiero ser distribuidor Trébol.`;
  }
  return 'Hola, quiero ser distribuidor Trébol.';
}

function shortInterestMessage() {
  const seller = getActiveSeller();
  if (seller) {
    return `Hola ${seller.firstName}, me interesa ser distribuidor Trébol.`;
  }
  return 'Hola, me interesa ser distribuidor Trébol.';
}

function buildDistributorLeadMessage() {
  const name = document.getElementById('lead-name')?.value.trim() || '';
  const business = document.getElementById('lead-business')?.value.trim() || '';
  const phone = formatLeadPhone();
  const city = document.getElementById('lead-city')?.value.trim() || '';
  const seller = getActiveSeller();
  const rawSeller = getSellerFromUrl();

  const lines = [greetingLine(), ''];
  if (name) lines.push('Nombre: ' + name);
  if (business) lines.push('Negocio: ' + business);
  if (phone) lines.push('Teléfono: ' + phone);
  if (city) lines.push('Ciudad, País: ' + city);
  // Solo si hay un referido desconocido (no está en el registro) y el chat va al contacto central.
  if (!seller && rawSeller) lines.push('Referido por: ' + rawSeller);

  return lines.join('\n').trim();
}

function submitDistributorLead() {
  const name = document.getElementById('lead-name')?.value.trim();
  const phone = document.getElementById('lead-phone')?.value.trim();

  if (!name || !phone) {
    alert('Por favor ingresa al menos tu nombre y teléfono.');
    return;
  }

  window.open(whatsAppUrl(buildDistributorLeadMessage()), '_blank', 'noopener');
}

function renderCountryOptions(filter = '') {
  const list = document.getElementById('leadCountryList');
  if (!list) return;

  const query = filter.trim().toLowerCase();
  const dialQuery = query.replace(/\D/g, '');

  const matches = COUNTRY_DIAL_CODES.filter((country) => {
    if (!query) return true;
    return (
      country.name.toLowerCase().includes(query) ||
      country.iso.toLowerCase().includes(query) ||
      (dialQuery && country.dial.startsWith(dialQuery))
    );
  });

  list.innerHTML = matches
    .map(
      (country) => `
      <li>
        <button type="button" class="country-option${country.iso === selectedCountry.iso ? ' is-selected' : ''}" data-iso="${country.iso}">
          <span class="country-option-flag" aria-hidden="true">${countryFlag(country.iso)}</span>
          <span class="country-option-name">${country.name}</span>
          <span class="country-option-dial">+${country.dial}</span>
        </button>
      </li>`
    )
    .join('');

  if (!matches.length) {
    list.innerHTML = '<li class="country-option-empty">Sin resultados</li>';
  }
}

function updateCountryTrigger() {
  const trigger = document.getElementById('leadCountryTrigger');
  if (!trigger) return;

  trigger.querySelector('.country-flag').textContent = countryFlag(selectedCountry.iso);
  trigger.querySelector('.country-dial').textContent = `+${selectedCountry.dial}`;
  trigger.setAttribute('aria-label', `País: ${selectedCountry.name}, +${selectedCountry.dial}`);
}

function setSelectedCountry(iso) {
  const country = COUNTRY_DIAL_CODES.find((entry) => entry.iso === iso);
  if (!country) return;
  selectedCountry = country;
  updateCountryTrigger();
  renderCountryOptions(document.getElementById('leadCountrySearch')?.value || '');
}

function closeCountryPicker() {
  const picker = document.getElementById('leadCountryPicker');
  const trigger = document.getElementById('leadCountryTrigger');
  const search = document.getElementById('leadCountrySearch');
  if (!picker || !trigger) return;

  picker.classList.remove('open');
  trigger.setAttribute('aria-expanded', 'false');
  if (search) search.value = '';
  renderCountryOptions();
}

function openCountryPicker() {
  const picker = document.getElementById('leadCountryPicker');
  const trigger = document.getElementById('leadCountryTrigger');
  const search = document.getElementById('leadCountrySearch');
  if (!picker || !trigger) return;

  picker.classList.add('open');
  trigger.setAttribute('aria-expanded', 'true');
  renderCountryOptions();
  window.requestAnimationFrame(() => search?.focus());
}

function initCountryPicker() {
  const picker = document.getElementById('leadCountryPicker');
  const trigger = document.getElementById('leadCountryTrigger');
  const search = document.getElementById('leadCountrySearch');
  const list = document.getElementById('leadCountryList');
  if (!picker || !trigger || !search || !list) return;

  updateCountryTrigger();
  renderCountryOptions();

  trigger.addEventListener('click', () => {
    if (picker.classList.contains('open')) {
      closeCountryPicker();
    } else {
      openCountryPicker();
    }
  });

  search.addEventListener('input', () => {
    renderCountryOptions(search.value);
  });

  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCountryPicker();
      trigger.focus();
    }
  });

  list.addEventListener('click', (e) => {
    const option = e.target.closest('.country-option');
    if (!option) return;
    setSelectedCountry(option.dataset.iso);
    closeCountryPicker();
    document.getElementById('lead-phone')?.focus();
  });

  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closeCountryPicker();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && picker.classList.contains('open')) {
      closeCountryPicker();
      trigger.focus();
    }
  });
}

function initContact() {
  initCountryPicker();

  const waLink = document.querySelector('.wa-link');
  if (waLink) {
    waLink.href = whatsAppUrl(shortInterestMessage());
    waLink.removeAttribute('onclick');
  }

  const submitBtn = document.querySelector('.lead-form .submit-btn');
  if (submitBtn) {
    submitBtn.onclick = submitDistributorLead;
  }
}
