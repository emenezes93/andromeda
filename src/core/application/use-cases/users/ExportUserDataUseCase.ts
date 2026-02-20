import type { UserExportDto } from '@ports/repositories/IUserExportRepository.js';
import type { IUserExportRepository } from '@ports/repositories/IUserExportRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

/**
 * Use case: Export all personal data for a user (GDPR right of access).
 */
export class ExportUserDataUseCase {
  constructor(private readonly userExportRepository: IUserExportRepository) {}

  async execute(userId: string): Promise<UserExportDto> {
    const data = await this.userExportRepository.getExportData(userId);
    if (!data) throw new NotFoundError('User not found');
    return data;
  }
}
