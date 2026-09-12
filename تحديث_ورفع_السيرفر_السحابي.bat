@echo off
chcp 65001 >nul
title تحديث ورفع سَنَد إكسبريس إلى السيرفر السحابي
color 0b
echo ============================================================
echo   سَنَد إكسبريس ^| Sanad Express - أداة التحديث السحابي
echo ============================================================
echo.
echo [1/3] جاري فحص ملفات الإنتاج المحدثة...
cd /d "C:\Users\يونس\.gemini\antigravity\scratch\sanad-express-repo"

echo [2/3] جاري رفع التحديثات إلى GitHub و Render...
"C:\Users\يونس\.gemini\antigravity\scratch\mingit\cmd\git.exe" push origin main

echo.
if %errorlevel% equ 0 (
    color 0a
    echo ============================================================
    echo   [نجاح] تم رفع جميع التحديثات بنجاح إلى GitHub!
    echo   السيرفر السحابي في Render يقوم بالتحديث التلقائي الآن.
    echo   رابط الموقع: https://sanadexpress.onrender.com
    echo   رابط المندوب: https://sanadexpress.onrender.com/driver
    echo ============================================================
) else (
    echo.
    echo [تنبيه] إذا طُلب منك اسم المستخدم أو Token، أدخله للمتابعة.
)
echo.
pause
