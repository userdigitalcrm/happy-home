const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('prisma/dev.db');

// Let's test with a few common passwords
const testPasswords = ['password', 'admin123', '123456', 'vadim123', 'password123'];

db.get("SELECT password FROM users WHERE email = 'vadimexpert95@gmail.com'", (err, row) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('User not found');
    db.close();
    return;
  }
  
  const hashedPassword = row.password;
  console.log('Testing passwords for vadimexpert95@gmail.com...');
  
  let found = false;
  for (const password of testPasswords) {
    const isValid = bcrypt.compareSync(password, hashedPassword);
    if (isValid) {
      console.log(`✅ Password found: ${password}`);
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log('❌ None of the test passwords matched');
    console.log('You might need to reset the password or check what was entered during creation');
  }
  
  db.close();
});