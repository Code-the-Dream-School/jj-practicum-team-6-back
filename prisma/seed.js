const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  //CONFIG -----
  const DEMO_EMAIL = 'demo@lostfound.app';
  const DEMO_PASSWORD = 'demo12345';
  const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

  const categories = ['Electronics', 'Clothing', 'Keys', 'Documents', 'Other'];

  // CATEGORIES (idempotent by name)
  const categoryMap = {};
  for (const name of categories) {
    let cat = await prisma.category.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name } });
    }
    categoryMap[name] = cat.id;
  }

  // DEMO USER
  let demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demoUser) {
    const hashed = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    demoUser = await prisma.user.create({
      data: {
        firstName: 'Demo',
        lastName: 'User',
        email: DEMO_EMAIL,
        password: hashed,
        zipCode: '10001',
        phoneNumber: null,
        avatarUrl: null,
      },
    });
  }

  // DEMO ITEMS
  const demoItems = [
    {
      title: 'Black Wallet',
      description: 'Lost near the cafeteria. [DEMO]',
      status: 'LOST', // ItemStatus enum: LOST | FOUND | RESOLVED
      categoryName: 'Documents',
      zipCode: '10001',
      lat: 40.7484,
      lng: -73.9857,
    },
    {
      title: 'AirPods Case',
      description: 'Found in coworking lounge. [DEMO]',
      status: 'FOUND',
      categoryName: 'Electronics',
      zipCode: '94103',
      lat: 37.7739,
      lng: -122.4312,
    },
    {
      title: 'Blue Scarf',
      description: 'Lost in Library, 2nd floor. [DEMO]',
      status: 'LOST',
      categoryName: 'Clothing',
      zipCode: '60601',
      lat: 41.8853,
      lng: -87.6216,
    },
    {
      title: 'Set of Keys',
      description: 'Found by the parking lot. [DEMO]',
      status: 'FOUND',
      categoryName: 'Keys',
      zipCode: '27601',
      lat: 35.7796,
      lng: -78.6382,
    },
  ];

  for (const it of demoItems) {
    const exists = await prisma.item.findFirst({
      where: {
        title: it.title,
        ownerId: demoUser.id,
      },
      select: { id: true },
    });

    if (!exists) {
      await prisma.item.create({
        data: {
          title: it.title,
          description: it.description,
          status: it.status, // enum
          zipCode: it.zipCode,
          latitude: it.lat,
          longitude: it.lng,
          isResolved: it.status === 'RESOLVED' ? true : false,
          owner: { connect: { id: demoUser.id } },
          category: { connect: { name: it.categoryName } },
        },
      });
    }
  }

  console.log('Seed completed: categories, demo user, demo items are in place.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
