const { PrismaClient } = require('@prisma/client');

// Create a singleton Prisma client to avoid exhausting connections in dev
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
  // try to connect and log status
  prisma.$connect()
    .then(() => console.log('Prisma: connected to database'))
    .catch((err) => console.error('Prisma connection error:', err));
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
    // try to connect and log status (dev)
    global.prisma.$connect()
      .then(() => console.log('Prisma (dev): connected to database'))
      .catch((err) => console.error('Prisma (dev) connection error:', err));
  }
  prisma = global.prisma;
}

// handle runtime errors
prisma.$on && prisma.$on('error', (e) => {
  console.error('Prisma runtime error:', e);
});

module.exports = prisma;
