@echo off
set "PATH=C:\Users\Farjana Sumi\AppData\Local\Programs\Git\cmd;C:\Users\Farjana Sumi\AppData\Local\Programs\Git\mingw64\bin;%PATH%"
cd /d "%~dp0"
echo Pushing repository to GitHub...
git branch -M main
git push -u origin main
pause
