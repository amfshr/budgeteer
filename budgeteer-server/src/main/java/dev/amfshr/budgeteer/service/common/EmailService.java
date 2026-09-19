package dev.amfshr.budgeteer.service.common;

import dev.amfshr.budgeteer.api.common.ErrorCode;
import dev.amfshr.budgeteer.config.AppProperties;
import dev.amfshr.budgeteer.config.JweProperties;
import dev.amfshr.budgeteer.exception.ApiException;
import dev.amfshr.budgeteer.util.LogSanitizer;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails as multipart/alternative: an HTML part with a real
 * sign-in button (mail clients don't reliably auto-link plain-text URLs — localhost
 * URLs in particular are never linkified) plus a text/plain fallback carrying the
 * bare link. When email is disabled (development mode), logs the link to console.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;
    private final JweProperties jweProperties;

    public EmailService(JavaMailSender mailSender, AppProperties appProperties, JweProperties jweProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
        this.jweProperties = jweProperties;
    }

    /**
     * Sends a magic link email to the user.
     *
     * @param email the recipient email address
     * @param token the magic link token (plain, not hashed)
     */
    public void sendMagicLinkEmail(String email, String token) {
        String magicLink = buildMagicLink(token);

        if (appProperties.isEmailEnabled()) {
            long expiryMinutes = jweProperties.getMagicLinkExpiry().toMinutes();
            sendEmail(email, "Login to Budgeteer",
                    buildMagicLinkPlainBody(magicLink, expiryMinutes),
                    buildMagicLinkHtmlBody(magicLink, expiryMinutes));
        } else {
            // Development mode - log to console
            logMagicLink(email, magicLink);
        }
    }

    /**
     * Builds the magic link URL.
     */
    private String buildMagicLink(String token) {
        // Targets the FRONTEND verify route (SPA calls the API itself with Accept: application/json
        // and renders proper success/failure UX). base-url = the origin users see: the Vite dev
        // server locally, the single public domain in prod (one-URL-everywhere, #17).
        return appProperties.getBaseUrl() + "/auth/verify?token=" + token;
    }

    /**
     * Plain-text alternative part — the bare URL for clients that prefer text.
     */
    private String buildMagicLinkPlainBody(String magicLink, long expiryMinutes) {
        return """
                Hi there,

                Click the link below to log in to Budgeteer:

                %s

                This link will expire in %d minutes.

                If you didn't request this email, you can safely ignore it.

                - The Budgeteer Team
                """.formatted(magicLink, expiryMinutes);
    }

    /**
     * HTML part. Email HTML is deliberately archaic: inline styles only, no external
     * CSS/fonts, layout that survives every client. The link appears twice — as a
     * button and as a printed URL — so it is clickable AND copy-pasteable.
     */
    private String buildMagicLinkHtmlBody(String magicLink, long expiryMinutes) {
        return """
                <!doctype html>
                <html>
                <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
                    <div style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px;padding:32px;">
                      <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#18181b;">Budgeteer</p>
                      <p style="margin:0 0 24px;font-size:14px;color:#71717a;">Your money, one place.</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#18181b;">Click the button below to sign in. This link expires in %d minutes.</p>
                      <a href="%s" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:6px;">Sign in to Budgeteer</a>
                      <p style="margin:24px 0 0;font-size:13px;color:#71717a;">Or paste this link into your browser:</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#71717a;word-break:break-all;">%s</p>
                    </div>
                    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">If you didn't request this email, you can safely ignore it.</p>
                  </div>
                </body>
                </html>
                """.formatted(expiryMinutes, magicLink, magicLink);
    }

    /**
     * Logs the magic link to console (for development).
     */
    private void logMagicLink(String email, String magicLink) {
        log.info("""

                ╔══════════════════════════════════════════════════════════════════╗
                ║                    MAGIC LINK (DEV MODE)                         ║
                ╠══════════════════════════════════════════════════════════════════╣
                ║ Email: {}
                ║ Link:  {}
                ╚══════════════════════════════════════════════════════════════════╝
                """, email, magicLink);
    }

    /**
     * Sends a multipart/alternative email (plain text + HTML).
     */
    private void sendEmail(String to, String subject, String plainBody, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom(appProperties.getMail().getFrom());
            helper.setText(plainBody, htmlBody);

            mailSender.send(message);
            log.info("Email sent to {} from {}", LogSanitizer.maskEmail(to), appProperties.getMail().getFrom());
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // Typed so the API answers 502 EMAIL_SERVICE_ERROR with an actionable message
            // instead of a generic 500 — the login form surfaces this text directly.
            throw new ApiException(ErrorCode.EMAIL_SERVICE_ERROR,
                    "We couldn't send the login email — please try again in a moment", e);
        }
    }
}
