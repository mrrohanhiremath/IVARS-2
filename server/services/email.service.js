import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY?.replace(/['"]/g, '');
sgMail.setApiKey(apiKey);

console.log('📧 SendGrid Config:', {
  apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : '✗ Missing',
  from: process.env.SENDGRID_FROM_EMAIL
});

export const sendEmergencyAlert = async ({ 
  reportId, 
  name, 
  contact, 
  location, 
  coordinates,
  description, 
  severity, 
  vehicleNo,
  witnessInfo,
  images = [],
  responderEmails = [] 
}) => {
  // If no responder emails provided, send to default emergency email
  const recipients = responderEmails.length > 0 ? responderEmails : [process.env.SENDGRID_FROM_EMAIL];
  
  console.log('📧 Preparing email with images:', images.map(img => img.url));
  
  // Generate Google Maps link
  const mapsLink = coordinates ? 
    `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  // Optimize Cloudinary URLs for email delivery
  const optimizedImages = images.map(img => {
    // Add transformations to Cloudinary URL for better email compatibility
    let optimizedUrl = img.url;
    if (img.url && img.url.includes('cloudinary.com') && img.url.includes('/upload/')) {
      // Insert transformations after /upload/ - format: f_jpg (force JPEG), q_80 (quality), w_600 (width)
      optimizedUrl = img.url.replace('/upload/', '/upload/f_jpg,q_80,w_600/');
    }
    console.log('🖼️  Original URL:', img.url);
    console.log('🖼️  Optimized URL:', optimizedUrl);
    return { ...img, url: optimizedUrl };
  });

  // Generate images HTML with direct, non-blocked URLs
  const imagesHTML = images.length > 0 ? `
    <div class="section">
      <div class="section-title">Incident Photos</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 15px;">
        <tr>
          ${images.map((img, index) => {
            // Use direct Cloudinary URL without transformations for better compatibility
            const directUrl = img.url;
            return `
            ${index > 0 && index % 2 === 0 ? '</tr><tr>' : ''}
            <td width="50%" style="padding: 5px;" valign="top">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <a href="${directUrl}" target="_blank" style="display: block;">
                      <img src="${directUrl}" 
                           alt="" 
                           width="280"
                           style="width: 100%; max-width: 280px; height: auto; display: block; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          `;
          }).join('')}
          ${images.length % 2 !== 0 ? '<td width="50%" style="padding: 5px;"></td>' : ''}
        </tr>
      </table>
      <p style="font-size: 11px; color: #666; margin-top: 12px; text-align: center; line-height: 1.5;">
        📷 ${images.length} photo(s) • <a href="${images[0]?.url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">Click here to view images</a> if not displayed
      </p>
    </div>
  ` : '';
  
  // Generate witness info HTML - removed as it's inline now
  
  // Generate vehicle info HTML - removed as it's inline now
  
  const msg = {
    to: recipients,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: `🚨 EMERGENCY ALERT - ${severity.toUpperCase()} - ${reportId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              line-height: 1.6; 
              color: #333;
              background: #f5f5f5;
              padding: 20px;
            }
            .email-container { 
              max-width: 650px; 
              margin: 0 auto; 
              background: white;
              border: 1px solid #e0e0e0;
            }
            .header { 
              background: #dc2626;
              color: white; 
              padding: 30px;
              border-bottom: 4px solid #991b1b;
            }
            .header h1 { 
              font-size: 24px; 
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header .subtitle {
              font-size: 14px;
              opacity: 0.95;
            }
            .alert-badge {
              display: inline-block;
              padding: 8px 16px;
              margin-top: 15px;
              font-weight: 700;
              font-size: 14px;
              letter-spacing: 0.5px;
              color: white;
            }
            .severity-critical { background: #7f1d1d; }
            .severity-high { background: #ea580c; }
            .severity-medium { background: #f59e0b; }
            .severity-low { background: #059669; }
            .content { 
              padding: 30px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #111;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            .info-row {
              padding: 12px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-size: 12px;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 15px;
              color: #111;
              word-break: break-word;
            }
            .description-box {
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 15px 0;
            }
            .description-text {
              font-size: 14px;
              line-height: 1.7;
              color: #333;
            }
            .images-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            .image-wrapper {
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              overflow: hidden;
              background: #f9fafb;
            }
            .incident-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              display: block;
              border: none;
              max-width: 100%;
            }
            .map-section {
              background: #f0f9ff;
              border: 1px solid #bfdbfe;
              padding: 20px;
              text-align: center;
              margin-top: 15px;
            }
            .map-button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              font-weight: 600;
              font-size: 14px;
              margin-top: 10px;
            }
            .map-button:hover {
              background: #1d4ed8;
            }
            .cta-section {
              background: #fef2f2;
              border: 2px solid #fecaca;
              padding: 20px;
              text-align: center;
              margin-top: 30px;
            }
            .cta-title {
              font-size: 16px;
              font-weight: 700;
              color: #991b1b;
              margin-bottom: 8px;
            }
            .cta-text {
              color: #7f1d1d;
              font-size: 14px;
            }
            .footer { 
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 20px 30px;
              text-align: center;
            }
            .footer-title {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            }
            .footer-text {
              font-size: 12px;
              color: #666;
              line-height: 1.6;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 0; }
              .content { padding: 20px; }
              .header { padding: 20px; }
              .images-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🚨 Emergency Alert</h1>
              <p class="subtitle">Immediate Response Required</p>
              <div class="alert-badge severity-${severity}">
                ${severity.toUpperCase()} PRIORITY
              </div>
            </div>
            
            <div class="content">
              <!-- Report ID Section -->
              <div class="section">
                <div class="section-title">Report Details</div>
                <div class="info-row">
                  <div class="info-label">Report ID</div>
                  <div class="info-value">${reportId}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Reported At</div>
                  <div class="info-value">${new Date().toLocaleString('en-US', { 
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}</div>
                </div>
              </div>

              <!-- Reporter Information -->
              <div class="section">
                <div class="section-title">Reporter Information</div>
                <div class="info-row">
                  <div class="info-label">Name</div>
                  <div class="info-value">${name}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Contact Number</div>
                  <div class="info-value">${contact}</div>
                </div>
                ${vehicleNo ? `
                <div class="info-row">
                  <div class="info-label">Vehicle Number</div>
                  <div class="info-value">${vehicleNo}</div>
                </div>
                ` : ''}
              </div>

              <!-- Location Information -->
              <div class="section">
                <div class="section-title">Location Details</div>
                <div class="info-row">
                  <div class="info-label">Location</div>
                  <div class="info-value">${location}</div>
                </div>
                ${coordinates ? `
                <div class="info-row">
                  <div class="info-label">Coordinates</div>
                  <div class="info-value">${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}</div>
                </div>
                ` : ''}
                <div class="map-section">
                  <div style="font-size: 14px; color: #334155; margin-bottom: 10px; font-weight: 600;">View Incident Location</div>
                  <a href="${mapsLink}" class="map-button" target="_blank">Open in Google Maps</a>
                </div>
              </div>

              <!-- Description -->
              <div class="section">
                <div class="section-title">Incident Description</div>
                <div class="description-box">
                  <div class="description-text">${description}</div>
                </div>
              </div>

              <!-- Witness Information -->
              ${witnessInfo ? `
              <div class="section">
                <div class="section-title">Witness Information</div>
                <div class="info-row">
                  <div class="info-value">${witnessInfo}</div>
                </div>
              </div>
              ` : ''}

              <!-- Images -->
              ${imagesHTML}

              <!-- Call to Action -->
              <div class="cta-section">
                <div class="cta-title">⚡ Immediate Action Required</div>
                <p class="cta-text">This is a ${severity} priority incident. Please respond immediately and update the incident status.</p>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-title">Emergency Alert System</div>
              <p class="footer-text">
                This is an automated emergency notification.<br>
                You received this because you are a registered emergency responder in the area.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Emergency alert email sent successfully to ${recipients.length} responder(s)`);
    return { success: true, recipients: recipients.length };
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
