/**
 * Script to create the first admin user
 * Usage: node scripts/createAdmin.js
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get user input
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    if (!name || !email || !password) {
      console.error('All fields are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Password must be at least 6 characters!');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      permissions: [String],
      isActive: Boolean,
    }));

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('User with this email already exists!');
      process.exit(1);
    }

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      permissions: ['inventory', 'shipments', 'finance', 'defects'],
      isActive: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('----------------------------------------');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Permissions: ${admin.permissions.join(', ')}`);
    console.log('----------------------------------------');
    console.log('\nYou can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

createAdmin();

