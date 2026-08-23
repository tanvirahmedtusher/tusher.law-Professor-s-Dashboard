@echo off
cd /d "%~dp0"
echo Staging and committing files to Git...
git add .
git commit -m "Update ScholarFlow dashboard: Full mobile & tablet responsiveness and complete production build"
echo Pushing repository to GitHub...
git branch -M main
git push -u origin main
pause
