import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "sylw3st3r.projects@gmail.com",
    pass: "<App password>",
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const appVerificationLink = `http://localhost:3000/verify/${token}`;
  await transporter.sendMail({
    from: '"Event planner" sylw3st3r.projects@gmail.com',
    to: email,
    subject: "Verify your Email",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Verify Your Email</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: #4a90e2; padding: 20px; color: white; text-align: center;">
                <h1 style="margin: 0;">Event Planner</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p style="font-size: 16px; color: #555;">Hi there,</p>
                <p style="font-size: 16px; color: #555;">
                  Thanks for signing up! Please verify your email address by clicking the button below. This link will expire in 1 hour.
                </p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${appVerificationLink}" style="background-color: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    Verify Email
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
  });
}
