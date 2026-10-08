const STORAGE_KEY = 'sales_leads_data';
const CITIES_KEY = 'sales_cities_list';
const ACTIVE_CITY_KEY = 'sales_active_city';
const PASSWORD_KEY = 'sales_admin_password';
const USER_ROLE_KEY = 'sales_user_role';

const DEFAULT_CITIES = ['אלעד', 'בני ברק', 'ירושלים', 'בית שמש', 'פתח תקווה', 'רמת גן', 'חיפה', 'נתניה'];

function getCities() {
  const saved = localStorage.getItem(CITIES_KEY);
  if (!saved) {
    localStorage.setItem(CITIES_KEY, JSON.stringify(DEFAULT_CITIES));
    return [...DEFAULT_CITIES];
  }
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_CITIES];
  } catch (e) {
    return [...DEFAULT_CITIES];
  }
}

function getRole() {
  return localStorage.getItem(USER_ROLE_KEY) || 'guest';
}

function setRole(role) {
  localStorage.setItem(USER_ROLE_KEY, role);
  updateRoleUI();
}

function isAdminPasswordValid(inputPassword) {
  const savedPassword = localStorage.getItem(PASSWORD_KEY);
  return inputPassword !== null && inputPassword.trim() !== '' && inputPassword.trim() === savedPassword;
}

function updateRoleUI() {
  const role = getRole();
  const appContainer = document.getElementById('appContainer');
  const authScreen = document.getElementById('authScreen');
  const adminToggleBtn = document.getElementById('adminToggleBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');

  if (role === 'admin') {
    authScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    adminToggleBtn.style.display = 'inline-flex';
    exportBtn.disabled = false;
    clearBtn.disabled = false;
    exportBtn.style.opacity = '1';
    clearBtn.style.opacity = '1';
  } else {
    authScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    adminToggleBtn.style.display = 'none';
    exportBtn.disabled = true;
    clearBtn.disabled = true;
    exportBtn.style.opacity = '0.5';
    clearBtn.style.opacity = '0.5';
  }
}

function continueAsUser() {
  setRole('user');
  closeAdmin();
  applyActiveCity();
}

function loginAsAdmin() {
  const savedPassword = localStorage.getItem(PASSWORD_KEY);

  if (!savedPassword) {
    const newPass = prompt('זוהי כניסה ראשונה. אנא קבע סיסמת מנהל חדשה:');
    if (newPass === null) {
      return;
    }

    const trimmedNewPass = newPass.trim();
    if (trimmedNewPass === '') {
      alert('חובה לקבוע סיסמה כדי להיכנס כמנהל!');
      return;
    }

    localStorage.setItem(PASSWORD_KEY, trimmedNewPass);
    alert('הסיסמה נקבעה בהצלחה!');
  }

  const enteredPassword = prompt('כניסה למנהל בלבד. הזן סיסמה:');
  if (enteredPassword === null) {
    return;
  }

  if (!isAdminPasswordValid(enteredPassword)) {
    alert('❌ סיסמה שגויה! הגישה נדחתה.');
    return;
  }

  setRole('admin');
  openAdmin();
}

function openAdmin() {
  const role = getRole();

  if (role !== 'admin') {
    loginAsAdmin();
    return;
  }

  document.getElementById('adminModal').style.display = 'flex';
  document.getElementById('citySelectInput').value = localStorage.getItem(ACTIVE_CITY_KEY) || '';
  updateCounter();
  renderAdminCitiesList();
}

function closeAdmin() {
  document.getElementById('adminModal').style.display = 'none';
}

function changeAdminPassword() {
  const currentPass = prompt('נא להזין את הסיסמה הנוכחית:');
  if (currentPass === null) {
    return;
  }

  const savedPassword = localStorage.getItem(PASSWORD_KEY);
  if (currentPass.trim() !== savedPassword) {
    alert('הסיסמה הנוכחית שגויה!');
    return;
  }

  const newPass = prompt('נא להזין סיסמה חדשה:');
  if (newPass === null) {
    return;
  }

  const trimmedNewPass = newPass.trim();
  if (trimmedNewPass !== '') {
    localStorage.setItem(PASSWORD_KEY, trimmedNewPass);
    alert('הסיסמה שונתה בהצלחה!');
  } else {
    alert('הסיסמה לא שונתה (שדה ריק).');
  }
}

function syncCityChips() {
  const cityChipsContainer = document.getElementById('cityChipsContainer');
  const citySelect = document.getElementById('citySelect');
  if (!cityChipsContainer || !citySelect) return;

  cityChipsContainer.innerHTML = '';
  Array.from(citySelect.options).forEach(option => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'city-chip' + (option.selected ? ' is-selected' : '');
    chip.dataset.value = option.value;
    chip.innerHTML = `<span class="chip-check">${option.selected ? '✓' : '+'}</span> <span>${option.text}</span>`;

    chip.addEventListener('click', () => {
      option.selected = !option.selected;
      chip.classList.toggle('is-selected', option.selected);
      chip.querySelector('.chip-check').textContent = option.selected ? '✓' : '+';
      citySelect.dispatchEvent(new Event('change'));

      const hasSelectedCity = Array.from(citySelect.options).some(o => o.selected);
      const noCityError = document.getElementById('noCityError');
      if (hasSelectedCity && noCityError) {
        noCityError.style.display = 'none';
      }
    });

    cityChipsContainer.appendChild(chip);
  });
}

function updateChipsFromSelect() {
  const cityChipsContainer = document.getElementById('cityChipsContainer');
  const citySelect = document.getElementById('citySelect');
  if (!cityChipsContainer || !citySelect) return;

  const chips = cityChipsContainer.querySelectorAll('.city-chip');
  chips.forEach(chip => {
    const val = chip.dataset.value;
    const opt = Array.from(citySelect.options).find(o => o.value === val);
    if (opt) {
      chip.classList.toggle('is-selected', opt.selected);
      const checkIcon = chip.querySelector('.chip-check');
      if (checkIcon) checkIcon.textContent = opt.selected ? '✓' : '+';
    }
  });
}

function renderAdminCitiesList() {
  const container = document.getElementById('adminCitiesListContainer');
  if (!container) return;

  const cities = getCities();
  container.innerHTML = '';

  if (cities.length === 0) {
    container.innerHTML = '<span style="font-size:13px; color:var(--text-muted); padding:6px;">רשימת הערים ריקה. הוסיפו עיר חדשה למעלה.</span>';
    return;
  }

  cities.forEach(city => {
    const item = document.createElement('div');
    item.className = 'admin-city-item';

    const label = document.createElement('span');
    label.textContent = city;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'admin-city-delete-btn';
    delBtn.innerHTML = '✕';
    delBtn.title = `מחק את ${city}`;
    delBtn.addEventListener('click', () => handleDeleteCity(city));

    item.appendChild(label);
    item.appendChild(delBtn);
    container.appendChild(item);
  });
}

function handleAddNewCity() {
  const input = document.getElementById('newCityInput');
  if (!input) return;
  const newCity = input.value.trim();
  if (!newCity) {
    alert('נא להזין שם עיר להוספה.');
    return;
  }

  const cities = getCities();
  if (cities.some(c => c.toLowerCase() === newCity.toLowerCase())) {
    alert('עיר זו כבר קיימת ברשימה!');
    return;
  }

  cities.push(newCity);
  localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
  input.value = '';
  loadCities();
  renderAdminCitiesList();
}

function handleDeleteCity(cityToDelete) {
  if (!confirm(`האם ברצונך למחוק את "${cityToDelete}" מרשימת הערים?`)) {
    return;
  }

  const cities = getCities().filter(c => c !== cityToDelete);
  localStorage.setItem(CITIES_KEY, JSON.stringify(cities));

  if (localStorage.getItem(ACTIVE_CITY_KEY) === cityToDelete) {
    localStorage.removeItem(ACTIVE_CITY_KEY);
    applyActiveCity();
  }

  loadCities();
  renderAdminCitiesList();
}

function resetCitiesToDefault() {
  if (!confirm('האם לשחזר את רשימת הערים לברירת המחדל המקורית?')) {
    return;
  }
  localStorage.setItem(CITIES_KEY, JSON.stringify(DEFAULT_CITIES));
  loadCities();
  renderAdminCitiesList();
}

function loadCities() {
  const savedCities = getCities();
  const datalist = document.getElementById('citiesList');
  const citySelect = document.getElementById('citySelect');

  datalist.innerHTML = '';
  citySelect.innerHTML = '';

  savedCities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    datalist.appendChild(option.cloneNode(true));

    const selectOption = document.createElement('option');
    selectOption.value = city;
    selectOption.textContent = city;
    citySelect.appendChild(selectOption);
  });

  const activeCity = localStorage.getItem(ACTIVE_CITY_KEY);
  const defaultSelected = activeCity ? [activeCity] : savedCities.slice(0, 1);

  Array.from(citySelect.options).forEach(option => {
    option.selected = defaultSelected.includes(option.value);
  });

  syncCityChips();
}

function saveEventCity() {
  const chosenCity = document.getElementById('citySelectInput').value.trim();
  if (!chosenCity) {
    alert('נא להקליד או לבחור עיר');
    return;
  }

  let savedCities = getCities();
  if (!savedCities.includes(chosenCity)) {
    savedCities.push(chosenCity);
    localStorage.setItem(CITIES_KEY, JSON.stringify(savedCities));
  }

  localStorage.setItem(ACTIVE_CITY_KEY, chosenCity);
  loadCities();
  renderAdminCitiesList();
  applyActiveCity();
  closeAdmin();
  alert(`עיר המכירה הוגדרה בהצלחה: ${chosenCity}`);
}

function applyActiveCity() {
  const activeCity = localStorage.getItem(ACTIVE_CITY_KEY);
  const badgeContainer = document.getElementById('cityBadgeContainer');
  const badgeText = document.getElementById('currentCityText');
  const displayTitle = document.getElementById('displayTitle');

  if (activeCity) {
    badgeText.innerText = `מכירה ב${activeCity}`;
    badgeContainer.style.display = 'block';
    displayTitle.innerText = `הרשמה למכירה ב${activeCity}`;
  } else {
    badgeContainer.style.display = 'none';
    displayTitle.innerText = 'הרשמה לעדכוני מכירה';
  }
}

function updateCounter() {
  const leads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const leadCountEl = document.getElementById('leadCount');
  if (leadCountEl) {
    leadCountEl.innerText = `סה"כ נרשמו עד כה: ${leads.length}`;
  }
}

function exportLeadsToCsv() {
  if (getRole() !== 'admin') {
    alert('רק מנהל יכול להוריד את הקובץ.');
    return;
  }

  const leads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (leads.length === 0) {
    alert('אין נתונים לייצוא.');
    return;
  }

  let csvContent = '\uFEFFעיר,טלפון,מייל,תאריך ושעה\n';
  leads.forEach(row => {
    const cityValue = Array.isArray(row.cities) ? row.cities.join(', ') : (row.city || '');
    csvContent += `"${String(cityValue).replace(/"/g, '""')}","${String(row.phone || '').replace(/"/g, '""')}","${String(row.email || '').replace(/"/g, '""')}","${String(row.date || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sales_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function clearStoredLeads() {
  if (getRole() !== 'admin') {
    alert('רק מנהל יכול למחוק נתונים.');
    return;
  }

  if (confirm('בטוחה שברצונך למחוק את כל הנתונים שנאגרו במכשיר?')) {
    localStorage.removeItem(STORAGE_KEY);
    updateCounter();
    alert('כל הנתונים נמחקו.');
  }
}

document.getElementById('continueUserBtn').addEventListener('click', continueAsUser);
document.getElementById('adminLoginBtn').addEventListener('click', loginAsAdmin);
document.getElementById('switchUserBtn').addEventListener('click', () => {
  localStorage.removeItem(USER_ROLE_KEY);
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
  closeAdmin();
});

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+972')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('972') && cleaned.length > 9) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

function isValidPhone(phone) {
  const cleaned = cleanPhoneNumber(phone);
  // Israeli mobile (05X - 10 digits) or VoIP (07X - 10 digits)
  const isMobileOrVoip = /^(05[0-9]|07[2-9])\d{7}$/.test(cleaned);
  // Israeli landline (02, 03, 04, 08, 09 - 9 digits)
  const isLandline = /^0[23489]\d{7}$/.test(cleaned);
  return isMobileOrVoip || isLandline;
}

function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}

function getFullEmail(rawInput) {
  if (!rawInput) return '';
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return trimmed + '@gmail.com';
}

const selectAllBtn = document.getElementById('selectAllCitiesBtn');
if (selectAllBtn) {
  selectAllBtn.addEventListener('click', () => {
    const citySelect = document.getElementById('citySelect');
    Array.from(citySelect.options).forEach(opt => opt.selected = true);
    updateChipsFromSelect();
    const noCityError = document.getElementById('noCityError');
    if (noCityError) noCityError.style.display = 'none';
  });
}

const clearAllBtn = document.getElementById('clearAllCitiesBtn');
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', () => {
    const citySelect = document.getElementById('citySelect');
    const activeCity = localStorage.getItem(ACTIVE_CITY_KEY);
    // Keep active event city selected if configured, otherwise unselect all
    Array.from(citySelect.options).forEach(opt => {
      opt.selected = activeCity ? opt.value === activeCity : false;
    });
    updateChipsFromSelect();
    const noCityError = document.getElementById('noCityError');
    if (noCityError) noCityError.style.display = 'none';
  });
}

const phoneInputField = document.getElementById('phone');
if (phoneInputField) {
  phoneInputField.addEventListener('input', () => {
    // Allow digits only
    phoneInputField.value = phoneInputField.value.replace(/\D/g, '');

    const phoneError = document.getElementById('phoneError');
    const contactError = document.getElementById('contactError');
    if (phoneError) phoneError.style.display = 'none';
    if (contactError) contactError.style.display = 'none';
  });

  phoneInputField.addEventListener('keydown', (e) => {
    // Allow navigation and editing control keys
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }
    // Disallow any key that is not a digit (0-9)
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  });

  phoneInputField.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digitsOnly = pasted.replace(/\D/g, '');
    document.execCommand('insertText', false, digitsOnly);
  });
}

function updateConnectedEmail() {
  const emailInput = document.getElementById('email');
  const measurer = document.getElementById('emailMeasurer');
  const suffix = document.getElementById('emailConnectedSuffix');
  if (!emailInput || !measurer) return;

  const val = emailInput.value;
  if (!val) {
    measurer.textContent = emailInput.placeholder || 'שם משתמש';
    emailInput.style.width = (measurer.offsetWidth + 6) + 'px';
    if (suffix) suffix.style.display = 'inline';
    return;
  }

  if (val.includes('@')) {
    emailInput.style.width = '100%';
    if (suffix) suffix.style.display = 'none';
  } else {
    measurer.textContent = val;
    emailInput.style.width = (measurer.offsetWidth + 4) + 'px';
    if (suffix) suffix.style.display = 'inline';
  }
}

const emailInputField = document.getElementById('email');
const emailWrapper = document.getElementById('emailWrapper');

if (emailWrapper && emailInputField) {
  emailWrapper.addEventListener('click', () => {
    emailInputField.focus();
  });
}

if (emailInputField) {
  emailInputField.addEventListener('input', () => {
    const emailError = document.getElementById('emailError');
    const contactError = document.getElementById('contactError');
    if (emailError) emailError.style.display = 'none';
    if (contactError) contactError.style.display = 'none';

    updateConnectedEmail();
  });

  // Set initial connected width on load
  updateConnectedEmail();
}

const newCityInput = document.getElementById('newCityInput');
if (newCityInput) {
  newCityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewCity();
    }
  });
}

document.getElementById('leadForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const phone = phoneInput.value.trim();
  const rawEmail = emailInput.value.trim();
  const email = getFullEmail(rawEmail);

  const contactError = document.getElementById('contactError');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const noCityError = document.getElementById('noCityError');
  const successMsg = document.getElementById('successMsg');

  // Hide all error messages initially
  contactError.style.display = 'none';
  if (phoneError) phoneError.style.display = 'none';
  if (emailError) emailError.style.display = 'none';
  noCityError.style.display = 'none';
  successMsg.style.display = 'none';

  // 1. Validation: At least one city MUST be selected
  const selectedCities = Array.from(document.getElementById('citySelect').selectedOptions)
    .map(option => option.value.trim())
    .filter(Boolean);

  if (selectedCities.length === 0) {
    noCityError.style.display = 'block';
    return;
  }

  // 2. Validation: At least one contact field (phone or email) must be filled
  if (!phone && !email) {
    contactError.style.display = 'block';
    return;
  }

  // 3. Validation: If phone is provided, verify it is a valid mobile or landline
  if (phone && !isValidPhone(phone)) {
    if (phoneError) phoneError.style.display = 'block';
    phoneInput.focus();
    return;
  }

  // 4. Validation: If email is provided, verify it has a valid format
  if (email && !isValidEmail(email)) {
    if (emailError) emailError.style.display = 'block';
    emailInput.focus();
    return;
  }

  const formattedPhone = cleanPhoneNumber(phone) || phone;
  const newLead = {
    city: selectedCities.join(', '),
    cities: selectedCities,
    phone: formattedPhone,
    email: email,
    date: new Date().toLocaleString('he-IL')
  };

  const leads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  leads.push(newLead);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));

  phoneInput.value = '';
  emailInput.value = '';
  updateConnectedEmail();

  // Reset selected chips to active city default
  const activeCity = localStorage.getItem(ACTIVE_CITY_KEY);
  if (activeCity) {
    Array.from(document.getElementById('citySelect').options).forEach(option => {
      option.selected = option.value === activeCity;
    });
    updateChipsFromSelect();
  }

  successMsg.style.display = 'block';
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 2500);

  updateCounter();
});

document.getElementById('exportBtn').addEventListener('click', exportLeadsToCsv);
document.getElementById('clearBtn').addEventListener('click', clearStoredLeads);

loadCities();
applyActiveCity();
updateCounter();

const activeCityDefault = localStorage.getItem(ACTIVE_CITY_KEY);
if (activeCityDefault) {
  Array.from(document.getElementById('citySelect').options).forEach(option => {
    option.selected = option.value === activeCityDefault;
  });
  updateChipsFromSelect();
}

if (localStorage.getItem(USER_ROLE_KEY) === 'admin') {
  updateRoleUI();
} else if (localStorage.getItem(USER_ROLE_KEY) === 'user') {
  updateRoleUI();
} else {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}
