package com.manhnpc.journal.web;

import com.manhnpc.common.ai.OpenAiClient;
import com.manhnpc.common.web.error.BadRequestException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
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
            You are a study-journal assistant. The user will give you raw notes about what they \
            learned/did today (possibly messy, bullet-point, unedited). Respond with exactly three \
            parts, in this order:

            1. A single line starting with "Title: " followed by a short, specific, descriptive title \
            (English, no surrounding quotes, no trailing period, ideally under 60 characters) that \
            captures the main topic(s) of the day's notes.
            2. A single line starting with "Tags: " followed by 3-6 short lowercase keyword tags, \
            comma-separated (e.g. "spring-boot, jpa, database-indexing"), covering the concrete \
            topics/technologies/subjects present in the notes. No hashes, no spaces inside a tag \
            (use hyphens), no surrounding quotes.
            3. A blank line, then turn the notes into a detailed daily report in English, formatted as \
            Markdown, with exactly these sections:

            ## Summary
            2-4 sentences giving the high-level picture of the day.

            ## Detailed breakdown
            Go through every topic/concept/task from the notes in depth, one by one, using \
            subheadings or bullet points. Preserve every concrete detail the user wrote (specific \
            terms, numbers, examples, code, names) — do not compress or generalize them away. Only \
            omit content that is genuinely irrelevant filler (e.g. "then I took a break"), not \
            substance. When a note is terse, expand on it with the relevant context/explanation \
            instead of just restating it in fewer words.

            ## Assessment
            Objective evaluation of understanding: strengths, gaps, and anything still unclear that \
            needs review.

            ## Statistics
            List: number of topics/concepts covered, overall difficulty (Easy/Medium/Hard), and a \
            suggested review schedule for the next few days.

            Be thorough rather than brief — this is a reference report the user will read back later, \
            so don't cut corners on detail. Return only the Markdown content of the report, no greeting \
            or extra commentary.
            """;

    private final OpenAiClient openAiClient;

    public JournalAiReportController(OpenAiClient openAiClient) {
        this.openAiClient = openAiClient;
    }

    public record AiReportRequest(String notes, LocalDate entryDate) {}

    public record AiReportResponse(String title, List<String> tags, String report) {}

    @PostMapping
    public AiReportResponse generate(@RequestBody AiReportRequest request) {
        if (request.notes() == null || request.notes().isBlank()) {
            throw new BadRequestException("notes must not be empty");
        }
        LocalDate date = request.entryDate() != null ? request.entryDate() : LocalDate.now();
        String userPrompt = "Date: " + date + "\n\nMy notes:\n" + request.notes();
        String raw = openAiClient.chat(SYSTEM_PROMPT, userPrompt, 4000);
        return parseAiResponse(raw);
    }

    /** Pulls the leading "Title: ..." / "Tags: ..." header lines off the model's response, if present. */
    private static AiReportResponse parseAiResponse(String raw) {
        String title = null;
        List<String> tags = null;
        String remaining = raw;

        while (title == null || tags == null) {
            int newline = remaining.indexOf('\n');
            String firstLine = newline >= 0 ? remaining.substring(0, newline) : remaining;
            String rest = newline >= 0 ? remaining.substring(newline + 1) : "";
            if (title == null && firstLine.regionMatches(true, 0, "Title:", 0, 6)) {
                title = firstLine.substring(6).trim();
                remaining = rest;
            } else if (tags == null && firstLine.regionMatches(true, 0, "Tags:", 0, 5)) {
                tags = Arrays.stream(firstLine.substring(5).split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                remaining = rest;
            } else {
                break;
            }
        }
        return new AiReportResponse(title, tags, remaining.stripLeading());
    }
}
