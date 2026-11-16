import sequelize from '../../config/database';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import User from './User';
import RefreshToken from './RefreshToken';
import UserDevice from './UserDevice';
import Category from './Category';
import Author from './Author';
import Publisher from './Publisher';
import Book from './Book';
import BookCategory from './BookCategory';
import BookAuthor from './BookAuthor';
import BookPublisher from './BookPublisher';
import BookFile from './BookFile';
import BookPreview from './BookPreview';
import Order from './Order';
import OrderItem from './OrderItem';
import Payment from './Payment';
import Refund from './Refund';
import BookPurchase from './BookPurchase';
import DrmLicense from './DrmLicense';
import DrmDeviceAuthorization from './DrmDeviceAuthorization';
import DrmDownload from './DrmDownload';
import DrmLicenseEvent from './DrmLicenseEvent';
import ReadingProgress from './ReadingProgress';
import Bookmark from './Bookmark';
import ReadingActivity from './ReadingActivity';
import AuditLog from './AuditLog';
import Notification from './Notification';
import SupportTicket from './SupportTicket';
import PlatformSetting from './PlatformSetting';

// Role <-> User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Role <-> Permission
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> UserDevice
User.hasMany(UserDevice, { foreignKey: 'userId', as: 'devices' });
UserDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category hierarchy
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

// Book <-> Category
Book.belongsToMany(Category, {
  through: BookCategory,
  foreignKey: 'bookId',
  otherKey: 'categoryId',
  as: 'categories',
});
Category.belongsToMany(Book, {
  through: BookCategory,
  foreignKey: 'categoryId',
  otherKey: 'bookId',
  as: 'books',
});

// Book <-> Author
Book.belongsToMany(Author, {
  through: BookAuthor,
  foreignKey: 'bookId',
  otherKey: 'authorId',
  as: 'authors',
});
Author.belongsToMany(Book, {
  through: BookAuthor,
  foreignKey: 'authorId',
  otherKey: 'bookId',
  as: 'books',
});

// Book <-> Publisher
Book.belongsToMany(Publisher, {
  through: BookPublisher,
  foreignKey: 'bookId',
  otherKey: 'publisherId',
  as: 'publishers',
});
Publisher.belongsToMany(Book, {
  through: BookPublisher,
  foreignKey: 'publisherId',
  otherKey: 'bookId',
  as: 'books',
});

// Book <-> Files & Previews
Book.hasMany(BookFile, { foreignKey: 'bookId', as: 'files' });
BookFile.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

Book.hasMany(BookPreview, { foreignKey: 'bookId', as: 'previews' });
BookPreview.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// User <-> Order <-> OrderItem
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Book.hasMany(OrderItem, { foreignKey: 'bookId', as: 'orderItems' });
OrderItem.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// Order <-> Payment <-> Refund
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Payment.hasMany(Refund, { foreignKey: 'paymentId', as: 'refunds' });
Refund.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

// User & Book <-> BookPurchase (Entitlements)
User.hasMany(BookPurchase, { foreignKey: 'userId', as: 'purchases' });
BookPurchase.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Book.hasMany(BookPurchase, { foreignKey: 'bookId', as: 'purchases' });
BookPurchase.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

Order.hasMany(BookPurchase, { foreignKey: 'orderId', as: 'entitlements' });
BookPurchase.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// DRM Associations
BookPurchase.hasMany(DrmLicense, { foreignKey: 'purchaseId', as: 'licenses' });
DrmLicense.belongsTo(BookPurchase, { foreignKey: 'purchaseId', as: 'purchase' });

User.hasMany(DrmLicense, { foreignKey: 'userId', as: 'licenses' });
DrmLicense.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Book.hasMany(DrmLicense, { foreignKey: 'bookId', as: 'licenses' });
DrmLicense.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

DrmLicense.hasMany(DrmDeviceAuthorization, { foreignKey: 'licenseId', as: 'authorizations' });
DrmDeviceAuthorization.belongsTo(DrmLicense, { foreignKey: 'licenseId', as: 'license' });

UserDevice.hasMany(DrmDeviceAuthorization, { foreignKey: 'deviceId', as: 'authorizations' });
DrmDeviceAuthorization.belongsTo(UserDevice, { foreignKey: 'deviceId', as: 'device' });

DrmLicense.hasMany(DrmDownload, { foreignKey: 'licenseId', as: 'downloads' });
DrmDownload.belongsTo(DrmLicense, { foreignKey: 'licenseId', as: 'license' });

DrmLicense.hasMany(DrmLicenseEvent, { foreignKey: 'licenseId', as: 'events' });
DrmLicenseEvent.belongsTo(DrmLicense, { foreignKey: 'licenseId', as: 'license' });

// Reading Progress, Bookmarks, Activity
User.hasMany(ReadingProgress, { foreignKey: 'userId', as: 'readingProgress' });
ReadingProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Book.hasMany(ReadingProgress, { foreignKey: 'bookId', as: 'readingProgress' });
ReadingProgress.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Book.hasMany(Bookmark, { foreignKey: 'bookId', as: 'bookmarks' });
Bookmark.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

User.hasMany(ReadingActivity, { foreignKey: 'userId', as: 'readingActivities' });
ReadingActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// System Tables
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default sequelize;
export {
  sequelize,
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
};
