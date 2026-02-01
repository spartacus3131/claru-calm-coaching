export interface HotSpotArea {
  id: string;
  name: string;
  description: string;
  color: string;
  notes?: string; // Weekly reflection for this area
}

export interface HotSpot extends HotSpotArea {
  rating: number;
}

