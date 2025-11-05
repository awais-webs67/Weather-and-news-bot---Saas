const Database = require('better-sqlite3');
const db = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/98c3c1f63fee9f6dbbae7bd3ab92e985a88f1f2ea08d78a7bc88bc6f8d14d6b3.sqlite');

console.log('\n=== USERS ===');
const users = db.prepare('SELECT id, email, name, created_at FROM users').all();
console.log('Total users:', users.length);
users.forEach(u => console.log(`- ${u.email} (${u.name})`));

console.log('\n=== ADMIN USERS ===');
const admins = db.prepare('SELECT * FROM admin_users').all();
console.log('Total admins:', admins.length);
admins.forEach(a => console.log(`- ${a.username}`));

console.log('\n=== API SETTINGS ===');
const settings = db.prepare('SELECT setting_key, setting_value FROM api_settings').all();
settings.forEach(s => {
  const value = s.setting_value ? (s.setting_value.length > 20 ? s.setting_value.substring(0, 20) + '...' : s.setting_value) : 'NULL';
  console.log(`- ${s.setting_key}: ${value}`);
});

db.close();
