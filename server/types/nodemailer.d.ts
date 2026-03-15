declare module "nodemailer" {
  export type MailAttachment = {
    filename?: string;
    content?: string | Buffer;
    contentType?: string;
    [key: string]: unknown;
  };

  export type MailOptions = {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    subject?: string;
    text?: string;
    html?: string;
    attachments?: MailAttachment[];
    [key: string]: unknown;
  };

  export type TransportOptions = {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
    logger?: boolean;
    debug?: boolean;
    [key: string]: unknown;
  };

  export interface Transporter {
    verify(): Promise<void>;
    sendMail(options: MailOptions): Promise<Record<string, unknown>>;
  }

  export function createTransport(options: TransportOptions): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
