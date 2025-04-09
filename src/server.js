const express = require('express');
const cors = require('cors');
const formData = require('form-data');
const Mailgun = require('mailgun.js');

// Load environment variables
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
});
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

// In-memory order storage (replace with actual database in production)
const orders = [];

// API Routes
app.post('/api/orders', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.items || !req.body.customer || !req.body.customer.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required order information' 
      });
    }
    
    // Generate order ID
    const orderId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Create order object
    const order = {
      id: orderId,
      ...req.body,
      status: 'confirmed',
      createdAt: new Date()
    };
    
    // Save order (to database in a real app)
    orders.push(order);
    
    // Send confirmation email
    await sendOrderConfirmationEmail(order);
    
    // Return success response
    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt
      },
      message: 'Order created successfully and confirmation email sent.'
    });
    
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process order'
    });
  }
});

// Function to send order confirmation email
async function sendOrderConfirmationEmail(order) {
  try {
    
    let emailHtml = emailTemplate(order)

    // Send email via Mailgun
    const response = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `Your Store <orders@${MAILGUN_DOMAIN}>`,
      to: order.customer.email,
      subject: `Order Confirmation #${order.id}`,
      html: emailHtml,
      'o:tag': ['order-confirmation'],
      'o:tracking': true
    });
    
    console.log('Email sent successfully:', response);
    return response;
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

function emailTemplate(order) {
  // Format items for email
  const itemsList = order.items.map(item => {
    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          ${item.name}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');
  
  // Create email HTML template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { margin-top: 20px; }
        .order-table { width: 100%; border-collapse: collapse; }
        .order-table th { text-align: left; padding: 10px 0; border-bottom: 2px solid #ddd; }
        .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #777; }
        .total-row { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Order Confirmation</h2>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
          <p>Hello ${order.customer.name},</p>
          
          <p>Your order has been confirmed. Here are your order details:</p>
          
          <div class="order-details">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            
            <table class="order-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
                <tr>
                  <td colspan="3" style="text-align: right; padding-top: 20px;"><strong>Subtotal:</strong></td>
                  <td style="text-align: right; padding-top: 20px;"><strong>$${order.subtotal.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;"><strong>Tax:</strong></td>
                  <td style="text-align: right;"><strong>$${order.tax.toFixed(2)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; padding-top: 10px;"><strong>Total:</strong></td>
                  <td style="text-align: right; padding-top: 10px;"><strong>$${order.total.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 30px;">
            <p><strong>Shipping Address:</strong></p>
            <p>
              ${order.shipping.address}<br>
              ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zipCode}
            </p>
          </div>
          
          <div style="margin-top: 30px;">
            <p><strong>Payment Method:</strong> ${order.payment.method} (ending in ${order.payment.last4})</p>
          </div>
          
          <div style="margin-top: 30px;">
            <p>If you have any questions about your order, please contact our customer support.</p>
            <p>Thank you for shopping with us!</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email, please do not reply to this message.</p>
          <p>© 2025 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return emailHtml;
}

// const testOrder = {
//   id: "TEST123",
//   customer: {
//     name: "Test User",
//     email: "test@example.com" // Use one of your verified emails for testing
//   },
//   items: [
//     { name: "Test Product", quantity: 1, price: 29.99 }
//   ],
//   subtotal: 29.99,
//   tax: 2.99,
//   total: 32.98,
//   shipping: {
//     address: "123 Test Street",
//     city: "Test City",
//     state: "TS",
//     zipCode: "12345"
//   },
//   payment: {
//     method: "Credit Card",
//     last4: "4242"
//   },
//   createdAt: new Date()
// };

// sendOrderConfirmationEmail(testOrder)
//   .then(response => {
//     console.log('Test email sent successfully!');
//     console.log('Message ID:', response.id);
//     console.log('Message status:', response.status);
//   })
//   .catch(error => {
//     console.error('Failed to send test email:', error.message);
//   });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});