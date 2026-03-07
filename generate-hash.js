const bcrypt = require('bcryptjs');

async function run() {
  const value = '1540568e'; // The password or security key you want to hash
  const hash = await bcrypt.hash(value, 10);
  console.log('Hash for 1540568e:', hash);
}

run();
