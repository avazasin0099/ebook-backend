import sequelize, {
  Role,
  Permission,
  RolePermission,
  User,
  RefreshToken,
  UserDevice,
  Category,
  Author,
  Publisher,
  Book,
  BookCategory,
  BookAuthor,
  BookPublisher,
  BookFile,
  BookPreview,
  Order,
  OrderItem,
  Payment,
  Refund,
  BookPurchase,
  DrmLicense,
  DrmDeviceAuthorization,
  DrmDownload,
  DrmLicenseEvent,
  ReadingProgress,
  Bookmark,
  ReadingActivity,
  AuditLog,
  Notification,
  SupportTicket,
  PlatformSetting,
} from './models';

export async function runMigrations(alter = true): Promise<void> {
  console.log('🔄 Initializing database schema synchronization...');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Synchronize all models
    await sequelize.sync({ alter });
    console.log('✅ All 25 database models synchronized successfully.');
  } catch (error) {
    console.error('❌ Database migration error:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✨ Migration process completed.');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
