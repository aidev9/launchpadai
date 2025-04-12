import { WaitlistFormData } from "@/app/api/waitlist/actions";

interface EmailTemplateProps {
  customer: WaitlistFormData;
}

export const createConfirmationEmail = ({ customer }: EmailTemplateProps) => {
  return {
    subject: "Thank you for joining the LaunchpadAI waitlist!",
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you for joining the LaunchpadAI waitlist!</title>
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
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank You for Joining Our Waitlist!</h1>
        </div>
        <div class="content">
          <p>Hello ${customer.name},</p>
          
          <p>Thank you for your interest in LaunchpadAI! We're thrilled to have you on our waitlist for early access.</p>
          
          <p>We've recorded your details and will notify you as soon as we're ready to launch. As an early adopter, you'll receive:</p>
          
          <ul>
            <li>Priority access to our platform</li>
            <li>Special early-bird pricing</li>
            <li>Dedicated implementation support</li>
          </ul>
          
          <p>We're working hard to build an AI platform that will revolutionize how enterprises deploy and manage their AI solutions, and we can't wait to share it with you.</p>
          
          <p>If you have any questions in the meantime, please don't hesitate to reach out to our team.</p>
          
          <p>Warm regards,</p>
          <p><strong>The LaunchpadAI Team</strong></p>
          
          <a href="https://www.launchpadai.io" class="button">Visit Our Website</a>
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
    Thank You for Joining Our Waitlist!
    
    Hello ${customer.name},
    
    Thank you for your interest in LaunchpadAI! We're thrilled to have you on our waitlist for early access.
    
    We've recorded your details and will notify you as soon as we're ready to launch. As an early adopter, you'll receive:
    
    - Priority access to our platform
    - Special early-bird pricing
    - Dedicated implementation support
    
    We're working hard to build an AI platform that will revolutionize how enterprises deploy and manage their AI solutions, and we can't wait to share it with you.
    
    If you have any questions in the meantime, please don't hesitate to reach out to our team.
    
    Warm regards,
    The LaunchpadAI Team
    
    Visit Our Website: https://www.launchpadai.io
    
    © 2025 LaunchpadAI. All rights reserved.
    Privacy Policy: https://www.launchpadai.io/privacy
    Terms of Service: https://www.launchpadai.io/terms
    `,
  };
};
