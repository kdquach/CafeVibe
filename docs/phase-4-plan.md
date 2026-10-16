 # Phase 4 — AI intent và xác nhận (kế hoạch)

Nguồn: docs/roadmap.md (Phase 4), docs/adr-002-trustworthy-ai.md, docs/api-contract.md.
Acceptance (roadmap): người dùng sửa được intent; đầu ra không hợp lệ được xử lý an toàn.
Dùng lại schema SearchIntent của Phase 3, không đổi schema nếu chưa được duyệt.

## Phạm vi chung
Mock intent endpoint, UI xem/sửa intent, nối luồng search. LLM thật chỉ ở 4d và sau khi được duyệt.
KHÔNG làm: xếp hạng, map, favorites, auth, database.

## 4a — Backend: mock intent (làm trước)
- Interface IntentExtractor + MockIntentExtractor (rule-based, xác định, không gọi mạng).
- Endpoint đúng theo api-contract.md (không tự đặt tên trường mới).
- Zod validate đầu vào và đầu ra của extractor.
- Đầu ra sai schema hoặc extractor lỗi: trả lỗi an toàn theo error envelope hiện có, không crash.
- Test: query hợp lệ, query rỗng/quá dài, đầu ra sai schema, extractor ném lỗi.

## 4b — Frontend: màn hình xem và sửa intent
- Hiển thị từng điều kiện kèm strength (required/preferred), cho sửa, xóa, thêm.
- Chỉ khi người dùng xác nhận mới gọi search.
- Dùng lại Chip, Button, Input, ErrorState có sẵn; tuân theo design-system-v1 và core-user-flows.
- Trạng thái: đang tải, lỗi (có thử lại), intent rỗng.
- Test: 1-2 test hành vi chính (sửa và xác nhận). Phần còn lại kiểm tra tay.

## 4c — Nối luồng
- /search: nhập query -> gọi intent -> màn hình xác nhận -> gọi search (Phase 3).
- Xử lý lỗi mạng và intent không hợp lệ.

## 4d — LLM thật (HOÃN, cần duyệt riêng)
- Sau adapter IntentExtractor, có validation và fallback về mock.
- Cần quyết định trước: nhà cung cấp/model, nơi giữ khóa API (chỉ ở backend, không bao giờ trong VITE_*).

## Việc tồn đọng trước 4c
- (a) `evaluateConstraints` cần so sánh theo VND: nếu quán có giá VND thì so sánh trực tiếp với `budget.maxVnd`; nếu quán chỉ có `priceLevel` thì kết quả là `unknown`, không tự map VND sang priceLevel.
- (b) `/search` hiện tự suy intent từ query thay vì nhận intent đã xác nhận; quyết định nối luồng ở 4c.
- (c) Kiểm tra `LOCATION_NOT_SUPPORTED` có trong code Phase 3 (plan yêu cầu nhưng code hiện chưa thấy).

## Quy tắc xuyên suốt
- Không bịa dữ liệu quán hay thông tin AI chưa xác minh.
- Mỗi phiên làm một lát cắt, trình bày kế hoạch và chờ duyệt trước khi code.
- Báo kết quả lint/typecheck/test đúng như thực tế.