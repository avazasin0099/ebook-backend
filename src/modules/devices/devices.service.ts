import {
  UserDevice,
  DrmDeviceAuthorization,
  PlatformSetting,
} from '../../database/models';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

export class DevicesService {
  public async registerDevice(
    userId: string,
    data: {
      deviceIdentifier: string;
      deviceName: string;
      deviceModel: string;
      osVersion?: string;
      appVersion?: string;
      devicePublicKey?: string;
    }
  ) {
    // 1. Check if device already registered for this user
    let device = await UserDevice.findOne({
      where: { userId, deviceIdentifier: data.deviceIdentifier },
    });

    if (device) {
      if (device.status === 'BLOCKED') {
        throw new ForbiddenError('This device has been blocked by security policy');
      }

      await device.update({
        deviceName: data.deviceName,
        deviceModel: data.deviceModel,
        osVersion: data.osVersion || device.osVersion,
        appVersion: data.appVersion || device.appVersion,
        devicePublicKey: data.devicePublicKey || device.devicePublicKey,
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      });

      return device;
    }

    // 2. Enforce Max Authorized Devices Quota
    const setting = await PlatformSetting.findByPk('max_devices_per_customer');
    const maxAllowed = (setting?.value as any)?.value || 3;

    const activeCount = await UserDevice.count({
      where: { userId, status: 'ACTIVE' },
    });

    if (activeCount >= maxAllowed) {
      throw new BadRequestError(
        `Maximum authorized device limit of ${maxAllowed} reached. Please de-authorize an existing device from your account settings.`,
        'DEVICE_LIMIT_EXCEEDED'
      );
    }

    // 3. Register new device
    device = await UserDevice.create({
      userId,
      deviceIdentifier: data.deviceIdentifier,
      deviceName: data.deviceName,
      deviceModel: data.deviceModel,
      osVersion: data.osVersion,
      appVersion: data.appVersion,
      devicePublicKey: data.devicePublicKey,
      status: 'ACTIVE',
      registeredAt: new Date(),
      lastSeenAt: new Date(),
    });

    return device;
  }

  public async listUserDevices(userId: string) {
    return await UserDevice.findAll({
      where: { userId },
      order: [['lastSeenAt', 'DESC']],
    });
  }

  public async revokeDevice(deviceId: string, userId: string, roleName: string) {
    const device = await UserDevice.findByPk(deviceId);
    if (!device) throw new NotFoundError('Device not found');

    if (roleName !== 'SUPER_ADMIN' && roleName !== 'ADMIN' && device.userId !== userId) {
      throw new ForbiddenError('Access denied to revoke this device');
    }

    await device.update({ status: 'REVOKED' });

    // Revoke DRM authorizations on this device
    await DrmDeviceAuthorization.update(
      { status: 'REVOKED' },
      { where: { deviceId: device.id } }
    );

    return device;
  }
}

export const devicesService = new DevicesService();
