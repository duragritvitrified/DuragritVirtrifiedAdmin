// DuraGrit Vitrified — Built-in Native Node.js SMTP Client (RFC 5321 / RFC 5322)
// Pure Node standard library (net + tls). No external npm dependencies required.
// Supports Google Gmail SMTP (smtp.gmail.com:587 STARTTLS & smtp.gmail.com:465 SSL/TLS).

import net from 'net';
import tls from 'tls';

class SmtpSocket {
  constructor(socket) {
    this.socket = socket;
    this.buffer = '';
    this.listeners = [];

    this.socket.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      this._checkLines();
    });
  }

  _checkLines() {
    while (this.listeners.length > 0) {
      // Find complete reply: a line matching /^\d{3} /
      // Replies can be multi-line: e.g. "250-line1\r\n250-line2\r\n250 final line\r\n"
      const lines = this.buffer.split(/\r?\n/);
      let completeIndex = -1;
      let finalCode = 0;
      let rawResponse = '';

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        const match = line.match(/^(\d{3})( |$)/);
        if (match) {
          completeIndex = i;
          finalCode = parseInt(match[1], 10);
          rawResponse = lines.slice(0, i + 1).join('\n');
          break;
        }
      }

      if (completeIndex !== -1) {
        // Remove processed lines from buffer
        const remaining = lines.slice(completeIndex + 1).join('\r\n');
        this.buffer = remaining;
        const cb = this.listeners.shift();
        cb({ code: finalCode, text: rawResponse });
      } else {
        break;
      }
    }
  }

  readReply(timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.listeners.indexOf(handler);
        if (idx !== -1) this.listeners.splice(idx, 1);
        reject(new Error(`SMTP operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const handler = (reply) => {
        clearTimeout(timer);
        resolve(reply);
      };

      this.listeners.push(handler);
      this._checkLines();
    });
  }

  write(data) {
    return new Promise((resolve, reject) => {
      this.socket.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async sendCommand(cmd, timeoutMs = 12000) {
    await this.write(cmd + '\r\n');
    return await this.readReply(timeoutMs);
  }

  close() {
    try {
      this.socket.end();
      this.socket.destroy();
    } catch (_) {}
  }
}

/**
 * Establish connected SmtpSocket with TLS upgrade if needed
 */
async function connectSmtp(config) {
  const host = config.smtpHost || config.host || 'smtp.gmail.com';
  const port = config.smtpPort || config.port || 587;
  const encryption = config.encryption || 'TLS';
  const numPort = parseInt(port, 10) || 587;
  const isDirectSsl = numPort === 465 || String(encryption).toUpperCase() === 'SSL';

  if (isDirectSsl) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        try { rawSocket.destroy(); } catch (_) {}
        reject(new Error(`TLS connection to ${host}:${numPort} timed out.`));
      }, 10000);

      const rawSocket = tls.connect(
        { host, port: numPort, servername: host, rejectUnauthorized: false },
        async () => {
          clearTimeout(timer);
          const client = new SmtpSocket(rawSocket);
          try {
            const banner = await client.readReply();
            if (banner.code >= 400) {
              client.close();
              reject(new Error(`Server rejected connection with code ${banner.code}: ${banner.text}`));
            } else {
              resolve(client);
            }
          } catch (e) {
            client.close();
            reject(e);
          }
        }
      );
      rawSocket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  } else {
    // Port 587 or STARTTLS
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        try { tcpSocket.destroy(); } catch (_) {}
        reject(new Error(`TCP connection to ${host}:${numPort} timed out.`));
      }, 10000);

      const tcpSocket = net.connect({ host, port: numPort }, async () => {
        clearTimeout(timer);
        let client = new SmtpSocket(tcpSocket);
        try {
          // 1. Read greeting banner
          const banner = await client.readReply();
          if (banner.code >= 400) {
            client.close();
            return reject(new Error(`Server greeting error ${banner.code}: ${banner.text}`));
          }

          // 2. Send EHLO
          const ehlo = await client.sendCommand('EHLO localhost');
          if (ehlo.code >= 400) {
            client.close();
            return reject(new Error(`EHLO failed ${ehlo.code}: ${ehlo.text}`));
          }

          // 3. Upgrade to STARTTLS if supported / requested
          if (ehlo.text.includes('STARTTLS') || String(encryption).toUpperCase() !== 'NONE') {
            const starttls = await client.sendCommand('STARTTLS');
            if (starttls.code !== 220) {
              client.close();
              return reject(new Error(`STARTTLS handshake refused: ${starttls.text}`));
            }

            // Upgrade existing socket to TLS
            const tlsSocket = tls.connect(
              {
                socket: tcpSocket,
                host,
                servername: host,
                rejectUnauthorized: false
              },
              async () => {
                const secureClient = new SmtpSocket(tlsSocket);
                try {
                  // After TLS handshake, must send EHLO again per RFC 3207
                  const secureEhlo = await secureClient.sendCommand('EHLO localhost');
                  if (secureEhlo.code >= 400) {
                    secureClient.close();
                    return reject(new Error(`Post-TLS EHLO failed: ${secureEhlo.text}`));
                  }
                  resolve(secureClient);
                } catch (err) {
                  secureClient.close();
                  reject(err);
                }
              }
            );

            tlsSocket.on('error', (err) => reject(err));
          } else {
            resolve(client);
          }
        } catch (e) {
          client.close();
          reject(e);
        }
      });

      tcpSocket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

/**
 * Authenticate with SMTP server using AUTH LOGIN
 */
async function authenticateSmtp(client, user, pass) {
  // Strip spaces if user pasted 16-character Google App Password with spaces
  const cleanPass = String(pass || '').replace(/\s+/g, '');
  const cleanUser = String(user || '').trim();

  if (!cleanUser || !cleanPass) {
    throw new Error('SMTP Username and Password are required for authentication.');
  }

  // 1. Send AUTH LOGIN
  const res1 = await client.sendCommand('AUTH LOGIN');
  if (res1.code !== 334) {
    throw new Error(`AUTH LOGIN rejected: ${res1.text}`);
  }

  // 2. Send Base64 Username
  const b64User = Buffer.from(cleanUser).toString('base64');
  const res2 = await client.sendCommand(b64User);
  if (res2.code !== 334) {
    throw new Error(`Username prompt failed: ${res2.text}`);
  }

  // 3. Send Base64 Password
  const b64Pass = Buffer.from(cleanPass).toString('base64');
  const res3 = await client.sendCommand(b64Pass);
  if (res3.code !== 235) {
    // Check for common Gmail 535 error
    if (res3.code === 535 || res3.text.includes('535')) {
      throw new Error(
        `Gmail Authentication Failed (535-5.7.8): Username and Password not accepted. If you use 2-Step Verification, generate a 16-character App Password at: https://myaccount.google.com/apppasswords`
      );
    }
    throw new Error(`Authentication failed (${res3.code}): ${res3.text}`);
  }

  return res3.text;
}

/**
 * Test SMTP connection & authentication
 */
export async function testSmtpHandshake(config) {
  const host = config.smtpHost || config.host || 'smtp.gmail.com';
  const port = config.smtpPort || config.port || 587;
  const user = config.smtpUser || config.user || config.senderEmail;
  const pass = config.smtpPassword || config.pass || config.password;
  const startTime = Date.now();
  let client;
  try {
    client = await connectSmtp({ ...config, host, port });

    // If credentials are provided, test AUTH LOGIN
    if (user && pass && !pass.includes('•••')) {
      await authenticateSmtp(client, user, pass);
      await client.sendCommand('QUIT');
      client.close();
      const latency = `${Date.now() - startTime}ms`;
      return {
        success: true,
        latency,
        message: `Successfully connected to ${host}:${port}. Gmail SMTP TLS session authenticated for ${user} (235 2.7.0 Authentication succeeded).`
      };
    } else {
      // Just test handshake & QUIT
      await client.sendCommand('QUIT');
      client.close();
      const latency = `${Date.now() - startTime}ms`;
      return {
        success: true,
        latency,
        message: `Successfully established TLS handshake with ${host}:${port} (${latency}). Ready for authentication.`
      };
    }
  } catch (err) {
    if (client) client.close();
    return {
      success: false,
      latency: `${Date.now() - startTime}ms`,
      message: err.message || String(err)
    };
  }
}

/**
 * Send an email via native SMTP
 */
export async function sendSmtpMail(config, { from, to, subject, html, text }) {
  const startTime = Date.now();
  let client;
  try {
    const host = config.smtpHost || config.host || 'smtp.gmail.com';
    const port = config.smtpPort || config.port || 587;
    const user = config.smtpUser || config.user || config.senderEmail;
    const pass = config.smtpPassword || config.pass || config.password;

    client = await connectSmtp({ ...config, host, port });

    await authenticateSmtp(client, user, pass);

    const fromAddress = from || config.senderEmail;
    const toAddress = to;

    // MAIL FROM
    const mailRes = await client.sendCommand(`MAIL FROM:<${fromAddress}>`);
    if (mailRes.code !== 250) {
      throw new Error(`MAIL FROM rejected (${mailRes.code}): ${mailRes.text}`);
    }

    // RCPT TO
    const rcptRes = await client.sendCommand(`RCPT TO:<${toAddress}>`);
    if (rcptRes.code !== 250 && rcptRes.code !== 251) {
      throw new Error(`RCPT TO rejected (${rcptRes.code}): ${rcptRes.text}`);
    }

    // DATA
    const dataRes = await client.sendCommand('DATA');
    if (dataRes.code !== 354) {
      throw new Error(`DATA command rejected (${dataRes.code}): ${dataRes.text}`);
    }

    const senderName = config.senderName || 'DuraGrit Vitrified Pvt. Ltd.';
    const replyTo = config.replyToEmail || fromAddress;
    const messageId = `<duragrit-${Date.now()}-${Math.floor(Math.random() * 100000)}@duragritvitrified.com>`;

    const mimeMessage = [
      `From: "${senderName}" <${fromAddress}>`,
      `To: <${toAddress}>`,
      `Reply-To: <${replyTo}>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      `X-Mailer: DuraGrit-Vitrified-SmtpGateway/2.0`,
      '',
      Buffer.from(html || text || '').toString('base64'),
      '',
      '.'
    ].join('\r\n');

    const endRes = await client.sendCommand(mimeMessage);
    if (endRes.code !== 250) {
      throw new Error(`Message body rejected (${endRes.code}): ${endRes.text}`);
    }

    await client.sendCommand('QUIT');
    client.close();

    const latency = `${Date.now() - startTime}ms`;
    return {
      success: true,
      messageId,
      smtpResponse: endRes.text,
      latency,
      message: `Message accepted for delivery: ${endRes.text.trim()}`
    };
  } catch (err) {
    if (client) client.close();
    return {
      success: false,
      latency: `${Date.now() - startTime}ms`,
      message: err.message || String(err)
    };
  }
}
