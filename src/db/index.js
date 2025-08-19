require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to database');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};

module.exports = { prisma, connectDB };