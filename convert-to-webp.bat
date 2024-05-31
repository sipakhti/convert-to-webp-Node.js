@echo OFF
set source=%1
set sink=%2
set overwriteSource=%3
node "C:\Users\omers\Desktop\Programming\Image optimizer\convert-to-webp-Node.js\main.js" %source% %sink% %overwriteSource%