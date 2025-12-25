import nodemailer from "nodemailer";
import Settings from "../models/Settings.js";

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async initialize() {
    try {
      const settings = await Settings.findOne();
      
      if (!settings?.emailConfig?.host) {
        console.log("Email not configured, using default test account");
        // Create test account for development
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: settings.emailConfig.host,
          port: settings.emailConfig.port,
          secure: settings.emailConfig.secure,
          auth: {
            user: settings.emailConfig.user,
            pass: settings.emailConfig.pass,
          },
        });
      }
      
      console.log("✅ Email service initialized");
    } catch (error) {
      console.error("Email service initialization error:", error);
    }
  }

  async sendLowStockAlert(product, toEmail) {
    try {
      if (!this.transporter) await this.initialize();

      const info = await this.transporter.sendMail({
        from: '"Inventory System" <noreply@inventory.com>',
        to: toEmail,
        subject: `⚠️ Low Stock Alert: ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Low Stock Alert</h2>
            <p>The following product is running low on stock:</p>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${product.name}</h3>
              <p style="margin: 5px 0;"><strong>SKU:</strong> ${product.sku}</p>
              <p style="margin: 5px 0;"><strong>Current Stock:</strong> ${product.quantity}</p>
              <p style="margin: 5px 0;"><strong>Threshold:</strong> ${product.lowStockThreshold}</p>
            </div>
            <p>Please reorder this product soon to avoid stockouts.</p>
          </div>
        `,
      });

      console.log("Low stock email sent:", info.messageId);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error("Error sending low stock email:", error);
      throw error;
    }
  }

  async sendOutOfStockAlert(product, toEmail) {
    try {
      if (!this.transporter) await this.initialize();

      const info = await this.transporter.sendMail({
        from: '"Inventory System" <noreply@inventory.com>',
        to: toEmail,
        subject: `🚨 Out of Stock Alert: ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Out of Stock Alert</h2>
            <p>The following product is now out of stock:</p>
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${product.name}</h3>
              <p style="margin: 5px 0;"><strong>SKU:</strong> ${product.sku}</p>
              <p style="margin: 5px 0;"><strong>Current Stock:</strong> 0</p>
            </div>
            <p><strong style="color: #ef4444;">Immediate action required!</strong> This product needs to be restocked urgently.</p>
          </div>
        `,
      });

      console.log("Out of stock email sent:", info.messageId);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error("Error sending out of stock email:", error);
      throw error;
    }
  }

  async sendExpiryAlert(product, toEmail) {
    try {
      if (!this.transporter) await this.initialize();

      const daysUntilExpiry = Math.ceil(
        (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const info = await this.transporter.sendMail({
        from: '"Inventory System" <noreply@inventory.com>',
        to: toEmail,
        subject: `⏰ Expiry Alert: ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Product Expiring Soon</h2>
            <p>The following perishable product is approaching its expiry date:</p>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${product.name}</h3>
              <p style="margin: 5px 0;"><strong>SKU:</strong> ${product.sku}</p>
              <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${new Date(product.expiryDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Days Until Expiry:</strong> ${daysUntilExpiry} days</p>
              <p style="margin: 5px 0;"><strong>Quantity:</strong> ${product.quantity}</p>
            </div>
            <p>Please take appropriate action to minimize waste.</p>
          </div>
        `,
      });

      console.log("Expiry alert email sent:", info.messageId);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error("Error sending expiry email:", error);
      throw error;
    }
  }

  async sendReorderReminder(product, toEmail) {
    try {
      if (!this.transporter) await this.initialize();

      const info = await this.transporter.sendMail({
        from: '"Inventory System" <noreply@inventory.com>',
        to: toEmail,
        subject: `📦 Reorder Reminder: ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Reorder Reminder</h2>
            <p>It's time to reorder the following product:</p>
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${product.name}</h3>
              <p style="margin: 5px 0;"><strong>SKU:</strong> ${product.sku}</p>
              <p style="margin: 5px 0;"><strong>Current Stock:</strong> ${product.quantity}</p>
              <p style="margin: 5px 0;"><strong>Reorder Point:</strong> ${product.reorderPoint}</p>
              <p style="margin: 5px 0;"><strong>Suggested Quantity:</strong> ${product.reorderQuantity}</p>
            </div>
            <p>Stock has reached the reorder point. Place an order to maintain optimal inventory levels.</p>
          </div>
        `,
      });

      console.log("Reorder reminder email sent:", info.messageId);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error("Error sending reorder email:", error);
      throw error;
    }
  }
}

export default new EmailService();