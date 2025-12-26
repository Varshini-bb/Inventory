import nodemailer from "nodemailer";

let transporter;

export const initializeEmailService = () => {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendLowStockEmail = async (product, adminEmail) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `🚨 Low Stock Alert: ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Low Stock Alert</h2>
        <p>The following product is running low on stock:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${product.name}</h3>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Current Stock:</strong> <span style="color: #ef4444; font-size: 18px; font-weight: bold;">${product.quantity}</span></p>
          <p><strong>Threshold:</strong> ${product.lowStockThreshold}</p>
          <p><strong>Category:</strong> ${product.category || "N/A"}</p>
        </div>
        
        <p style="color: #6b7280;">Please reorder this product soon to avoid stockouts.</p>
        
        <a href="${process.env.FRONTEND_URL}/products/${product._id}" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Product
        </a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock email sent for product: ${product.name}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendExpiryAlertEmail = async (product, adminEmail, daysUntilExpiry) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `⏰ Expiry Alert: ${product.name} - ${daysUntilExpiry} days left`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">⏰ Product Expiry Alert</h2>
        <p>The following product is approaching its expiry date:</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">${product.name}</h3>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Expiry Date:</strong> <span style="color: #ef4444; font-weight: bold;">${
            product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : "N/A"
          }</span></p>
          <p><strong>Days Until Expiry:</strong> <span style="color: #ef4444; font-size: 18px; font-weight: bold;">${daysUntilExpiry}</span></p>
          <p><strong>Current Stock:</strong> ${product.quantity} units</p>
        </div>
        
        <p style="color: #6b7280;">Please review this product and take appropriate action.</p>
        
        <a href="${process.env.FRONTEND_URL}/products/${product._id}" 
           style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Product
        </a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Expiry alert email sent for product: ${product.name}`);
    return true;
  } catch (error) {
    console.error("Error sending expiry email:", error);
    return false;
  }
};

export const sendReorderReminderEmail = async (product, adminEmail) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `📦 Reorder Reminder: ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">📦 Time to Reorder</h2>
        <p>This product has reached its reorder point:</p>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af;">${product.name}</h3>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Current Stock:</strong> ${product.quantity}</p>
          <p><strong>Reorder Point:</strong> ${product.reorderPoint}</p>
          <p><strong>Suggested Reorder Quantity:</strong> <span style="color: #3b82f6; font-weight: bold;">${product.reorderQuantity}</span></p>
        </div>
        
        <p style="color: #6b7280;">Recommended action: Place an order for ${product.reorderQuantity} units.</p>
        
        <a href="${process.env.FRONTEND_URL}/products/${product._id}" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Reorder Now
        </a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reorder reminder email sent for product: ${product.name}`);
    return true;
  } catch (error) {
    console.error("Error sending reorder email:", error);
    return false;
  }
};