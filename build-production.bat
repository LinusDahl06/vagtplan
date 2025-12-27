@echo off
echo ========================================
echo ScheduHub Production Build Script
echo ========================================
echo.

REM Check if logged into EAS
echo [1/5] Checking EAS login status...
npx eas-cli whoami >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Not logged into EAS CLI
    echo Please run: npx eas-cli login
    echo.
    pause
    exit /b 1
)
echo ✓ Logged into EAS

echo.
echo [2/5] Verifying build directories exist...
if not exist "J:\Apps\ScheduHub-Android" mkdir "J:\Apps\ScheduHub-Android"
if not exist "J:\Apps\ScheduHub-IOS" mkdir "J:\Apps\ScheduHub-IOS"
echo ✓ Build directories ready

echo.
echo [3/5] Select build platform:
echo   1. Android only
echo   2. iOS only
echo   3. Both platforms
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starting Android production build...
    echo This will take approximately 10-20 minutes.
    echo.
    npx eas-cli build --platform android --profile production --non-interactive

    if errorlevel 1 (
        echo.
        echo Android build failed. Check the error messages above.
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo Android build completed successfully!
    echo ========================================
    echo.
    echo Download the AAB file from the link above and move it to:
    echo J:\Apps\ScheduHub-Android\
    echo.
    echo Recommended filename: scheduhub-v1.0.0-production.aab
    echo.

) else if "%choice%"=="2" (
    echo.
    echo Starting iOS production build...
    echo This will take approximately 15-30 minutes.
    echo You may be prompted for Apple Developer credentials.
    echo.
    npx eas-cli build --platform ios --profile production --non-interactive

    if errorlevel 1 (
        echo.
        echo iOS build failed. Check the error messages above.
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo iOS build completed successfully!
    echo ========================================
    echo.
    echo Download the IPA file from the link above and move it to:
    echo J:\Apps\ScheduHub-IOS\
    echo.
    echo Recommended filename: scheduhub-v1.0.0-production.ipa
    echo.

) else if "%choice%"=="3" (
    echo.
    echo Starting builds for both platforms...
    echo This will take approximately 20-40 minutes total.
    echo You may be prompted for Apple Developer credentials for iOS.
    echo.
    npx eas-cli build --platform all --profile production --non-interactive

    if errorlevel 1 (
        echo.
        echo Build failed. Check the error messages above.
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo Both builds completed successfully!
    echo ========================================
    echo.
    echo Download the build files from the links above and organize them:
    echo.
    echo Android AAB → J:\Apps\ScheduHub-Android\scheduhub-v1.0.0-production.aab
    echo iOS IPA     → J:\Apps\ScheduHub-IOS\scheduhub-v1.0.0-production.ipa
    echo.

) else (
    echo.
    echo Invalid choice. Please run the script again and select 1, 2, or 3.
    pause
    exit /b 1
)

echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Download build files from EAS dashboard
echo 2. Move files to respective directories
echo 3. Upload to Google Play Console (Android)
echo 4. Upload to App Store Connect (iOS)
echo.
echo For detailed instructions, see BUILD_PRODUCTION.md
echo.
pause
