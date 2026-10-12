@echo off
rem Tospik ile Kodlama - yerel sunucu
cd /d "%~dp0"
echo.
echo  Bilgisayarda:  http://localhost:8765
echo.
echo  Tablette (ayni Wi-Fi):
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' -or $_.InterfaceAlias -like '*Ethernet*' } | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notlike 'vEthernet*' } | Select-Object -First 1 -ExpandProperty IPAddress)"') do echo    http://%%i:8765
echo.
echo  Kapatmak icin bu pencereyi kapat.
echo.
start "" http://localhost:8765
python -m http.server 8765 --bind 0.0.0.0
