export type Role = "owner" | "admin" | "staff" | "scanner";
export type EventType = "conference" | "concert" | "workshop" | "festival";
export type EventStatus = "draft" | "live" | "ended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  color: string;
}

export interface Question {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  required: boolean;
  options?: string[];
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  sold: number;
  active: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  limit: number;
  used: number;
  active: boolean;
}

export interface CheckoutSettings {
  buttonLabel: string;
  note: string;
  requireEmail: boolean;
  collectCompany: boolean;
  allowPromos: boolean;
}

export interface EventItem {
  id: string;
  slug: string;
  name: string;
  type: EventType;
  status: EventStatus;
  start: string;
  end: string;
  venue: string;
  city: string;
  description: string;
  cover: string;
  accent: string;
  tickets: TicketType[];
  addOns: AddOn[];
  promos: PromoCode[];
  questions: Question[];
  checkout: CheckoutSettings;
}

export interface OrderItem {
  ticketId: string;
  name: string;
  qty: number;
  unit: number;
}

export interface OrderAddOn {
  addOnId: string;
  name: string;
  qty: number;
  unit: number;
}

export type OrderStatus = "paid" | "free" | "refunded";

export interface Order {
  id: string;
  number: string;
  eventId: string;
  eventName: string;
  buyer: { name: string; email: string; company?: string };
  items: OrderItem[];
  addOns: OrderAddOn[];
  promo?: string;
  subtotal: number;
  discount: number;
  fees: number;
  tax: number;
  total: number;
  status: OrderStatus;
  method: "card" | "invoice" | "free";
  createdAt: string;
}

export interface Attendee {
  id: string;
  orderId: string;
  orderNumber: string;
  eventId: string;
  eventName: string;
  ticketId: string;
  ticketName: string;
  name: string;
  email: string;
  code: string;
  answers: Record<string, string>;
  checkedInAt?: string;
  refunded?: boolean;
  createdAt: string;
}

export type ScanResult = "ok" | "duplicate" | "invalid" | "refunded" | "reversed";

export interface ScanEntry {
  id: string;
  code: string;
  eventId: string;
  eventName: string;
  result: ScanResult;
  attendee?: string;
  by: string;
  at: string;
}

export interface Message {
  id: string;
  eventId: string;
  eventName: string;
  audience: string;
  subject: string;
  body: string;
  recipients: number;
  at: string;
  by: string;
}

export interface ApiKey {
  id: string;
  label: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface Settings {
  org: string;
  currency: string;
  taxRate: number;
  feePercent: number;
  feeFixed: number;
  email: string;
  smtpHost: string;
  domain: string;
}

export interface DB {
  version: number;
  settings: Settings;
  users: User[];
  currentUserId: string;
  events: EventItem[];
  orders: Order[];
  attendees: Attendee[];
  scans: ScanEntry[];
  messages: Message[];
  apiKeys: ApiKey[];
}

export interface Totals {
  subtotal: number;
  discount: number;
  fees: number;
  tax: number;
  total: number;
}
