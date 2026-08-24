package com.manhnpc.journal.web;

import com.manhnpc.common.ai.OpenAiClient;
import com.manhnpc.common.web.error.BadRequestException;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Turns the owner's raw notes about what they learned today into a structured
 * Markdown daily report via OpenAI. Stateless — the caller decides whether/how
 * to fold the returned report into a {@link com.manhnpc.journal.model.JournalEntry}.
 */
@RestController
@RequestMapping("/api/journal/ai-report")
public class JournalAiReportController {

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý viết nhật ký học tập. Người dùng sẽ cung cấp ghi chú thô về những gì \
            họ đã học/làm trong ngày (có thể lộn xộn, gạch đầu dòng, chưa chỉnh sửa). Dựa trên đó, \
            hãy viết một bản báo cáo nhật ký bằng tiếng Việt, định dạng Markdown, gồm đúng các phần sau:

            ## Tóm tắt
            Tóm tắt ngắn gọn (2-4 câu) nội dung đã học/làm trong ngày.

            ## Nội dung chi tiết
            Trình bày lại kiến thức/chủ đề đã học một cách có tổ chức, dùng tiêu đề phụ hoặc gạch đầu dòng.

            ## Đánh giá
            Nhận xét khách quan về mức độ hiểu, điểm mạnh, và những chỗ còn mơ hồ cần ôn lại.

            ## Thống kê
            Liệt kê: số chủ đề/khái niệm đã học, mức độ khó tổng quan (Dễ/Trung bình/Khó), \
            và đề xuất nên dành bao nhiêu thời gian ôn lại trong vài ngày tới.

            Chỉ trả về nội dung Markdown của báo cáo, không thêm lời chào hay giải thích nào khác.
            """;

    private final OpenAiClient openAiClient;

    public JournalAiReportController(OpenAiClient openAiClient) {
        this.openAiClient = openAiClient;
    }

    public record AiReportRequest(String notes, LocalDate entryDate) {}

    public record AiReportResponse(String report) {}

    @PostMapping
    public AiReportResponse generate(@RequestBody AiReportRequest request) {
        if (request.notes() == null || request.notes().isBlank()) {
            throw new BadRequestException("notes must not be empty");
        }
        LocalDate date = request.entryDate() != null ? request.entryDate() : LocalDate.now();
        String userPrompt = "Ngày: " + date + "\n\nGhi chú của tôi:\n" + request.notes();
        String report = openAiClient.chat(SYSTEM_PROMPT, userPrompt);
        return new AiReportResponse(report);
    }
}
