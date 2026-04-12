@echo off
cd /d C:\Users\liras\Downloads\job-finder-api

echo Iniciando coleta de leads...
node index.js

timeout /t 5

echo Executando coleta e envio...
curl http://localhost:3000/run-now

echo Finalizado!
exit