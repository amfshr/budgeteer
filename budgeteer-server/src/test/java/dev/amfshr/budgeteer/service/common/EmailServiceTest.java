package dev.amfshr.budgeteer.service.common;

import dev.amfshr.budgeteer.config.AppProperties;
import dev.amfshr.budgeteer.config.JweProperties;
import dev.amfshr.budgeteer.exception.ApiException;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Duration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link EmailService}.
 *
 * <p>The mocked JavaMailSender hands out a REAL in-memory MimeMessage so the
 * multipart/alternative content (plain + HTML parts) can be captured and parsed.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
@DisplayName("EmailService")
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private AppProperties appProperties;

    @Mock
    private AppProperties.Mail mailProperties;

    @Mock
    private JweProperties jweProperties;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, appProperties, jweProperties);
        // Lenient: not every test sends an email
        lenient().when(mailProperties.getFrom()).thenReturn("noreply@budgeteer.amfshr.dev");
        lenient().when(appProperties.getMail()).thenReturn(mailProperties);
        lenient().when(jweProperties.getMagicLinkExpiry()).thenReturn(Duration.ofMinutes(30));
        lenient().when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
    }

    /** Walks the multipart tree collecting every body part's text (plain + html). */
    private String allContent(MimeMessage message) throws Exception {
        StringBuilder sb = new StringBuilder();
        collect(message.getContent(), sb);
        return sb.toString();
    }

    private void collect(Object content, StringBuilder sb) throws Exception {
        if (content instanceof String text) {
            sb.append(text).append('\n');
        } else if (content instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                collect(multipart.getBodyPart(i).getContent(), sb);
            }
        }
    }

    private MimeMessage sendAndCapture(String email, String token) {
        emailService.sendMagicLinkEmail(email, token);
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        return captor.getValue();
    }

    @Nested
    @DisplayName("sendMagicLinkEmail")
    class SendMagicLinkEmail {

        @Test
        @DisplayName("should send email when email is enabled")
        void shouldSendEmailWhenEnabled() {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");

            emailService.sendMagicLinkEmail("test@example.com", "magic-token-123");

            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("should not send email when email is disabled (dev mode)")
        void shouldNotSendEmailWhenDisabled() {
            when(appProperties.isEmailEnabled()).thenReturn(false);
            when(appProperties.getBaseUrl()).thenReturn("http://localhost:8080");

            emailService.sendMagicLinkEmail("test@example.com", "magic-token-123");

            verify(mailSender, never()).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("should include the magic link in both plain and HTML parts")
        void shouldBuildCorrectMagicLinkUrl() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");

            MimeMessage sent = sendAndCapture("test@example.com", "my-secret-token");

            String link = "https://budgeteer.dev/auth/verify?token=my-secret-token";
            String content = allContent(sent);
            assertThat(content).contains(link);
            // the HTML part carries it as a real anchor — the reason this email is HTML at all
            assertThat(content).contains("href=\"" + link + "\"");
        }

        @Test
        @DisplayName("should send multipart/alternative with an HTML part")
        void shouldSendMultipartAlternative() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");

            MimeMessage sent = sendAndCapture("test@example.com", "token-123");

            assertThat(sent.getContent()).isInstanceOf(Multipart.class);
            assertThat(allContent(sent)).contains("Sign in to budgeteer");
        }

        @Test
        @DisplayName("should set correct recipient")
        void shouldSetCorrectRecipient() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");

            MimeMessage sent = sendAndCapture("recipient@example.com", "token-123");

            assertThat(sent.getAllRecipients()).hasSize(1);
            assertThat(sent.getAllRecipients()[0].toString()).isEqualTo("recipient@example.com");
        }

        @Test
        @DisplayName("should set correct subject")
        void shouldSetCorrectSubject() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");

            MimeMessage sent = sendAndCapture("test@example.com", "token-123");

            assertThat(sent.getSubject()).startsWith("Sign in to budgeteer (");
        }

        @Test
        @DisplayName("should set correct from address from app properties")
        void shouldSetCorrectFromAddress() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");

            MimeMessage sent = sendAndCapture("test@example.com", "token-123");

            assertThat(sent.getFrom()[0].toString()).isEqualTo("noreply@budgeteer.amfshr.dev");
        }

        @Test
        @DisplayName("should include the configured expiry in the email body")
        void shouldIncludeExpiryInfo() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");
            when(jweProperties.getMagicLinkExpiry()).thenReturn(Duration.ofMinutes(10));

            MimeMessage sent = sendAndCapture("test@example.com", "token-123");

            assertThat(allContent(sent)).contains("10 minutes");
        }

        @Test
        @DisplayName("should throw ApiException when mail sending fails")
        void shouldThrowExceptionWhenMailFails() {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("https://budgeteer.dev");
            doThrow(new MailSendException("SMTP connection failed"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendMagicLinkEmail("test@example.com", "token-123"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("couldn't send the login email")
                    .hasCauseInstanceOf(MailSendException.class);
        }

        @Test
        @DisplayName("should handle different base URLs correctly")
        void shouldHandleDifferentBaseUrls() throws Exception {
            when(appProperties.isEmailEnabled()).thenReturn(true);
            when(appProperties.getBaseUrl()).thenReturn("http://localhost:8080");

            MimeMessage sent = sendAndCapture("test@example.com", "dev-token");

            assertThat(allContent(sent))
                    .contains("http://localhost:8080/auth/verify?token=dev-token");
        }
    }
}
