@echo off
title BIO SENTINEL-X Application Launcher
echo =======================================================================
echo               BIO SENTINEL-X APPLICATION LAUNCHER
echo Smart Biomedical Waste Detection, Segregation, Tracking & Collection OS
echo =======================================================================
echo.
echo Starting BioSentinel-X Application Server...
echo AI Vision Model: YOLOv8 (best.pt)
echo Opening Application in Browser at http://127.0.0.1:8000/
echo.

set KMP_DUPLICATE_LIB_OK=TRUE
"C:\Users\SHANMUGA\anaconda4\python.exe" -m backend.app.main

pause
