#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Website Analytics Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
    console.log('⚠️  Please edit .env file with your database credentials\n');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Dependencies installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check PostgreSQL connection
console.log('\n🔍 Checking PostgreSQL connection...');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'siteanalytics',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n📋 Please ensure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database credentials in .env are correct');
    console.log('   3. Database "siteanalytics" exists');
    console.log('\n💡 To create database:');
    console.log('   CREATE DATABASE siteanalytics;');
    console.log('   CREATE USER siteanalytics_user WITH PASSWORD \'your_password\';');
    console.log('   GRANT ALL PRIVILEGES ON DATABASE siteanalytics TO siteanalytics_user;');
  } else {
    console.log('✅ Database connection successful');
    console.log(`   Connected to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  }
  
  pool.end();
  
  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Test the API: http://localhost:3001/api/health');
  console.log('   3. Try the demo: http://localhost:3001/shared/demo.html');
  console.log('\n📚 Documentation: README.md');
}); 