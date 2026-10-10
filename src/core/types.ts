export type Stop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  parent?: string;
  locationType?: number;
};
export type Route = {
  id: string;
  short: string;
  long: string;
  color: string;
  type: number;
};
export type Point = { lat: number; lon: number; seq: number; dist?: number };
export type Call = {
  stopId: string;
  arr: number;
  dep: number;
  seq: number;
  pickup: number;
  dropoff: number;
};
export type Trip = {
  id: string;
  routeId: string;
  serviceId: string;
  shapeId?: string;
  templateId?: string;
  calls: Call[];
};
export type Transfer = {
  from: string;
  to: string;
  type: number;
  min: number;
  routeFrom?: string;
  routeTo?: string;
  tripFrom?: string;
  tripTo?: string;
};
export type Feed = {
  agency: string;
  timezone: string;
  validStart?: string;
  validEnd?: string;
  stops: Stop[];
  routes: Route[];
  trips: Trip[];
  shapes: Record<string, Point[]>;
  services: Record<string, { start: string; end: string; days: boolean[] }>;
  exceptions: Record<string, number[]>;
  transfers: Transfer[];
  warnings: string[];
  errors: string[];
};
export type Reach = {
  stopId: string;
  minutes: number;
  round: number;
  prev?: string;
  tripId?: string;
  alightMinutes?: number;
};
