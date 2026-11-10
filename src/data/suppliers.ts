export interface SupplierProfile {
  id: string;
  name: string;
  region: string;
  contactPerson: string;
  apiProtocol: 'REST-EDI' | 'Direct-API' | 'Shopify-Sync' | 'SFTP-Feed';
  performanceRating: number;
  averageFulfillmentHours: number;
  onTimeRate: number;
  defectRate: number;
  activeSkusCount: number;
  totalOrdersFulfilled: number;
  autoFulfillEnabled: boolean;
  currency: string;
}

export const DROPSHIP_SUPPLIERS: SupplierProfile[] = [
  {
    id: 'sup-lumina-milan',
    name: 'Lumina Design Lab EU',
    region: 'Milan / Frankfurt Hub, Europe',
    contactPerson: 'Matteo Bellini (Operations Lead)',
    apiProtocol: 'Direct-API',
    performanceRating: 99.4,
    averageFulfillmentHours: 18,
    onTimeRate: 98.9,
    defectRate: 0.12,
    activeSkusCount: 64,
    totalOrdersFulfilled: 3820,
    autoFulfillEnabled: true,
    currency: 'EUR',
  },
  {
    id: 'sup-kyoto-ceramics',
    name: 'Kyoto Artisan Guild & Logistics',
    region: 'Kansai Air Terminal, Japan',
    contactPerson: 'Kenji Takahashi',
    apiProtocol: 'REST-EDI',
    performanceRating: 99.8,
    averageFulfillmentHours: 14,
    onTimeRate: 99.5,
    defectRate: 0.05,
    activeSkusCount: 42,
    totalOrdersFulfilled: 2190,
    autoFulfillEnabled: true,
    currency: 'JPY',
  },
  {
    id: 'sup-audio-nordic',
    name: 'Acoustics Hardware Global',
    region: 'Copenhagen / HK Air Cargo, Asia-Pacific',
    contactPerson: 'Astrid Nielsen',
    apiProtocol: 'Direct-API',
    performanceRating: 98.7,
    averageFulfillmentHours: 12,
    onTimeRate: 97.8,
    defectRate: 0.3,
    activeSkusCount: 28,
    totalOrdersFulfilled: 5410,
    autoFulfillEnabled: true,
    currency: 'USD',
  },
  {
    id: 'sup-florence-atelier',
    name: 'Tuscan Leatherworks Consortium',
    region: 'Florence / Milan Freight, Italy',
    contactPerson: 'Giancarlo Rossi',
    apiProtocol: 'Shopify-Sync',
    performanceRating: 99.1,
    averageFulfillmentHours: 24,
    onTimeRate: 98.2,
    defectRate: 0.18,
    activeSkusCount: 19,
    totalOrdersFulfilled: 1470,
    autoFulfillEnabled: false, // Manual quality sign-off required for luxury leather
    currency: 'EUR',
  },
  {
    id: 'sup-zenith-wellness',
    name: 'Zenith Living Lab',
    region: 'Shenzhen Fast Track Hub, China',
    contactPerson: 'Lin Wei (Logistics Manager)',
    apiProtocol: 'Direct-API',
    performanceRating: 99.0,
    averageFulfillmentHours: 8,
    onTimeRate: 99.2,
    defectRate: 0.22,
    activeSkusCount: 85,
    totalOrdersFulfilled: 8930,
    autoFulfillEnabled: true,
    currency: 'USD',
  },
];

