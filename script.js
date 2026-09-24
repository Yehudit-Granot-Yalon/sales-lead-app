
  alert("JS עובד בהצלחה!"); // בדיקה זמנית
  
  const STORAGE_KEY = 'sales_leads_data';
  // ... שאר הקוד שלך// הגדרת סיסמת המנהלת (תוכלי לשנות אותה לכל מה שתרצי)
  const ADMIN_PASSWORD = "1234";

  // פתיחה של חלון מנהלת רק לאחר אימות סיסמה
  function openAdmin() {
    const enteredPassword = prompt("נא להזין סיסמת מנהלת:");

    // אם המשתמש לחץ 'ביטול'
    if (enteredPassword === null) {
      return; 
    }

    // בדיקת נכונות הסיסמה
    if (enteredPassword === ADMIN_PASSWORD) {
      document.getElementById('adminModal').style.display = 'flex';
      document.getElementById('citySelectInput').value = localStorage.getItem(ACTIVE_CITY_KEY) || '';
      updateCounter();
    } else {
      alert("סיסמה שגויה! הגישה נדחתה.");
    }
  }