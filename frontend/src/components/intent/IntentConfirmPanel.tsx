import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KNOWN_AMENITIES,
  KNOWN_DISTRICTS,
  type ConstraintStrength,
  type IntentStatus,
  type SearchIntent,
} from '@/features/intent/types';

export interface IntentConfirmPanelProps {
  status: IntentStatus;
  initialIntent?: SearchIntent;
  onConfirm: (intent: SearchIntent) => void;
  onRetry?: () => void;
  retrying?: boolean;
}

function StrengthRadios({
  group,
  value,
  onChange,
}: {
  group: string;
  value: ConstraintStrength;
  onChange: (next: ConstraintStrength) => void;
}) {
  const name = `strength-${group}`;
  return (
    <div role="radiogroup" aria-label="Mức độ điều kiện" className="flex gap-4">
      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="radio"
          name={name}
          checked={value === 'required'}
          onChange={() => onChange('required')}
        />
        Bắt buộc
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="radio"
          name={name}
          checked={value === 'preferred'}
          onChange={() => onChange('preferred')}
        />
        Ưu tiên
      </label>
    </div>
  );
}

function hasNoConditions(intent: SearchIntent): boolean {
  return (
    (intent.districts?.length ?? 0) === 0 &&
    !intent.budget &&
    !intent.priceRange &&
    (intent.amenities?.length ?? 0) === 0 &&
    !intent.openNow &&
    !intent.minRating
  );
}

export function IntentConfirmPanel({
  status,
  initialIntent,
  onConfirm,
  onRetry,
  retrying = false,
}: IntentConfirmPanelProps) {
  const [intent, setIntent] = useState<SearchIntent>(
    initialIntent ?? { query: '' },
  );
  const [budgetError, setBudgetError] = useState<string | undefined>();
  const [newDistrict, setNewDistrict] = useState('');
  const [newAmenity, setNewAmenity] = useState<string>(KNOWN_AMENITIES[0] as string);
  const [newBudget, setNewBudget] = useState('');

  if (status === 'loading') {
    return (
      <div role="status" aria-busy="true" aria-label="Đang phân tích yêu cầu">
        <span className="sr-only">Đang phân tích yêu cầu…</span>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-3 h-16 w-full" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Không phân tích được yêu cầu"
        description="Hệ thống chưa hiểu điều bạn mô tả. Hãy thử lại."
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }

  const conditionCount =
    (intent.districts?.length ?? 0) +
    (intent.budget ? 1 : 0) +
    (intent.priceRange ? 1 : 0) +
    (intent.amenities?.length ?? 0) +
    (intent.openNow ? 1 : 0) +
    (intent.minRating ? 1 : 0);

  function handleBudgetChange(raw: string) {
    const trimmed = raw.trim().replace(/\./g, '');
    if (!/^\d+$/.test(trimmed) || Number(trimmed) <= 0) {
      setBudgetError('Nhập số tiền VND là số nguyên dương.');
      return;
    }
    setBudgetError(undefined);
    setIntent((prev) => ({
      ...prev,
      budget: { maxVnd: Number(trimmed), strength: prev.budget?.strength ?? 'required' },
    }));
  }

  function handleAddDistrict() {
    const name = newDistrict.trim();
    if (!name || intent.districts?.some((d) => d.name === name)) return;
    setIntent((prev) => ({
      ...prev,
      districts: [...(prev.districts ?? []), { name, strength: 'preferred' as const }],
    }));
    setNewDistrict('');
  }

  function handleAddAmenity() {
    if (!newAmenity || intent.amenities?.some((a) => a.name === newAmenity)) return;
    setIntent((prev) => ({
      ...prev,
      amenities: [...(prev.amenities ?? []), { name: newAmenity, strength: 'preferred' as const }],
    }));
  }

  function handleAddBudget() {
    const trimmed = newBudget.trim().replace(/\./g, '');
    if (!/^\d+$/.test(trimmed) || Number(trimmed) <= 0) return;
    setIntent((prev) => ({
      ...prev,
      budget: { maxVnd: Number(trimmed), strength: 'required' },
    }));
    setNewBudget('');
  }

  if (status === 'empty' && conditionCount === 0) {
    return (
      <div>
        <EmptyState
          title="Chưa nhận diện được điều kiện nào"
          description="Thêm điều kiện bên dưới để bắt đầu."
        />
        <Card className="mt-4">
          <h3 className="text-h4 font-semibold">Thêm điều kiện</h3>
          <div className="mt-3 flex flex-col gap-3">
            <Input
              label="Thêm khu vực"
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              list="known-districts"
            />
            <datalist id="known-districts">
              {KNOWN_DISTRICTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <div>
              <Button variant="secondary" onClick={handleAddDistrict} disabled={!newDistrict.trim()}>
                Thêm khu vực
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <p className="text-sm text-text-muted">
        Câu gốc: <q className="font-medium text-text">{intent.query || '—'}</q>
      </p>

      {hasNoConditions(intent) ? (
        <p className="mt-4 rounded-md border border-border-strong bg-surface-muted p-3 text-sm">
          Chưa có điều kiện, sẽ tìm tất cả quán.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-5">
        {intent.districts?.map((d, i) => (
          <div key={`${d.name}-${i}`} className="flex flex-col gap-2 border-t border-border pt-4">
            <Input
              label={`Khu vực ${i + 1}`}
              value={d.name}
              onChange={(e) =>
                setIntent((prev) => ({
                  ...prev,
                  districts: prev.districts?.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)),
                }))
              }
              list="known-districts"
            />
            <StrengthRadios
              group={`district-${i}`}
              value={d.strength}
              onChange={(s) =>
                setIntent((prev) => ({
                  ...prev,
                  districts: prev.districts?.map((x, xi) => (xi === i ? { ...x, strength: s } : x)),
                }))
              }
            />
            <div>
              <Button
                variant="ghost"
                aria-label={`Xóa khu vực ${d.name}`}
                onClick={() =>
                  setIntent((prev) => ({
                    ...prev,
                    districts: prev.districts?.filter((_, xi) => xi !== i),
                  }))
                }
              >
                Xóa
              </Button>
            </div>
          </div>
        ))}

        {intent.budget ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Input
              label="Ngân sách tối đa (VND)"
              inputMode="numeric"
              defaultValue={String(intent.budget.maxVnd)}
              error={budgetError}
              onBlur={(e) => handleBudgetChange(e.target.value)}
            />
            <StrengthRadios
              group="budget"
              value={intent.budget.strength}
              onChange={(s) =>
                setIntent((prev) =>
                  prev.budget ? { ...prev, budget: { ...prev.budget, strength: s } } : prev,
                )
              }
            />
            <div>
              <Button
                variant="ghost"
                aria-label="Xóa ngân sách"
                onClick={() => setIntent((prev) => ({ ...prev, budget: undefined }))}
              >
                Xóa
              </Button>
            </div>
          </div>
        ) : null}

        {intent.priceRange ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex gap-3">
              <Input
                label="Mức giá từ (1–4)"
                inputMode="numeric"
                defaultValue={String(intent.priceRange.min)}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isInteger(v) && v >= 1 && v <= 4) {
                    setIntent((prev) =>
                      prev.priceRange ? { ...prev, priceRange: { ...prev.priceRange, min: v } } : prev,
                    );
                  }
                }}
              />
              <Input
                label="Mức giá đến (1–4)"
                inputMode="numeric"
                defaultValue={String(intent.priceRange.max)}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isInteger(v) && v >= 1 && v <= 4) {
                    setIntent((prev) =>
                      prev.priceRange ? { ...prev, priceRange: { ...prev.priceRange, max: v } } : prev,
                    );
                  }
                }}
              />
            </div>
            <StrengthRadios
              group="price-range"
              value={intent.priceRange.strength}
              onChange={(s) =>
                setIntent((prev) =>
                  prev.priceRange ? { ...prev, priceRange: { ...prev.priceRange, strength: s } } : prev,
                )
              }
            />
            <div>
              <Button
                variant="ghost"
                aria-label="Xóa khoảng giá"
                onClick={() => setIntent((prev) => ({ ...prev, priceRange: undefined }))}
              >
                Xóa
              </Button>
            </div>
          </div>
        ) : null}

        {intent.amenities?.map((a, i) => (
          <div key={`${a.name}-${i}`} className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Tiện ích: {a.name}</p>
            <StrengthRadios
              group={`amenity-${i}-${a.name}`}
              value={a.strength}
              onChange={(s) =>
                setIntent((prev) => ({
                  ...prev,
                  amenities: prev.amenities?.map((x, xi) => (xi === i ? { ...x, strength: s } : x)),
                }))
              }
            />
            <div>
              <Button
                variant="ghost"
                aria-label={`Xóa tiện ích ${a.name}`}
                onClick={() =>
                  setIntent((prev) => ({
                    ...prev,
                    amenities: prev.amenities?.filter((_, xi) => xi !== i),
                  }))
                }
              >
                Xóa
              </Button>
            </div>
          </div>
        ))}

        {intent.openNow ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={intent.openNow.value}
                onChange={(e) =>
                  setIntent((prev) =>
                    prev.openNow ? { ...prev, openNow: { ...prev.openNow, value: e.target.checked } } : prev,
                  )
                }
              />
              Đang mở cửa
            </label>
            <StrengthRadios
              group="open-now"
              value={intent.openNow.strength}
              onChange={(s) =>
                setIntent((prev) =>
                  prev.openNow ? { ...prev, openNow: { ...prev.openNow, strength: s } } : prev,
                )
              }
            />
            <div>
              <Button
                variant="ghost"
                aria-label="Xóa điều kiện giờ mở cửa"
                onClick={() => setIntent((prev) => ({ ...prev, openNow: undefined }))}
              >
                Xóa
              </Button>
            </div>
          </div>
        ) : null}

        {intent.minRating ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Input
              label="Đánh giá tối thiểu (0–5)"
              inputMode="decimal"
              defaultValue={String(intent.minRating.value)}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 0 && v <= 5) {
                  setIntent((prev) =>
                    prev.minRating ? { ...prev, minRating: { ...prev.minRating, value: v } } : prev,
                  );
                }
              }}
            />
            <StrengthRadios
              group="min-rating"
              value={intent.minRating.strength}
              onChange={(s) =>
                setIntent((prev) =>
                  prev.minRating ? { ...prev, minRating: { ...prev.minRating, strength: s } } : prev,
                )
              }
            />
            <div>
              <Button
                variant="ghost"
                aria-label="Xóa điều kiện đánh giá"
                onClick={() => setIntent((prev) => ({ ...prev, minRating: undefined }))}
              >
                Xóa
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-h4 font-semibold">Thêm điều kiện</h3>
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Khu vực mới" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} list="known-districts" />
          <div>
            <Button variant="secondary" onClick={handleAddDistrict} disabled={!newDistrict.trim()}>
              Thêm khu vực
            </Button>
          </div>
          <div>
            <label htmlFor="add-amenity" className="mb-1.5 block text-sm font-medium text-text">
              Tiện ích mới
            </label>
            <select
              id="add-amenity"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-base"
            >
              {KNOWN_AMENITIES.filter((n) => !intent.amenities?.some((a) => a.name === n)).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Button variant="secondary" className="mt-2" onClick={handleAddAmenity}>
              Thêm tiện ích
            </Button>
          </div>
          {!intent.budget ? (
            <div>
              <Input label="Ngân sách mới (VND)" inputMode="numeric" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
              <Button variant="secondary" className="mt-2" onClick={handleAddBudget}>
                Thêm ngân sách
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={() => onConfirm(intent)}>Xác nhận và tìm kiếm</Button>
      </div>
    </Card>
  );
}
