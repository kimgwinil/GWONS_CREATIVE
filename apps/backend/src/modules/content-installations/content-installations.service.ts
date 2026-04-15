/**
 * GWONS_CREATIVE — ContentInstallationsService
 * 소프트웨어팀: 콘텐츠 설치 + 시스템 연동
 * Phase 4 병렬 — SW·콘텐츠 트랙
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentInstallation, InstallationStatus, IntegrationTestResult } from './entities/content-installation.entity';
import {
  CreateContentInstallationDto, UpdateContentInstallationDto,
  UpdateInstallationItemDto, AddIntegrationTestDto,
  ListContentInstallationsDto,
} from './dto/content-installation.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContentInstallationsService {
  constructor(
    @InjectRepository(ContentInstallation)
    private readonly repo: Repository<ContentInstallation>,
  ) {}

  async findAll(dto: ListContentInstallationsDto): Promise<PaginatedResponse<ContentInstallation>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<ContentInstallation> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`콘텐츠 설치(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateContentInstallationDto): Promise<ContentInstallation> {
    const items = dto.installationItems ?? [];
    const item = this.repo.create({
      ...dto,
      installationItems: items,
      integrationTests:  [],
      techIssues:        [],
      totalItems:     items.length,
      installedItems: items.filter(i => i.status === 'installed').length,
      failedItems:    items.filter(i => i.status === 'failed').length,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateContentInstallationDto): Promise<ContentInstallation> {
    const item = await this.findOne(id);
    if (item.status === InstallationStatus.COMPLETED) {
      throw new BadRequestException('완료된 설치는 수정 불가합니다.');
    }
    if (dto.installationItems) {
      item.totalItems     = dto.installationItems.length;
      item.installedItems = dto.installationItems.filter(i => i.status === 'installed').length;
      item.failedItems    = dto.installationItems.filter(i => i.status === 'failed').length;
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 설치 착수 */
  async startInstallation(id: string): Promise<ContentInstallation> {
    const item = await this.findOne(id);
    if (item.status !== InstallationStatus.PENDING) {
      throw new BadRequestException('대기(pending) 상태만 설치 착수 가능합니다.');
    }
    if (!item.installationItems?.length) {
      throw new BadRequestException('설치 항목(installationItems)이 최소 1개 이상 필요합니다.');
    }
    item.status = InstallationStatus.IN_PROGRESS;
    return this.repo.save(item);
  }

  /** 개별 설치 항목 업데이트 */
  async updateItem(id: string, itemId: string, dto: UpdateInstallationItemDto): Promise<ContentInstallation> {
    const installation = await this.findOne(id);
    if (![InstallationStatus.IN_PROGRESS, InstallationStatus.FAILED].includes(installation.status)) {
      throw new BadRequestException('설치 진행 중 상태에서만 항목 업데이트 가능합니다.');
    }
    const instItem = installation.installationItems.find(i => i.itemId === itemId);
    if (!instItem) throw new BadRequestException(`설치 항목(${itemId})을 찾을 수 없습니다.`);

    Object.assign(instItem, dto);
    installation.installedItems = installation.installationItems.filter(i => i.status === 'installed').length;
    installation.failedItems    = installation.installationItems.filter(i => i.status === 'failed').length;

    // 실패 항목이 있으면 FAILED
    if (installation.failedItems > 0 && installation.status === InstallationStatus.IN_PROGRESS) {
      installation.status = InstallationStatus.FAILED;
    }
    // 모두 설치 완료
    const activeItems = installation.installationItems.filter(i => i.status !== 'rolled_back');
    if (activeItems.length > 0 && activeItems.every(i => i.status === 'installed')) {
      installation.status = InstallationStatus.INTEGRATION;
    }
    return this.repo.save(installation);
  }

  /** 시스템 연동 테스트 추가 */
  async addIntegrationTest(id: string, dto: AddIntegrationTestDto): Promise<ContentInstallation> {
    const item = await this.findOne(id);
    if (item.status !== InstallationStatus.INTEGRATION) {
      throw new BadRequestException('연동 중(integration) 상태에서만 연동 테스트 추가 가능합니다.');
    }
    const testResult: IntegrationTestResult = {
      testId:        uuidv4(),
      testName:      dto.testName,
      targetSystems: dto.targetSystems,
      testedAt:      new Date().toISOString(),
      testedBy:      dto.testedBy,
      result:        dto.result,
      errorDetails:  dto.errorDetails,
      notes:         dto.notes,
    };
    item.integrationTests = [...item.integrationTests, testResult];
    // 실패 없이 모두 pass/partial이면 TESTING으로
    const hasFailures = item.integrationTests.some(t => t.result === 'fail');
    if (!hasFailures && item.integrationTests.length > 0) {
      item.status = InstallationStatus.TESTING;
    }
    return this.repo.save(item);
  }

  /** 최종 완료 */
  async complete(id: string): Promise<ContentInstallation> {
    const item = await this.findOne(id);
    if (![InstallationStatus.TESTING, InstallationStatus.INTEGRATION].includes(item.status)) {
      throw new BadRequestException('테스트 또는 연동 중 상태만 완료 처리 가능합니다.');
    }
    const openCriticals = item.techIssues.filter(i => i.severity === 'critical' && i.status === 'open');
    if (openCriticals.length > 0) {
      throw new BadRequestException(`Critical 기술 이슈 ${openCriticals.length}건 미해결 상태입니다.`);
    }
    item.status      = InstallationStatus.COMPLETED;
    item.actualEndDate = new Date();
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.status === InstallationStatus.COMPLETED) {
      throw new BadRequestException('완료된 설치는 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
