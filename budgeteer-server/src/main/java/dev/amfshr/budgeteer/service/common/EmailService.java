package dev.amfshr.budgeteer.service.common;

import dev.amfshr.budgeteer.api.common.ErrorCode;
import dev.amfshr.budgeteer.config.AppProperties;
import dev.amfshr.budgeteer.config.JweProperties;
import dev.amfshr.budgeteer.exception.ApiException;
import dev.amfshr.budgeteer.util.LogSanitizer;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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

    // Gmail threads messages with the same sender + identical subject into one
    // stacking conversation; a per-request time suffix keeps every sign-in email
    // its own thread (auth v2 will put the OTP code here instead).
    private static final DateTimeFormatter SUBJECT_TIME =
            DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Europe/London"));

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
            sendEmail(email, "Sign in to budgeteer (" + SUBJECT_TIME.format(Instant.now()) + ")",
                    buildMagicLinkPlainBody(magicLink, expiryMinutes),
                    buildMagicLinkHtmlBody(magicLink, expiryMinutes, email));
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
                Sign in to budgeteer with this link:

                %s

                It expires in %d minutes and works once. If you didn't request it,
                you can ignore this email — nothing changes without it.
                """.formatted(magicLink, expiryMinutes);
    }

    /**
     * HTML part, from the brand sheet's email template (design project, brand/
     * email-magic-link.html). Email HTML is deliberately archaic: tables, inline
     * styles, no external CSS/fonts — survives every client; the style block only
     * adds dark-mode overrides for clients that honour it. The link appears twice —
     * as a button and as a printed URL — so it is clickable AND copy-pasteable.
     * The template's OTP-code section arrives with auth methods v2.
     */
    private String buildMagicLinkHtmlBody(String magicLink, long expiryMinutes, String recipient) {
        return """
                <!doctype html>
                <html lang="en">
                <head>
                <meta charset="utf-8">
                <meta name="color-scheme" content="light dark">
                <meta name="supported-color-schemes" content="light dark">
                <style>
                  @media (prefers-color-scheme: dark) {
                    .bg { background-color: #09090b !important; }
                    .card { background-color: #131316 !important; border-color: #27272a !important; }
                    .fg { color: #fafafa !important; }
                    .mfg { color: #a1a1aa !important; }
                  }
                </style>
                </head>
                <body class="bg" style="margin:0;padding:0;background-color:#fafafa;">
                <span style="display:none;font-size:1px;color:#fafafa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Tap Sign in to open budgeteer. Expires in %d minutes.</span>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" class="bg" style="background-color:#fafafa;">
                <tr><td align="center" style="padding:40px 16px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
                    <tr><td style="padding:0 0 20px 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;letter-spacing:-0.4px;color:#09090b;" class="fg">budgeteer<span style="display:inline-block;width:6px;height:6px;background-color:#059669;border-radius:2px;margin-left:2px;">&nbsp;</span></td></tr>
                    <tr><td class="card" style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:36px 36px 32px 36px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
                        <tr><td class="fg" style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;line-height:30px;font-weight:600;letter-spacing:-0.4px;color:#09090b;padding:0 0 10px 0;">Sign in to budgeteer</td></tr>
                        <tr><td class="mfg" style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:23px;color:#71717a;padding:0 0 28px 0;">Tap the button if you're reading this on the device you're signing in from.</td></tr>
                        <tr><td align="left" style="padding:0 0 28px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                            <td bgcolor="#059669" style="background-color:#059669;border-radius:10px;">
                              <a href="%s" style="display:block;padding:13px 22px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:18px;font-weight:600;color:#ffffff;text-decoration:none;">Sign in</a>
                            </td>
                          </tr></table>
                        </td></tr>
                        <tr><td style="border-top:1px solid #e4e4e7;font-size:0;line-height:0;padding:0 0 24px 0;" class="card">&nbsp;</td></tr>
                        <tr><td class="fg" style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;color:#09090b;padding:0 0 4px 0;">Or paste this link</td></tr>
                        <tr><td class="mfg" style="font-family:Menlo,Consolas,'Courier New',monospace;font-size:13px;line-height:19px;color:#71717a;word-break:break-all;">%s</td></tr>
                        <tr><td class="mfg" style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:19px;color:#71717a;padding:24px 0 0 0;">This link expires in %d minutes and works once. If you didn't request it, you can ignore this email — nothing changes without it.</td></tr>
                      </table>
                    </td></tr>
                    <tr><td class="mfg" style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#71717a;padding:20px 4px 0 4px;">Sent to %s because a sign-in was requested at %s.<br>budgeteer is a personal budgeting tool and never moves money.</td></tr>
                  </table>
                </td></tr>
                </table>
                </body>
                </html>
                """.formatted(expiryMinutes, magicLink, magicLink, expiryMinutes,
                        recipient, appProperties.getBaseUrl());
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
            log.error("Failed to send email to {}: {}", LogSanitizer.maskEmail(to), e.getMessage());
            // Typed so the API answers 502 EMAIL_SERVICE_ERROR with an actionable message
            // instead of a generic 500 — the login form surfaces this text directly.
            throw new ApiException(ErrorCode.EMAIL_SERVICE_ERROR,
                    "We couldn't send the login email — please try again in a moment", e);
        }
    }
}
