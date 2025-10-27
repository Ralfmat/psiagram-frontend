# Uruchamianie psiagrama - development [na telefonie]

## Jak uruchomić u siebie:

1. Zainstalujcie node jak nie macie [raczej nie macie]:

   ```bash
   # Download and install Chocolatey:
   powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
   
   # Download and install Node.js:
   choco install nodejs --version="22.21.0"
   
   # Verify the Node.js version:
   node -v # Should print "v22.21.0".
   
   # Verify npm version:
   npm -v # Should print "10.9.4".

   ```

2. Wejdźcie w miesjce w którym checie mieć projekt, ale nie twórzcie folderu.

   ja jestem np. w
   ```bash
   C:\>
   ```
3. Pobierzcie sobie na telefon aplikacje **Expo Go** z sklepu play albo apple store

4. Sklonujcie repo i przejdźcie do folderu z aplikacją:

   ```bash
   git clone https://github.com/Ralfmat/psiagram-frontend.git
   cd .\psiagram-frontend\psiagram\
   ```

5. Instalacja zależności [pobiorą się wszystkie paczki, biblioteki itd.]

   ```bash
   npm install
   ```

6. Uruchomienie aplikacji

   ```bash
   npx expo start
   ```
7. W terminalu powinien wyświetlić się QR code [output jak poniżej]:

<img width="947" height="837" alt="image" src="https://github.com/user-attachments/assets/b8364e5e-27a5-4720-98ad-b169914eb0a0" />

8. Z aplikacji **Expo Go** skanujecie kod QR i aplikacja wyświetla się na telefonie.

9. Od teraz można programować apkę. Każda zapisana zmiana wyśietla się na telefonie.
