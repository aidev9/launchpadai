import { z } from "zod";

// Define the schema for invitation data
export const invitationSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  invitationUrl: z.string().url(),
});

export type InvitationData = z.infer<typeof invitationSchema>;

interface EmailTemplateProps {
  invitation: InvitationData;
}

export const createInvitationEmail = ({ invitation }: EmailTemplateProps) => {
  return {
    subject: "You've been invited to join LaunchpadAI!",
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You've been invited to join LaunchpadAI!</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4f46e5;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 30px;
            background-color: #f9fafb;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #6b7280;
          }
          h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          a {
            color: #4f46e5;
            text-decoration: none;
          }
          .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white !important;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 6px;
            margin-top: 20px;
            text-decoration: none;
          }
          .important {
            color: #dc2626;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to LaunchpadAI!</h1>
        </div>
        <div class="content">
          <p>Hello ${invitation.name},</p>
          
          <p>You've been invited to join LaunchpadAI! We're excited to have you on board.</p>
          
          <p>To complete your registration and set up your account, please click the button below:</p>
          
          <a href="${invitation.invitationUrl}" class="button">Complete Your Registration</a>
          
          <p class="important">This invitation link will expire in 24 hours for security reasons.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Welcome aboard!</p>
          <p><strong>The LaunchpadAI Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 LaunchpadAI. All rights reserved.</p>
          <p>
            <a href="https://www.launchpadai.io/privacy">Privacy Policy</a> | 
            <a href="https://www.launchpadai.io/terms">Terms of Service</a>
          </p>
        </div>
      </body>
    </html>
    `,
    text: `
    Welcome to LaunchpadAI!
    
    Hello ${invitation.name},
    
    You've been invited to join LaunchpadAI! We're excited to have you on board.
    
    To complete your registration and set up your account, please visit the following link:
    ${invitation.invitationUrl}
    
    IMPORTANT: This invitation link will expire in 24 hours for security reasons.
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Welcome aboard!
    The LaunchpadAI Team
    
    © 2025 LaunchpadAI. All rights reserved.
    Privacy Policy: https://www.launchpadai.io/privacy
    Terms of Service: https://www.launchpadai.io/terms
    `,
  };
};
