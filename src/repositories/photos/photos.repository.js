const { prisma } = require('../../utils/prisma');

async function addPhotos(itemId, photos) {
  await prisma.itemPhoto.createMany({
    data: photos.map((p) => ({
      itemId,
      url: p.url,
    })),
    skipDuplicates: true,
  });

  const allPhotos = await prisma.itemPhoto.findMany({
    where: { itemId },
    orderBy: { createdAt: 'asc' },
  });

  return allPhotos;
}

async function deletePhoto(itemId, photoId) {
    const photo = await prisma.itemPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.itemId !== itemId) return false;
  
    await prisma.itemPhoto.delete({ where: { id: photoId } });
    return true;
  }

module.exports = { addPhotos, deletePhoto };
