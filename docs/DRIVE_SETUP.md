# חיבור Google Drive ל־PhysIQ

## 1. יצירת Service Account

1. פתחו Google Cloud Console ובחרו את הפרויקט של PhysIQ.
2. הפעילו את **Google Drive API**.
3. עברו אל IAM & Admin → Service Accounts וצרו חשבון שירות.
4. צרו מפתח JSON והורידו אותו למחשב. אין להעלות את הקובץ ל־GitHub.

## 2. שיתוף תיקיית הלימוד

1. פתחו ב־Google Drive את התיקייה שמכילה את חומרי הלימוד.
2. שתפו אותה כ־Viewer עם כתובת המייל `client_email` שמופיעה בקובץ ה־JSON.
3. העתיקו את מזהה התיקייה מתוך הכתובת בדפדפן.

## 3. הגדרת Railway

הוסיפו לשירות ה־Backend את משתני הסביבה הבאים:

```env
GOOGLE_DRIVE_FOLDER_ID=1h2UuAmDBveKi-XGYhsNMw1fe317pHZ9r
GOOGLE_DRIVE_STORAGE_FOLDER_ID=1Rxoj4LFuVqWNZoMUig4SQ31JRht2k53m
GOOGLE_DRIVE_EXAMS_ROOT_FOLDER_ID=1uSsFWQbN2pPtgayHpghQKSWKIcO1M32b
GOOGLE_DRIVE_PHYSICS_EXAMS_FOLDER_ID=1h2UuAmDBveKi-XGYhsNMw1fe317pHZ9r
GOOGLE_SERVICE_ACCOUNT_JSON={תוכן קובץ ה-JSON בשורה אחת}
```

אין להוסיף מרכאות חיצוניות סביב ה־JSON. הקוד סורק באופן רקורסיבי את תיקיית
בגרויות הפיזיקה ואת תיקיות המשנה שלה. לאחר השמירה Railway יבצע פריסה מחדש.

## 4. בדיקה

פתחו באתר "העלה חומרים" → "חומרי לימוד מ־Drive". רשימת הקבצים אמורה להופיע.
לחיצה על "סנכרן עכשיו" מאנדקסת Google Docs, קובצי טקסט ו־PDF. אם ההגדרה חסרה,
האתר ממשיך לעבוד ומציג הודעה ש־Google Drive אינו מחובר.
