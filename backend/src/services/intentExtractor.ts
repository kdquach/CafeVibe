import type { SearchIntent } from '../domain/schemas.js';

export interface IntentExtractor {
  extract(query: string): Promise<SearchIntent>;
}

function normalize(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVndAmount(text: string): number | null {
  const compact = text.replace(/\s+/g, '');
  const m = compact.match(/(\d[\d.]*)\s*(k\b|nghin|ngan|trieu|m\b|d\b|dong|vnd)?/);
  if (!m) return null;
  const rawStr = m[1];
  if (!rawStr) return null;
  const raw = rawStr.replace(/\./g, '');
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  const unit = m[2] ?? '';
  if (unit === 'trieu' || unit === 'm') return num * 1_000_000;
  if (unit === 'k' || unit === 'nghin' || unit === 'ngan') return num * 1000;
  if (num < 1000) return null;
  return num;
}

export class MockIntentExtractor implements IntentExtractor {
  async extract(query: string): Promise<SearchIntent> {
    const normalized = normalize(query);
    const intent: SearchIntent = { query };

    const districtAliases: Array<[RegExp, string]> = [
      [/\b(q1|d1|district 1|quan 1)\b/, 'District 1'],
      [/\b(q3|d3|district 3|quan 3)\b/, 'District 3'],
      [/\b(q5|d5|district 5|quan 5)\b/, 'District 5'],
      [/\b(q7|d7|district 7|quan 7)\b/, 'District 7'],
      [/\bgo vap\b/, 'Gò Vấp'],
      [/\bthu duc\b/, 'Thủ Đức'],
      [/\bbinh thanh\b/, 'Bình Thạnh'],
      [/\bphu nhuan\b/, 'Phú Nhuận'],
      [/\btan binh\b/, 'Tân Bình'],
    ];
    const districts: string[] = [];
    for (const [re, name] of districtAliases) {
      if (re.test(normalized)) districts.push(name);
    }
    const genericQuan = normalized.match(/\bquan\s+(\d{1,2})\b/);
    const quanNum = genericQuan?.[1];
    if (quanNum && !districts.some((d) => d.includes(quanNum))) {
      districts.push(`Quận ${quanNum}`);
    }
    if (districts.length > 0) {
      intent.districts = [...new Set(districts)].map((name) => ({
        name,
        strength: 'required' as const,
      }));
    }

    const budgetCue = /(duoi|duoi muc|tren|tu|toi da|max|under|below|up to)\s*([\d.\s]+(?:k|nghin|ngan|trieu|m|d|dong|vnd)?)/.exec(normalized)
      ?? /([\d][\d.]*\s*(?:k|nghin|ngan|trieu|m)\b)/.exec(normalized)
      ?? /([\d][\d.]{4,}\s*(?:d|dong|vnd)?\b)/.exec(normalized);
    if (budgetCue) {
      const amount = parseVndAmount(budgetCue[0]);
      if (amount !== null) {
        intent.budget = { maxVnd: amount, strength: 'required' };
      }
    }

    const pricePatterns: Array<[RegExp, number]> = [
      [/\b(cheap|budget|gia re|\bre\b)\b/, 1],
      [/\b(mid|medium|moderate|tam trung)\b/, 2],
      [/\b(expensive|premium|pricey|cao cap)\b/, 3],
      [/\b(luxury|\bhigh\b|sang)\b/, 4],
    ];
    const prices: number[] = [];
    for (const [re, val] of pricePatterns) {
      if (re.test(normalized)) prices.push(val);
    }
    if (prices.length > 0) {
      intent.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        strength: 'required',
      };
    }

    if (
      normalized.includes('open now') || normalized.includes('currently open')
      || normalized.includes('dang mo') || normalized.includes('mo cua')
    ) {
      intent.openNow = { value: true, strength: 'required' };
    }

    const amenityPatterns: Array<[RegExp, string]> = [
      [/\bwifi\b|\binternet\b|\bmang\b/, 'wifi'],
      [/\bparking\b|\bdo xe\b|\bgiu xe\b|\bcho dau xe\b/, 'parking'],
      [/\bwork\b|\bworking\b|\boffice\b|\blam viec\b|\bhoc\b|\bhoc bai\b|\bstudy\b|\brun deadline\b|\bdeadline\b/, 'work-friendly'],
      [/\bquiet\b|\byen tinh\b|\btinh lang\b/, 'quiet'],
      [/\bo cam\b|\bo dien\b|\bo sac\b|\boutlet\b|\bsac pin\b|\bsac dien thoai\b/, 'power-outlets'],
      [/\bmo khuya\b|\blate night\b|\bthuc khuya\b|\bkhuya\b/, 'late-night'],
    ];
    const amenities: string[] = [];
    for (const [re, name] of amenityPatterns) {
      if (re.test(normalized)) amenities.push(name);
    }
    if (amenities.length > 0) {
      intent.amenities = [...new Set(amenities)].map((name) => ({
        name,
        strength: 'preferred' as const,
      }));
    }

    if (
      normalized.includes('highly rated') || normalized.includes('top rated')
      || normalized.includes('danh gia cao')
    ) {
      intent.minRating = { value: 4.5, strength: 'preferred' };
    } else if (
      normalized.includes('well rated') || normalized.includes('good rating')
      || normalized.includes('danh gia tot')
    ) {
      intent.minRating = { value: 4.0, strength: 'preferred' };
    }

    return intent;
  }
}
