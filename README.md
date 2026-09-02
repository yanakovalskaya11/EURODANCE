# EURODANCE

В данном файле будет описано как установить и запустить веб-приложение «EURODANCE» у себя на локальном компьютере:
1. Установить Node.js
2. Выполнить установку с настройками по умолчанию (отметить галочку "Automatically install the necessary tools")
3. Установить PostgreSQL
4. Открываем pgAdmin4
5. Создаем новую базу данных с названием «eurodance».
6. Нажимаем правой кнопкой мыши на базе данных и выбираем пункт «restore», после чего выбираем из папки «INSTALL» файл «eurodance.sql»
7. Установить зависимости:
npm install
8. Создать файл .env в корне проекта со следующим содержимым:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_NAME=eurodance
9. Выполнить в терминале:
npm start
10. Открыть приложение по адресу: http://localhost:3000

