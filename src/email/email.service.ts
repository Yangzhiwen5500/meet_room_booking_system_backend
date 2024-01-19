import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: 'yangzhiwen5500@qq.com',
        pass: 'emaxsritkdsfbfjg',
      },
    });
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: 'Testing',
        address: 'yangzhiwen5500@qq.com',
      },
      to,
      subject,
      html,
    });
  }
}
