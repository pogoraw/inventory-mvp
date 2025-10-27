```markdown
# Inventory MVP (React Native + Node.js)

מטרה
אב‑טיפוס MVP של מערכת ניהול מלאי ושילוחים עם אופליין בסיסי וסנכרון:

- Mobile: Expo (React Native + TypeScript)
- Backend: Node.js + Express + SQLite (better-sqlite3)
- פונקציונליות: מוצרים עם שדות נוספים, שילוחים (טיוטה→נארז→נשלח→נמסר), מסך שילוח עם "סריקה" סימולטיבית (שדה טקסט), כפתור "שליחה עכשיו" שמוריד מהמלאי, אופליין בסיסי עם changeLog וסנכרון.

הרצת הפרויקט (בסביבת פיתוח)
1. Clone (או העתק את התיקיות כאן) ופתח שני טרמינלים.

2. שרת:
   cd server
   npm install
   npm run dev
   - השרת רץ ב־http://localhost:4000 (או 0.0.0.0:4000)

3. לקוח (Expo):
   cd client
   npm install
   npm start
   - פתח Expo במכשיר/אמולטור. עבור אמולטור אנדרואיד, ודא ש‑API_BASE ב־client/src/services/api.ts מצביע ל‑http://10.0.2.2:4000. עבור iOS/simulator או מכשיר אמיתי השתמש בכתובת ה‑IP של המכונה המארחת (לדוגמה http://192.168.1.10:4000).

שרתי Demo users
- קיימים משתמשים לדמו במערכת:
  - username: manager  (role: manager)
  - username: worker   (role: worker)
  - ללא סיסמה (מטרת prototype)

מה להוסיף בהמשך (הצעות)
- סריקה במצלמה (expo-barcode-scanner)
- ייצוא Excel/PDF
- Push notifications (FCM)
- שדרוג מנגנון סנכרון (delta sync, conflict resolution)
- הצפנת DB מקומי (SQLCipher) ו‑audit log מתקדם

הערות בטיחות
- זהו prototype — אין כאן מדיניות אבטחה חזקה (DB ללא הצפנה, auth פשוט). אין להריץ production ללא חיזוק אבטחה.

```