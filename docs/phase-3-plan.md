# Phase 3 — Search domain (kế hoạch đã duyệt)

Nguồn: docs/roadmap.md (Phase 3) + các quyết định đã chốt với chủ dự án. Nếu mâu thuẫn với api-contract.md, nêu ra, đừng tự đoán.

## Phạm vi
Schema, provider adapter, mock deterministic, search service, POST /api/v1/search.
KHÔNG làm: xếp hạng/điểm số, UI, LLM, database, map.

## Domain
- Attribute<T> = known { value, source: provider | user_submitted | inferred } | unknown
- SearchIntent: danh sách điều kiện, mỗi điều kiện có strength: required | preferred
- Place
- SearchResult: mỗi điều kiện có kết quả met | not_met | unknown

## Quy tắc nghiệp vụ
- Điều kiện required mà dữ liệu unknown: GIỮ quán lại và gắn cờ (không loại, không coi là đạt).
- Thuộc tính thiếu dữ liệu là unknown, không bao giờ là false.
- Ngân sách đạt (met) khi giá thấp nhất <= ngân sách tối đa.
- Khu vực không hỗ trợ: trả 200, results rỗng, warning LOCATION_NOT_SUPPORTED.
- isOpenNow(place, now): hàm thuần, múi giờ Asia/Ho_Chi_Minh, đồng hồ được inject.
- Dữ liệu fixture phải ghi rõ là dữ liệu mock, không trình bày như quán thật.

## Kỹ thuật
- PlaceProvider (interface) + MockPlaceProvider có thể giả lập lỗi; biến môi trường PLACE_PROVIDER=mock (mặc định).
- SearchService nhận provider và clock qua dependency injection.
- errorHandler: xử lý entity.too.large -> 413 (hiện chỉ xử lý entity.parse.failed).
- Chỉ dùng mã lỗi có trong api-contract.md.

## Test (mỗi hàm 3-5 test, không lặp, không snapshot)
- isOpenNow: trong giờ, ngoài giờ, qua nửa đêm, thiếu dữ liệu giờ -> unknown.
- evaluateConstraints: met / not_met / unknown, ngân sách, required với unknown.
- SearchService: provider lỗi, khu vực không hỗ trợ.
- Endpoint: 200, 400 (body sai), 413 (body quá lớn).

## Ngoài phạm vi (để Phase 5)
Điểm số, xếp hạng, giải thích điểm, filter, sort. Không có calculateStrength hay điểm 0-100 ở phase này.