@echo off
echo ========================================
echo         ScheduHub Backup Script
echo ========================================
echo.

cd /d "j:\Apps\vagtplan-new"

echo Adding all changes...
git add .

echo.
echo Creating backup commit...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%
git commit -m "Backup: %timestamp%"

echo.
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo         Backup Complete!
echo ========================================
echo.
pause
