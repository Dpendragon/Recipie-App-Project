import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private readonly apiKey: string | undefined;
  private readonly senderEmail: string | undefined;
  private readonly senderName: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY');
    this.senderEmail = this.config.get<string>('MAIL_FROM_EMAIL');
    this.senderName = this.config.get<string>('MAIL_FROM_NAME') ?? 'Recipe Finder';
  }

  // Gửi email chứa mã OTP.
  async sendOtpEmail(to: string, otp: string, expiresInMinutes: number): Promise<void> {
    if (!this.apiKey || !this.senderEmail) {
      this.logger.warn(`[DEV - chưa cấu hình Brevo] Mã OTP của ${to} là: ${otp}`);
      return;
    }

    const body = {
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: to }],
      subject: 'Mã xác thực đặt lại mật khẩu - Recipe Finder',
      htmlContent:
        `<p>Mã xác thực của bạn là:</p>` +
        `<h2 style="letter-spacing:4px">${otp}</h2>` +
        `<p>Mã có hiệu lực trong <b>${expiresInMinutes} phút</b>. Không chia sẻ mã này với bất kỳ ai.</p>` +
        `<p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>`,
      textContent:
        `Mã xác thực của bạn là: ${otp}\n` +
        `Mã có hiệu lực trong ${expiresInMinutes} phút. Không chia sẻ mã này với bất kỳ ai.\n` +
        `Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    };

    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Brevo trả lỗi ${response.status}: ${detail}`);
    }
  }
}
