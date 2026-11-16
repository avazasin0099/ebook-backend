import bcrypt from 'bcryptjs';
import {
  sequelize,
  Role,
  Permission,
  RolePermission,
  User,
  Category,
  Author,
  Publisher,
  Book,
  BookCategory,
  BookAuthor,
  BookPublisher,
  PlatformSetting,
} from './models';

export async function runSeeders(): Promise<void> {
  console.log('🌱 Starting database seeders...');
  const transaction = await sequelize.transaction();

  try {
    // 1. Seed Exactly Three Roles
    const [superAdminRole] = await Role.findOrCreate({
      where: { name: 'SUPER_ADMIN' },
      defaults: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with unconditional platform authority',
      },
      transaction,
    });

    const [adminRole] = await Role.findOrCreate({
      where: { name: 'ADMIN' },
      defaults: {
        name: 'ADMIN',
        description: 'Operational Administrator for daily catalogue and order management',
      },
      transaction,
    });

    const [customerRole] = await Role.findOrCreate({
      where: { name: 'CUSTOMER' },
      defaults: {
        name: 'CUSTOMER',
        description: 'End customer who purchases and reads encrypted digital publications',
      },
      transaction,
    });

    console.log('✅ Roles seeded (SUPER_ADMIN, ADMIN, CUSTOMER).');

    // 2. Seed Granular Permissions
    const permissionsData = [
      { name: 'books.create', module: 'books', description: 'Create and upload manuscripts' },
      { name: 'books.read', module: 'books', description: 'Browse and view books' },
      { name: 'books.update', module: 'books', description: 'Edit book metadata and pricing' },
      { name: 'books.delete', module: 'books', description: 'Archive and remove books' },
      { name: 'books.publish', module: 'books', description: 'Publish and unpublish books' },
      { name: 'categories.manage', module: 'categories', description: 'Manage book taxonomy' },
      { name: 'authors.manage', module: 'authors', description: 'Manage author profiles' },
      { name: 'publishers.manage', module: 'publishers', description: 'Manage publisher profiles' },
      { name: 'orders.read', module: 'orders', description: 'View customer orders' },
      { name: 'orders.manage', module: 'orders', description: 'Manage order statuses' },
      { name: 'payments.read', module: 'payments', description: 'Inspect payment logs' },
      { name: 'refunds.process', module: 'payments', description: 'Approve and initiate Cashfree refunds' },
      { name: 'customers.read', module: 'customers', description: 'View customer accounts' },
      { name: 'customers.manage', module: 'customers', description: 'Suspend or activate customers' },
      { name: 'admins.manage', module: 'admins', description: 'Create and configure Admin accounts' },
      { name: 'drm.view', module: 'drm', description: 'View DRM licenses and devices' },
      { name: 'drm.manage', module: 'drm', description: 'Revoke licenses and reset device bindings' },
      { name: 'reports.view', module: 'reports', description: 'View sales and financial analytics' },
      { name: 'reports.export', module: 'reports', description: 'Export Excel reports' },
      { name: 'settings.manage', module: 'settings', description: 'Update platform-wide settings' },
      { name: 'audit.view', module: 'audit', description: 'Inspect system audit trails' },
    ];

    const createdPermissions: Permission[] = [];
    for (const p of permissionsData) {
      const [perm] = await Permission.findOrCreate({
        where: { name: p.name },
        defaults: p,
        transaction,
      });
      createdPermissions.push(perm);
    }
    console.log(`✅ ${createdPermissions.length} permissions verified.`);

    // 3. Assign All Permissions to SUPER_ADMIN
    for (const perm of createdPermissions) {
      await RolePermission.findOrCreate({
        where: { roleId: superAdminRole.id, permissionId: perm.id },
        defaults: { roleId: superAdminRole.id, permissionId: perm.id },
        transaction,
      });
    }

    // 4. Assign Permitted Operational Permissions to ADMIN
    const adminAllowedPermissionNames = [
      'books.create',
      'books.read',
      'books.update',
      'books.publish',
      'categories.manage',
      'authors.manage',
      'publishers.manage',
      'orders.read',
      'payments.read',
      'customers.read',
      'drm.view',
      'reports.view',
      'reports.export',
    ];

    for (const perm of createdPermissions) {
      if (adminAllowedPermissionNames.includes(perm.name)) {
        await RolePermission.findOrCreate({
          where: { roleId: adminRole.id, permissionId: perm.id },
          defaults: { roleId: adminRole.id, permissionId: perm.id },
          transaction,
        });
      }
    }
    console.log('✅ Role-Permission mappings assigned.');

    // 5. Seed Core Role Accounts (SUPER_ADMIN, ADMIN, CUSTOMER)
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

    const defaultAccounts = [
      {
        email: (process.env.SUPERADMIN_EMAIL || 'superadmin@avazas.com').toLowerCase(),
        password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123',
        roleId: superAdminRole.id,
        firstName: 'Avazas',
        lastName: 'SuperAdmin',
      },
      {
        email: 'admin@avazas.com',
        password: 'Admin@123',
        roleId: adminRole.id,
        firstName: 'Operational',
        lastName: 'Admin',
      },
      {
        email: 'customer@avazas.com',
        password: 'Customer@123',
        roleId: customerRole.id,
        firstName: 'Demo',
        lastName: 'Customer',
      },
    ];

    for (const acc of defaultAccounts) {
      const passwordHash = await bcrypt.hash(acc.password, saltRounds);
      const existing = await User.findOne({ where: { email: acc.email }, transaction });
      if (existing) {
        await existing.update(
          {
            roleId: acc.roleId,
            passwordHash,
            firstName: acc.firstName,
            lastName: acc.lastName,
            status: 'ACTIVE',
            emailVerified: true,
          },
          { transaction }
        );
        console.log(`✅ Default account verified & updated: ${acc.email}`);
      } else {
        await User.create(
          {
            roleId: acc.roleId,
            email: acc.email,
            passwordHash,
            firstName: acc.firstName,
            lastName: acc.lastName,
            status: 'ACTIVE',
            emailVerified: true,
            phoneVerified: true,
          },
          { transaction }
        );
        console.log(`✅ Default account created: ${acc.email}`);
      }
    }

    // 6. Seed Standard Categories
    const categoriesSeed = [
      { name: 'Computer Science & Software', slug: 'computer-science-software', displayOrder: 1 },
      { name: 'Business & Management', slug: 'business-management', displayOrder: 2 },
      { name: 'Science Fiction & Fantasy', slug: 'sci-fi-fantasy', displayOrder: 3 },
      { name: 'Self-Improvement & Productivity', slug: 'self-improvement', displayOrder: 4 },
      { name: 'Academic & Higher Education', slug: 'academic-education', displayOrder: 5 },
      { name: 'History & Biographies', slug: 'history-biographies', displayOrder: 6 },
    ];

    for (const cat of categoriesSeed) {
      await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat,
        transaction,
      });
    }
    console.log('✅ Base book categories seeded.');

    // 7. Seed Platform Settings
    const defaultSettings = [
      {
        key: 'max_devices_per_customer',
        value: { value: 3 },
        description: 'Maximum number of concurrent authorized devices per customer account',
      },
      {
        key: 'drm_offline_days_limit',
        value: { value: 30 },
        description: 'Number of consecutive offline days allowed before mandatory license ping',
      },
      {
        key: 'platform_branding',
        value: {
          productName: 'Avazas Books',
          company: 'Avazas',
          supportEmail: 'support@avazas.com',
          currency: 'INR',
        },
        description: 'Global platform branding metadata',
      },
    ];

    for (const setting of defaultSettings) {
      await PlatformSetting.findOrCreate({
        where: { key: setting.key },
        defaults: setting,
        transaction,
      });
    }
    console.log('✅ Default platform settings seeded.');

    // 8. Seed Authors and Publishers
    const [author1] = await Author.findOrCreate({
      where: { name: 'Dr. Aditya Sharma' },
      defaults: {
        name: 'Dr. Aditya Sharma',
        biography: 'Principal Cloud Security Architect with 15+ years in distributed systems.',
      },
      transaction,
    });

    const [author2] = await Author.findOrCreate({
      where: { name: 'Priya Nair' },
      defaults: {
        name: 'Priya Nair',
        biography: 'Staff Cryptography Researcher and Applied Machine Learning Engineer.',
      },
      transaction,
    });

    const [publisher] = await Publisher.findOrCreate({
      where: { name: 'Avazas Technical Publishing' },
      defaults: {
        name: 'Avazas Technical Publishing',
        description: 'Commercial publishing arm of Avazas specializing in secure digital publications.',
        website: 'https://avazas.com',
      },
      transaction,
    });

    // 9. Seed Standard Publications (All in Indian Rupees INR ₹)
    const csCategory = await Category.findOne({ where: { slug: 'computer-science-software' }, transaction });
    const bizCategory = await Category.findOne({ where: { slug: 'business-management' }, transaction });

    const booksSeed = [
      {
        title: 'Cloud Native Microservices Architecture',
        slug: 'cloud-native-microservices-architecture',
        subtitle: 'Designing Resilient Distributed Systems with Go, Docker and Kubernetes',
        description: 'A comprehensive, production-grade guide to building scalable, fault-tolerant microservices. Covers service meshes, gRPC, distributed tracing, and zero-downtime CI/CD deployments.',
        language: 'English',
        pageCount: 420,
        basePrice: 599,
        salePrice: 399,
        currency: 'INR',
        availableFormats: 'EPUB',
        status: 'PUBLISHED',
        isFeatured: true,
        author: author1,
        category: csCategory,
      },
      {
        title: 'Zero-Trust Network Security & Applied Cryptography',
        slug: 'zero-trust-network-security-cryptography',
        subtitle: 'Modern Defense-in-Depth for Enterprise Cloud Infrastructure',
        description: 'Explore the cryptographic foundations of identity-aware proxies, mutual TLS, Readium LCP content protection, and end-to-end envelope encryption.',
        language: 'English',
        pageCount: 380,
        basePrice: 799,
        salePrice: 499,
        currency: 'INR',
        availableFormats: 'BOTH',
        status: 'PUBLISHED',
        isFeatured: true,
        author: author2,
        category: csCategory,
      },
      {
        title: 'Production Machine Learning with PyTorch',
        slug: 'production-machine-learning-pytorch',
        subtitle: 'From Jupyter Notebooks to High-Throughput Edge and Cloud Inference',
        description: 'Learn best practices for training, quantizing, serving, and monitoring modern deep learning models using PyTorch, ONNX Runtime, and TensorRT.',
        language: 'English',
        pageCount: 460,
        basePrice: 899,
        salePrice: 599,
        currency: 'INR',
        availableFormats: 'EPUB',
        status: 'PUBLISHED',
        isFeatured: true,
        author: author2,
        category: csCategory,
      },
      {
        title: 'Modern Full-Stack Engineering with React & Node',
        slug: 'modern-full-stack-engineering-react-node',
        subtitle: 'Building Robust Web Applications with TypeScript, Tailwind and PostgreSQL',
        description: 'Complete hands-on masterclass in building modern production web applications. Covers state management, secure JWT rotation, payments, and automated CI pipelines.',
        language: 'English',
        pageCount: 350,
        basePrice: 699,
        salePrice: 449,
        currency: 'INR',
        availableFormats: 'BOTH',
        status: 'PUBLISHED',
        isFeatured: true,
        author: author1,
        category: csCategory,
      },
      {
        title: 'Enterprise DevOps & Kubernetes Mastery',
        slug: 'enterprise-devops-kubernetes-mastery',
        subtitle: 'GitOps, Observability, and Multi-Cloud Infrastructure Automation',
        description: 'Practical guide for platform engineers to manage multi-tenant Kubernetes clusters, ArgoCD GitOps pipelines, Prometheus monitoring, and disaster recovery.',
        language: 'English',
        pageCount: 390,
        basePrice: 749,
        salePrice: 499,
        currency: 'INR',
        availableFormats: 'EPUB',
        status: 'PUBLISHED',
        isFeatured: true,
        author: author1,
        category: csCategory,
      },
      {
        title: 'Digital Product Leadership & Scaling Strategies',
        slug: 'digital-product-leadership-scaling',
        subtitle: 'Proven Playbooks for Managing High-Growth Engineering & Product Teams',
        description: 'Essential guide for technology leaders, engineering managers, and startup founders on roadmapping, OKRs, customer metrics, and team execution.',
        language: 'English',
        pageCount: 310,
        basePrice: 649,
        salePrice: 399,
        currency: 'INR',
        availableFormats: 'PDF',
        status: 'PUBLISHED',
        isFeatured: true,
        author: author1,
        category: bizCategory,
      },
    ];

    for (const b of booksSeed) {
      const [book, created] = await Book.findOrCreate({
        where: { slug: b.slug },
        defaults: {
          title: b.title,
          slug: b.slug,
          subtitle: b.subtitle,
          description: b.description,
          language: b.language,
          pageCount: b.pageCount,
          basePrice: b.basePrice,
          salePrice: b.salePrice,
          currency: b.currency,
          availableFormats: b.availableFormats,
          status: b.status,
          isFeatured: b.isFeatured,
        },
        transaction,
      });

      if (b.category) {
        await BookCategory.findOrCreate({
          where: { bookId: book.id, categoryId: b.category.id },
          defaults: { bookId: book.id, categoryId: b.category.id },
          transaction,
        });
      }

      if (b.author) {
        await BookAuthor.findOrCreate({
          where: { bookId: book.id, authorId: b.author.id },
          defaults: { bookId: book.id, authorId: b.author.id },
          transaction,
        });
      }

      if (publisher) {
        await BookPublisher.findOrCreate({
          where: { bookId: book.id, publisherId: publisher.id },
          defaults: { bookId: book.id, publisherId: publisher.id },
          transaction,
        });
      }
    }
    console.log('✅ 6 Featured technical publications seeded in INR (₹).');

    await transaction.commit();
    console.log('🎉 Seed process finished successfully.');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed with error:', error);
    throw error;
  }
}

if (require.main === module) {
  runSeeders()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
