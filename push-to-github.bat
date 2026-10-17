@echo off
echo ========================================================
echo   CyberShield - Push to GitHub (ishikapoddar1406)
echo ========================================================
echo.
echo Pushing branch 'main' to https://github.com/ishikapoddar1406/cybershield.git ...
echo (A browser window or sign-in popup may appear for GitHub authentication)
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! CyberShield has been uploaded to GitHub!
    echo   View your repository at:
    echo   https://github.com/ishikapoddar1406/cybershield
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. Make sure you created the empty repo 'cybershield' at:
    echo https://github.com/new
)
echo.
pause
