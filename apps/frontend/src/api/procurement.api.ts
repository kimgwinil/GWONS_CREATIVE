/**
 * GWONS_CREATIVE — Procurement API (Phase 3)
 * 조달 단계 API: 조달 목록, H/W 발주서, S/W 발주서, 납품 일정표, 조달 검토서
 *
 * 협업 흐름:
 *   기획팀+조달팀 (직렬): ProcurementList 확정
 *   → 조달팀 H/W 트랙 (병렬): PurchaseOrder
 *   → 조달팀 S/W 트랙 (병렬): SoftwareOrder
 *   → 합류: DeliverySchedule
 *   → 기획팀 (직렬): ProcurementReview (컨펌 게이트 #3)
 */
import { fetchPaginated, apiClient } from './client';
import { PaginationInput, PaginatedResponse } from '../types/pagination';

// ─────────────────────────────────────────────────────────
// 공통 타입
// ─────────────────────────────────────────────────────────
export type Currency = 'KRW' | 'USD' | 'EUR';
export type ItemPriority = 'critical' | 'high' | 'medium' | 'low';

// ─────────────────────────────────────────────────────────
// 1. 조달 목록 (ProcurementList)
// ─────────────────────────────────────────────────────────
export type ProcurementListStatus = 'drafting' | 'in_review' | 'approved' | 'locked';
export type ProcurementCategory = 'hardware' | 'software' | 'content' | 'service' | 'material';

export interface ProcurementLineItem {
  lineNo: number;
  itemName: string;
  category: ProcurementCategory;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  currency: Currency;
  vendorName?: string;
  isCustom: boolean;
  customSpec?: string;
  marketResearchId?: string;
  priority: ItemPriority;
  leadTimeDays: number;
  notes?: string;
}

export interface BudgetSummary {
  hardware: number;
  software: number;
  content: number;
  service: number;
  material: number;
  contingency: number;
  totalEstimated: number;
}

export interface ProcurementList {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ProcurementListStatus;
  lineItems: ProcurementLineItem[];
  budgetSummary?: BudgetSummary;
  totalBudget?: number;
  contingencyRate: number;
  version: number;
  designReviewId?: string;
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const procurementListsApi = {
  list: (
    input: PaginationInput & {
      projectId?: string;
      status?: ProcurementListStatus;
    },
  ): Promise<PaginatedResponse<ProcurementList>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.status) extra.status = input.status;
    return fetchPaginated<ProcurementList>('/api/v1/procurement-lists', input, extra);
  },
  get: (id: string) =>
    apiClient.get<ProcurementList>(`/api/v1/procurement-lists/${id}`).then((r) => r.data),
  create: (data: Partial<ProcurementList>) =>
    apiClient.post<ProcurementList>('/api/v1/procurement-lists', data).then((r) => r.data),
  update: (id: string, data: Partial<ProcurementList>) =>
    apiClient.patch<ProcurementList>(`/api/v1/procurement-lists/${id}`, data).then((r) => r.data),
  submitForReview: (id: string) =>
    apiClient
      .post<ProcurementList>(`/api/v1/procurement-lists/${id}/submit-for-review`)
      .then((r) => r.data),
  approve: (id: string, data: { approvedBy: string; approvalNotes?: string }) =>
    apiClient
      .post<ProcurementList>(`/api/v1/procurement-lists/${id}/approve`, data)
      .then((r) => r.data),
  lock: (id: string) =>
    apiClient
      .post<ProcurementList>(`/api/v1/procurement-lists/${id}/lock`)
      .then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/v1/procurement-lists/${id}`),
};

// ─────────────────────────────────────────────────────────
// 2. H/W 발주서 (PurchaseOrder)
// ─────────────────────────────────────────────────────────
export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'inspected'
  | 'cancelled';

export type PaymentTerms = 'prepaid' | 'net_30' | 'net_60' | 'installment' | 'cod';

export interface OrderLineItem {
  lineNo: number;
  itemName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: Currency;
  procurementListItemRef?: number;
}

export interface InspectionResult {
  inspectedAt: string;
  inspectedBy: string;
  passedItems: number;
  failedItems: number;
  defectDetails?: string;
  overallResult: 'pass' | 'fail' | 'conditional_pass';
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  orderNo: string;
  title: string;
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  status: PurchaseOrderStatus;
  lineItems: OrderLineItem[];
  totalAmount?: number;
  currency: Currency;
  paymentTerms?: PaymentTerms;
  requiredDeliveryDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryAddress?: string;
  specialConditions?: string;
  inspectionResult?: InspectionResult;
  inspectionPass?: boolean;
  procurementListId?: string;
  orderedBy?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  inspectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const purchaseOrdersApi = {
  list: (
    input: PaginationInput & {
      projectId?: string;
      status?: PurchaseOrderStatus;
      vendorName?: string;
    },
  ): Promise<PaginatedResponse<PurchaseOrder>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.status) extra.status = input.status;
    if (input.vendorName) extra.vendorName = input.vendorName;
    return fetchPaginated<PurchaseOrder>('/api/v1/purchase-orders', input, extra);
  },
  get: (id: string) =>
    apiClient.get<PurchaseOrder>(`/api/v1/purchase-orders/${id}`).then((r) => r.data),
  create: (data: Partial<PurchaseOrder>) =>
    apiClient.post<PurchaseOrder>('/api/v1/purchase-orders', data).then((r) => r.data),
  update: (id: string, data: Partial<PurchaseOrder>) =>
    apiClient
      .patch<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, data)
      .then((r) => r.data),
  submit: (id: string) =>
    apiClient
      .post<PurchaseOrder>(`/api/v1/purchase-orders/${id}/submit`)
      .then((r) => r.data),
  confirm: (id: string, data: { confirmedDate: string }) =>
    apiClient
      .post<PurchaseOrder>(`/api/v1/purchase-orders/${id}/confirm`, data)
      .then((r) => r.data),
  markInTransit: (id: string, data: { expectedDeliveryDate: string }) =>
    apiClient
      .post<PurchaseOrder>(`/api/v1/purchase-orders/${id}/in-transit`, data)
      .then((r) => r.data),
  markDelivered: (id: string, data: { actualDeliveryDate: string }) =>
    apiClient
      .post<PurchaseOrder>(`/api/v1/purchase-orders/${id}/deliver`, data)
      .then((r) => r.data),
  inspect: (
    id: string,
    data: {
      inspectedBy: string;
      passedItems: number;
      failedItems: number;
      defectDetails?: string;
      overallResult: 'pass' | 'fail' | 'conditional_pass';
    },
  ) =>
    apiClient
      .post<PurchaseOrder>(`/api/v1/purchase-orders/${id}/inspect`, data)
      .then((r) => r.data),
  cancel: (id: string, reason: string) =>
    apiClient
      .post<PurchaseOrder>(`/api/v1/purchase-orders/${id}/cancel`, { reason })
      .then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/v1/purchase-orders/${id}`),
};

// ─────────────────────────────────────────────────────────
// 3. S/W·콘텐츠 발주서 (SoftwareOrder)
// ─────────────────────────────────────────────────────────
export type SoftwareOrderStatus =
  | 'draft'
  | 'contracted'
  | 'in_development'
  | 'testing'
  | 'delivered'
  | 'accepted'
  | 'cancelled';

export type SoftwareOrderType =
  | 'license'
  | 'custom_dev'
  | 'saas'
  | 'content'
  | 'maintenance';

export interface DevMilestone {
  milestoneNo: number;
  title: string;
  description?: string;
  dueDate: string;
  deliverables: string[];
  paymentRate?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completedAt?: string;
  notes?: string;
}

export interface TechRequirement {
  reqNo: number;
  category: string;
  description: string;
  priority: 'must' | 'should' | 'nice_to_have';
  isMet?: boolean;
}

export interface TestResult {
  testedAt: string;
  testedBy: string;
  totalTestCases: number;
  passedCases: number;
  failedCases: number;
  issues?: string[];
  overallResult: 'pass' | 'fail' | 'conditional_pass';
}

export interface SoftwareOrder {
  id: string;
  projectId: string;
  orderNo: string;
  title: string;
  orderType: SoftwareOrderType;
  vendorName: string;
  vendorContact?: string;
  status: SoftwareOrderStatus;
  contractAmount?: number;
  currency: Currency;
  isCustomDevelopment: boolean;
  techRequirements: TechRequirement[];
  milestones: DevMilestone[];
  licenseCount?: number;
  licenseMonths?: number;
  requiredDeliveryDate?: string;
  expectedDeliveryDate?: string;
  contractSignedAt?: string;
  contractFileUrl?: string;
  deliverableFileUrl?: string;
  testResults?: TestResult;
  testPassed?: boolean;
  testedAt?: string;
  acceptedAt?: string;
  notes?: string;
  procurementListId?: string;
  orderedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const softwareOrdersApi = {
  list: (
    input: PaginationInput & {
      projectId?: string;
      status?: SoftwareOrderStatus;
      orderType?: SoftwareOrderType;
    },
  ): Promise<PaginatedResponse<SoftwareOrder>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.status) extra.status = input.status;
    if (input.orderType) extra.orderType = input.orderType;
    return fetchPaginated<SoftwareOrder>('/api/v1/software-orders', input, extra);
  },
  get: (id: string) =>
    apiClient.get<SoftwareOrder>(`/api/v1/software-orders/${id}`).then((r) => r.data),
  create: (data: Partial<SoftwareOrder>) =>
    apiClient.post<SoftwareOrder>('/api/v1/software-orders', data).then((r) => r.data),
  update: (id: string, data: Partial<SoftwareOrder>) =>
    apiClient
      .patch<SoftwareOrder>(`/api/v1/software-orders/${id}`, data)
      .then((r) => r.data),
  contract: (id: string, data: { contractSignedAt: string; contractFileUrl?: string }) =>
    apiClient
      .post<SoftwareOrder>(`/api/v1/software-orders/${id}/contract`, data)
      .then((r) => r.data),
  startDevelopment: (id: string) =>
    apiClient
      .post<SoftwareOrder>(`/api/v1/software-orders/${id}/start-development`)
      .then((r) => r.data),
  submitForTesting: (id: string, data: { deliverableFileUrl?: string }) =>
    apiClient
      .post<SoftwareOrder>(`/api/v1/software-orders/${id}/submit-for-testing`, data)
      .then((r) => r.data),
  test: (
    id: string,
    data: {
      testedBy: string;
      totalTestCases: number;
      passedCases: number;
      failedCases: number;
      issues?: string[];
      overallResult: 'pass' | 'fail' | 'conditional_pass';
    },
  ) =>
    apiClient
      .post<SoftwareOrder>(`/api/v1/software-orders/${id}/test`, data)
      .then((r) => r.data),
  accept: (id: string) =>
    apiClient
      .post<SoftwareOrder>(`/api/v1/software-orders/${id}/accept`)
      .then((r) => r.data),
  cancel: (id: string, reason: string) =>
    apiClient
      .post<SoftwareOrder>(`/api/v1/software-orders/${id}/cancel`, { reason })
      .then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/v1/software-orders/${id}`),
};

// ─────────────────────────────────────────────────────────
// 4. 납품 일정표 (DeliverySchedule)
// ─────────────────────────────────────────────────────────
export type DeliveryScheduleStatus =
  | 'planning'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'delayed';

export interface DeliveryEvent {
  eventId: string;
  orderType: 'purchase' | 'software';
  orderId: string;
  orderNo: string;
  itemSummary: string;
  vendorName: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'delivered' | 'delayed' | 'cancelled';
  location?: string;
  notes?: string;
  delayDays?: number;
  delayReason?: string;
}

export interface InstallationLink {
  zone: string;
  requiredByDate: string;
  linkedOrderIds: string[];
  notes?: string;
}

export interface DeliverySchedule {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: DeliveryScheduleStatus;
  deliveryEvents: DeliveryEvent[];
  installationLinks: InstallationLink[];
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  totalEvents: number;
  completedEvents: number;
  delayedEvents: number;
  procurementListId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const deliverySchedulesApi = {
  list: (
    input: PaginationInput & {
      projectId?: string;
      status?: DeliveryScheduleStatus;
    },
  ): Promise<PaginatedResponse<DeliverySchedule>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.status) extra.status = input.status;
    return fetchPaginated<DeliverySchedule>('/api/v1/delivery-schedules', input, extra);
  },
  get: (id: string) =>
    apiClient.get<DeliverySchedule>(`/api/v1/delivery-schedules/${id}`).then((r) => r.data),
  create: (data: Partial<DeliverySchedule>) =>
    apiClient.post<DeliverySchedule>('/api/v1/delivery-schedules', data).then((r) => r.data),
  update: (id: string, data: Partial<DeliverySchedule>) =>
    apiClient
      .patch<DeliverySchedule>(`/api/v1/delivery-schedules/${id}`, data)
      .then((r) => r.data),
  confirm: (id: string) =>
    apiClient
      .post<DeliverySchedule>(`/api/v1/delivery-schedules/${id}/confirm`)
      .then((r) => r.data),
  startProgress: (id: string) =>
    apiClient
      .post<DeliverySchedule>(`/api/v1/delivery-schedules/${id}/start-progress`)
      .then((r) => r.data),
  updateEvent: (
    id: string,
    eventId: string,
    data: {
      status: 'pending' | 'delivered' | 'delayed' | 'cancelled';
      actualDate?: string;
      delayDays?: number;
      delayReason?: string;
      notes?: string;
    },
  ) =>
    apiClient
      .patch<DeliverySchedule>(`/api/v1/delivery-schedules/${id}/events/${eventId}`, data)
      .then((r) => r.data),
  complete: (id: string) =>
    apiClient
      .post<DeliverySchedule>(`/api/v1/delivery-schedules/${id}/complete`)
      .then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/v1/delivery-schedules/${id}`),
};

// ─────────────────────────────────────────────────────────
// 5. 조달 통합 검토서 (ProcurementReview) — 컨펌 게이트 #3
// ─────────────────────────────────────────────────────────
export type ProcurementReviewStatus =
  | 'collecting'
  | 'in_review'
  | 'budget_check'
  | 'client_review'
  | 'approved'
  | 'rejected';

export interface Phase3Deliverable {
  teamName: string;
  deliverableType: 'procurement_list' | 'purchase_order' | 'software_order' | 'delivery_schedule';
  deliverableId: string;
  deliverableTitle: string;
  isCompleted: boolean;
  amount?: number;
  completedAt?: string;
  notes?: string;
}

export interface BudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  varianceRate: number;
  withinBudget: boolean;
}

export interface ProcurementIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'delay' | 'budget' | 'spec' | 'vendor' | 'other';
  description: string;
  impact: string;
  resolution?: string;
  status: 'open' | 'resolved';
  resolvedAt?: string;
}

export interface ProcurementReview {
  id: string;
  projectId: string;
  title: string;
  executiveSummary?: string;
  status: ProcurementReviewStatus;
  deliverables: Phase3Deliverable[];
  budgetComparisons: BudgetComparison[];
  procurementIssues: ProcurementIssue[];
  totalProcurementAmount?: number;
  budgetVariance?: number;
  isWithinBudget?: boolean;
  internalNotes?: string;
  clientFeedback?: string;
  version: number;
  procurementListId?: string;
  deliveryScheduleId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const procurementReviewsApi = {
  list: (
    input: PaginationInput & {
      projectId?: string;
      status?: ProcurementReviewStatus;
    },
  ): Promise<PaginatedResponse<ProcurementReview>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.status) extra.status = input.status;
    return fetchPaginated<ProcurementReview>('/api/v1/procurement-reviews', input, extra);
  },
  get: (id: string) =>
    apiClient.get<ProcurementReview>(`/api/v1/procurement-reviews/${id}`).then((r) => r.data),
  create: (data: Partial<ProcurementReview>) =>
    apiClient.post<ProcurementReview>('/api/v1/procurement-reviews', data).then((r) => r.data),
  update: (id: string, data: Partial<ProcurementReview>) =>
    apiClient
      .patch<ProcurementReview>(`/api/v1/procurement-reviews/${id}`, data)
      .then((r) => r.data),
  submitForReview: (id: string) =>
    apiClient
      .post<ProcurementReview>(`/api/v1/procurement-reviews/${id}/submit-for-review`)
      .then((r) => r.data),
  proceedToBudgetCheck: (id: string) =>
    apiClient
      .post<ProcurementReview>(`/api/v1/procurement-reviews/${id}/budget-check`)
      .then((r) => r.data),
  submitToClient: (id: string) =>
    apiClient
      .post<ProcurementReview>(`/api/v1/procurement-reviews/${id}/submit-to-client`)
      .then((r) => r.data),
  approve: (id: string, data: { approvedBy: string; clientFeedback?: string }) =>
    apiClient
      .post<ProcurementReview>(`/api/v1/procurement-reviews/${id}/approve`, data)
      .then((r) => r.data),
  reject: (id: string, feedback: string) =>
    apiClient
      .post<ProcurementReview>(`/api/v1/procurement-reviews/${id}/reject`, { feedback })
      .then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/v1/procurement-reviews/${id}`),
};
