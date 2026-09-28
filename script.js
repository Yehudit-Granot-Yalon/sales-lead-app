const STORAGE_KEY = 'sales_leads_data';
const CITIES_KEY = 'sales_cities_list';
const ACTIVE_CITY_KEY = 'sales_active_city';
const PASSWORD_KEY = 'sales_admin_password';
const USER_ROLE_KEY = 'sales_user_role';

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
    adminToggleBtn.style.display = 'block';
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

function loadCities() {
  const defaultCities = ['אלעד', 'בני ברק', 'ירושלים', 'בית שמש', 'פתח תקווה', 'רמת גן', 'חיפה', 'נתניה'];
  const savedCities = JSON.parse(localStorage.getItem(CITIES_KEY)) || defaultCities;
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
}

function saveEventCity() {
  const chosenCity = document.getElementById('citySelectInput').value.trim();
  if (!chosenCity) {
    alert('נא להקליד או לבחור עיר');
    return;
  }

  let savedCities = JSON.parse(localStorage.getItem(CITIES_KEY)) || ['אלעד', 'בני ברק', 'ירושלים', 'בית שמש'];
  if (!savedCities.includes(chosenCity)) {
    savedCities.push(chosenCity);
    localStorage.setItem(CITIES_KEY, JSON.stringify(savedCities));
    loadCities();
  }

  localStorage.setItem(ACTIVE_CITY_KEY, chosenCity);
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
  document.getElementById('leadCount').innerText = `סה"כ נרשמו עד כה: ${leads.length}`;
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

document.getElementById('leadForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const activeCity = localStorage.getItem(ACTIVE_CITY_KEY);
  const selectedCities = Array.from(document.getElementById('citySelect').selectedOptions)
    .map(option => option.value.trim())
    .filter(Boolean);
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const contactError = document.getElementById('contactError');
  const noCityError = document.getElementById('noCityError');
  const successMsg = document.getElementById('successMsg');

  contactError.style.display = 'none';
  noCityError.style.display = 'none';

  const finalCities = selectedCities.length ? selectedCities : (activeCity ? [activeCity] : []);

  if (!finalCities.length) {
    noCityError.style.display = 'block';
    return;
  }

  if (!phone && !email) {
    contactError.style.display = 'block';
    return;
  }

  const newLead = {
    city: finalCities.join(', '),
    cities: finalCities,
    phone: phone,
    email: email,
    date: new Date().toLocaleString('he-IL')
  };

  const leads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  leads.push(newLead);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));

  document.getElementById('phone').value = '';
  document.getElementById('email').value = '';

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
}

if (localStorage.getItem(USER_ROLE_KEY) === 'admin') {
  updateRoleUI();
} else if (localStorage.getItem(USER_ROLE_KEY) === 'user') {
  updateRoleUI();
} else {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}
