# اصحى — Asa7a

تطبيق منبه ذكي بيحسب أحسن أوقات الصحيان بناءً على دورات النوم العلمية.

## خطوات رفع المشروع على GitHub

### 1. عمل repo جديد
- افتح github.com
- اضغط **New repository**
- اسمه: `asa7a`
- اتركه Public
- اضغط **Create repository**

### 2. رفع الملفات
في صفحة الـ repo الجديد:
- اضغط **uploading an existing file**
- ارفع كل الملفات دي بنفس الترتيب:
  - `package.json`
  - `capacitor.config.json`
  - مجلد `src/` (index.html, style.css, app.js, alarm.js, moonphase.js, stars.js, colorwheel.js)
  - مجلد `.github/workflows/build.yml`

### 3. تشغيل الـ Build
- روح على تاب **Actions** في الـ repo
- هتلاقي workflow اسمه "Build APK" بيشتغل تلقائي
- استنى 5-10 دقايق
- بعد ما يخلص، اضغط على الـ run وفي الأسفل هتلاقي **Artifacts**
- نزّل `asa7a-debug.apk`

### 4. تثبيت الـ APK
- انقل الـ APK للتليفون
- من الإعدادات، فعّل "تثبيت من مصادر غير معروفة"
- افتح الـ APK وثبته

## ملاحظة
الـ APK ده debug version — يشتغل على طول بدون أي signing.

## المميزات
- حساب دورات النوم (90 دقيقة/دورة)
- طور القمر الحقيقي لكل يوم
- منبه ذكي يرن دورة دورة
- شاشة رنين قابلة للتخصيص (لون + رسالة)
- يرن حتى لو التليفون على صامت
- ثيم تلقائي (ليل/نهار)
