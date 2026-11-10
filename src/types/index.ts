export interface ProductVariant {
  id: string;
  name: string;
  type: 'color' | 'size' | 'material';
  value: string;
  inStock: boolean;
  isActive?: boolean;
  priceModifier?: number;
  imageIndex?: number;
  supplierSku?: string;
}

export interface DropshipDetails {
  supplierId: string;
  supplierName: string;
  supplierSku: string;
  supplierCost: number;
  marginPercentage: number;
  markupMultiplier: number;
  fulfillmentCenter: string;
  countryOfOrigin: string;
  leadTimeHours: number;
  estimatedTransitDays: string;
  shippingCarriers: string[];
  stockSyncedAt: string;
  syncStatus: 'active' | 'syncing' | 'delayed';
}

export interface ProductDetails {
  materials: string[];
  dimensions?: string;
  weight?: string;
  origin: string;
  careInstructions?: string[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  editorialStory?: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryLabel: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  badge?: 'NEW' | 'SALE' | 'BESTSELLER';
  inStock: boolean;
  isActive?: boolean;
  stockQuantity: number;
  estimatedDelivery: string;
  images: string[];
  variants: ProductVariant[];
  details: ProductDetails;
  features: string[];
  dropship: DropshipDetails;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  helpfulCount: number;
  variantPurchased?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  variant?: {
    id: string;
    name: string;
  };
}

export interface Order {
  id: string;
  trackingNumber: string;
  createdAt: string;
  status: 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingMethod: string;
  shippingCost: number;
  tax: number;
  total: number;
  carrier: string;
  estimatedDeliveryDate: string;
  fulfillmentMilestones: {
    status: string;
    description: string;
    timestamp: string;
    completed: boolean;
  }[];
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  expiresAt?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  fulfillmentCenters: string[];
  leadTimeHours: number;
  rating: number;
  totalProductsSupplied: number;
  slaAdherenceRate: number;
  status: 'connected' | 'pending' | 'offline';
}

