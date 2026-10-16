import type { SearchIntent } from '../domain/schemas.js';

export interface IntentBuilder {
  fromQuery(query: string): Promise<SearchIntent>;
}

export class SimpleIntentBuilder implements IntentBuilder {
  async fromQuery(query: string): Promise<SearchIntent> {
    const normalized = query.toLowerCase().trim();
    const intent: SearchIntent = { query };

    const districtMap: Record<string, string> = {
      'q1': 'District 1', 'd1': 'District 1', 'district 1': 'District 1',
      'q3': 'District 3', 'd3': 'District 3', 'district 3': 'District 3',
      'q5': 'District 5', 'd5': 'District 5', 'district 5': 'District 5',
      'q7': 'District 7', 'd7': 'District 7', 'district 7': 'District 7',
    };

    const amenityMap: Record<string, string> = {
      wifi: 'wifi', internet: 'wifi',
      parking: 'parking', car: 'parking',
      work: 'work-friendly', office: 'work-friendly', working: 'work-friendly',
    };

    const priceMap: Record<string, number> = {
      cheap: 1, budget: 1,
      mid: 2, medium: 2, moderate: 2,
      expensive: 3, premium: 3, pricey: 3,
      luxury: 4, high: 4,
    };

    const districts = Object.entries(districtMap)
      .filter(([key]) => normalized.includes(key))
      .map(([, val]) => val);
    if (districts.length > 0) {
      intent.districts = [...new Set(districts)].map(name => ({ name, strength: 'required' as const }));
    }

    const amenities = Object.entries(amenityMap)
      .filter(([key]) => normalized.includes(key))
      .map(([, val]) => val);
    if (amenities.length > 0) {
      intent.amenities = [...new Set(amenities)].map(name => ({ name, strength: 'preferred' as const }));
    }

    if (normalized.includes('open now') || normalized.includes('currently open')) {
      intent.openNow = { value: true, strength: 'preferred' };
    }

    if (normalized.includes('now opening') || normalized.includes('open soon')) {
      intent.openNow = { value: false, strength: 'preferred' };
    }

    const priceEntries = Object.entries(priceMap)
      .filter(([key]) => normalized.includes(key));
    if (priceEntries.length > 0) {
      const prices = priceEntries.map(([, val]) => val);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      intent.priceRange = { min: minPrice, max: maxPrice, strength: 'preferred' };
    }

    if (normalized.includes('highly rated') || normalized.includes('top rated')) {
      intent.minRating = { value: 4.5, strength: 'preferred' };
    } else if (normalized.includes('well rated') || normalized.includes('good rating')) {
      intent.minRating = { value: 4.0, strength: 'preferred' };
    }

    return intent;
  }
}
