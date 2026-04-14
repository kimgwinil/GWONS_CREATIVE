import { ResearchCategory, ResearchStatus, VendorQuote, TechSpec } from '../entities/market-research.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateMarketResearchDto {
  projectId: string;
  itemName: string;
  description?: string;
  category: ResearchCategory;
  quantity?: number;
  unit?: string;
  vendorQuotes?: VendorQuote[];
  techSpecs?: TechSpec[];
  researchedBy?: string;
  procurementItemId?: string;
  contentSpecRef?: string;
}

export class UpdateMarketResearchDto {
  itemName?: string;
  description?: string;
  quantity?: number;
  vendorQuotes?: VendorQuote[];
  techSpecs?: TechSpec[];
  recommendedVendor?: string;
  recommendationReason?: string;
  isCustomizable?: boolean;
  customizationSpec?: string;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
}

export class ListMarketResearchesDto extends PaginationInputDto {
  projectId?: string;
  category?: ResearchCategory;
  status?: ResearchStatus;
}
