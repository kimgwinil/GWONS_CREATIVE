/**
 * GWONS_CREATIVE — PurchaseOrder DTOs
 */
import { PurchaseOrderStatus, PaymentTerms, OrderLineItem, InspectionResult } from '../entities/purchase-order.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreatePurchaseOrderDto {
  projectId: string;
  orderNo: string;
  title: string;
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  lineItems?: OrderLineItem[];
  currency?: 'KRW' | 'USD' | 'EUR';
  paymentTerms?: PaymentTerms;
  requiredDeliveryDate?: Date;
  deliveryAddress?: string;
  specialConditions?: string;
  procurementListId?: string;
  orderedBy?: string;
}

export class UpdatePurchaseOrderDto {
  title?: string;
  vendorContact?: string;
  vendorEmail?: string;
  lineItems?: OrderLineItem[];
  paymentTerms?: PaymentTerms;
  requiredDeliveryDate?: Date;
  expectedDeliveryDate?: Date;
  deliveryAddress?: string;
  specialConditions?: string;
}

export class InspectPurchaseOrderDto {
  inspectedBy: string;
  passedItems: number;
  failedItems: number;
  defectDetails?: string;
  overallResult: 'pass' | 'fail' | 'conditional_pass';
}

export class ListPurchaseOrdersDto extends PaginationInputDto {
  projectId?: string;
  status?: PurchaseOrderStatus;
  vendorName?: string;
}
