const bcrypt = require('bcryptjs');
const { User } = require('../models');

const MIN_PASSWORD_LENGTH = 12;

const adminEmail = () => String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();

// Keeps exactly one Admin account, defined only by ADMIN_EMAIL / ADMIN_PASSWORD (server/.env).
// There is no public admin registration; other accounts can never become Admin.
async function ensureAdmin() {
  const email = adminEmail();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = String(process.env.ADMIN_NAME || 'BUP Administrator').trim();

  // 'Visitor' is a legacy role that cannot log in, so demoting to it disables an account.
  const disableAdmins = (except) =>
    User.updateMany(
      except ? { role: 'Admin', _id: { $ne: except } } : { role: 'Admin' },
      { role: 'Visitor' }
    );

  if (!email || !password) {
    await disableAdmins();
    console.warn('Admin account disabled: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env.');
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    await disableAdmins();
    console.error(`Admin account disabled: ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }

  let admin = await User.findOne({ email });

  if (!admin) {
    admin = await User.create({
      name,
      email,
      role: 'Admin',
      facultyProfile: null,
      passwordHash: await bcrypt.hash(password, 12)
    });
    console.log(`Admin account created for ${email}.`);
  } else {
    admin.role = 'Admin';
    admin.name = name;
    admin.facultyProfile = null;

    // Only re-hash when the configured password changed.
    if (!(await bcrypt.compare(password, admin.passwordHash))) {
      admin.passwordHash = await bcrypt.hash(password, 12);
    }

    await admin.save();
  }

  await disableAdmins(admin._id);
}

module.exports = { ensureAdmin, adminEmail };
