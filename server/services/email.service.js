import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY?.replace(/['"]/g, '');
sgMail.setApiKey(apiKey);

console.log('📧 SendGrid Config:', {
  apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : '✗ Missing',
  from: process.env.SENDGRID_FROM_EMAIL
});

export const sendEmergencyAlert = async ({ reportId, name, contact, location, description, severity }) => {
  const msg = {
    to: process.env.SENDGRID_FROM_EMAIL, // Send to emergency response team
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: `🚨 EMERGENCY ALERT - ${severity.toUpperCase()} - ${reportId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #1f2937; }
            .severity { display: inline-block; padding: 5px 15px; border-radius: 5px; font-weight: bold; color: white; }
            .severity-critical { background: #dc2626; }
            .severity-high { background: #ea580c; }
            .severity-medium { background: #f59e0b; }
            .severity-low { background: #10b981; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 EMERGENCY INCIDENT REPORTED</h1>
              <p>Immediate Action Required</p>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Report ID:</span>
                <span class="value">${reportId}</span>
              </div>
              <div class="field">
                <span class="label">Severity:</span>
                <span class="severity severity-${severity}">${severity.toUpperCase()}</span>
              </div>
              <div class="field">
                <span class="label">Reporter Name:</span>
                <span class="value">${name}</span>
              </div>
              <div class="field">
                <span class="label">Contact:</span>
                <span class="value">${contact}</span>
              </div>
              <div class="field">
                <span class="label">Location:</span>
                <span class="value">${location}</span>
              </div>
              <div class="field">
                <span class="label">Description:</span>
                <p class="value">${description}</p>
              </div>
              <div class="field">
                <span class="label">Time Reported:</span>
                <span class="value">${new Date().toLocaleString()}</span>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated emergency alert from Emergency Alert System</p>
              <p>Please respond immediately to this incident</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Emergency alert email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

export const sendReportConfirmation = async (email, reportId, name) => {
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: `Report Confirmation - ${reportId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Report Received</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Thank you for reporting the incident. Your report has been successfully received and emergency responders have been notified.</p>
              <p><strong>Report ID:</strong> ${reportId}</p>
              <p><strong>Expected Response Time:</strong> 5-10 minutes</p>
              <p>Emergency services are on their way. Please stay safe and follow any instructions from emergency responders.</p>
            </div>
            <div class="footer">
              <p>Emergency Alert System - We're here to help</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Confirmation email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    throw error;
  }
};
