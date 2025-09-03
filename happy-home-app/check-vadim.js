const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('prisma/dev.db');

db.all("SELECT id, email, password FROM users WHERE email = 'vadimexpert95@gmail.com'", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('User vadimexpert95@gmail.com:');
    console.log(rows);
    
    if (rows.length > 0) {
      const user = rows[0];
      if (user.password) {
        console.log(`Password hash: ${user.password}`);
        console.log(`Password length: ${user.password.length}`);
      } else {
        console.log('No password set!');
      }
    }
  }
  
  db.close();
});