const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('prisma/dev.db');

db.all("SELECT email, password FROM users WHERE email = 'admin@happyhome.kz'", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Результаты поиска admin@happyhome.kz:');
    console.log(rows);
  }
  
  db.close();
});