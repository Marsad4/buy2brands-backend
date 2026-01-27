/**
 * Generate customer order confirmation email HTML
 * @param {Object} order - The order object
 * @param {Object} user - The user object
 * @returns {Object} Email subject and HTML content
 */
function generateCustomerOrderEmail(order, user) {
  const itemsHtml = order.items.map(item => {
    let variationsHtml = '';

    if (item.isPack && item.variations && item.variations.length > 0) {
      variationsHtml = `
        <div style="margin-left: 20px; font-size: 13px; color: #666;">
          ${item.variations.map(v => `
            <div>• ${v.size || 'N/A'} / ${v.color || 'N/A'} - Qty: ${v.quantity}</div>
          `).join('')}
        </div>
      `;
    } else {
      variationsHtml = `
        <div style="margin-left: 20px; font-size: 13px; color: #666;">
          • Size: ${item.size || 'N/A'} / Color: ${item.color || 'N/A'} - Qty: ${item.quantity}
        </div>
      `;
    }

    return `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; color: #333;">${item.productName}</div>
          <div style="font-size: 13px; color: #888; margin-top: 5px;">Brand: ${item.brand}</div>
          ${variationsHtml}
          ${item.isPack ? `<div style="margin-left: 20px; font-size: 13px; color: #666;">Pack: ${item.itemCount} items ${item.hasDiscount ? `(${item.discountPercent}% discount)` : ''}</div>` : ''}
        </td>
        <td style="padding: 15px; text-align: right; border-bottom: 1px solid #eee; white-space: nowrap;">
          <div style="font-weight: 600; color: #333;">£${item.totalPrice.toFixed(2)}</div>
          <div style="font-size: 13px; color: #888;">£${item.unitPrice.toFixed(2)} each</div>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">Thank you for your order</p>
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Hi <strong>${user.firstName || user.companyName || 'Customer'}</strong>,</p>
                  <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.6;">
                    We've received your order and it's being processed. You'll receive another email when your order ships.
                  </p>

                  <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Order Number</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${order.orderId}</div>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-size: 14px;">Order Date:</td>
                      <td style="padding: 10px 0; text-align: right; color: #333; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-size: 14px;">Payment Method:</td>
                      <td style="padding: 10px 0; text-align: right; color: #333; font-weight: 600;">${order.paymentMethod.toUpperCase()}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Order Items -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px; font-weight: 700;">Order Items</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    ${itemsHtml}
                    <tr style="background-color: #f8fafc;">
                      <td style="padding: 20px; text-align: right; font-weight: 700; font-size: 18px; color: #1e293b;">Total:</td>
                      <td style="padding: 20px; text-align: right; font-weight: 700; font-size: 18px; color: #1e3a8a;">£${order.totalAmount.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Shipping Address -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px; font-weight: 700;">Shipping Address</h2>
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="color: #333; font-weight: 600; margin-bottom: 8px;">${order.shippingAddress.fullName}</div>
                    <div style="color: #666; line-height: 1.6;">
                      ${order.shippingAddress.street}<br>
                      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                      ${order.shippingAddress.country}<br>
                      <div style="margin-top: 8px;">
                        <strong>Phone:</strong> ${order.shippingAddress.phone}<br>
                        <strong>Email:</strong> ${order.shippingAddress.email}
                      </div>
                    </div>
                  </div>
                  ${order.customerNotes ? `
                    <div style="margin-top: 15px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                      <div style="color: #92400e; font-weight: 600; margin-bottom: 5px;">Your Note:</div>
                      <div style="color: #78350f;">${order.customerNotes}</div>
                    </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                    If you have any questions, please contact us at 
                    <a href="mailto:sales@buy2brands.com" style="color: #3b82f6; text-decoration: none;">sales@buy2brands.com</a>
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                    © ${new Date().getFullYear()} Buy2Brands. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `Order Confirmation - ${order.orderId}`,
    html,
    text: `Thank you for your order!\n\nOrder Number: ${order.orderId}\nTotal: £${order.totalAmount.toFixed(2)}\n\nWe'll send you another email when your order ships.`
  };
}

/**
 * Generate admin order notification email HTML
 * @param {Object} order - The order object
 * @param {Object} user - The user object
 * @returns {Object} Email subject and HTML content
 */
function generateAdminOrderEmail(order, user) {
  const itemsHtml = order.items.map(item => {
    let variationsHtml = '';

    if (item.isPack && item.variations && item.variations.length > 0) {
      variationsHtml = `
        <div style="margin-left: 15px; font-size: 12px; color: #666; margin-top: 5px;">
          ${item.variations.map(v => `
            <div>• ${v.size || 'N/A'} / ${v.color || 'N/A'} - Qty: ${v.quantity}</div>
          `).join('')}
        </div>
      `;
    } else {
      variationsHtml = `
        <div style="margin-left: 15px; font-size: 12px; color: #666; margin-top: 5px;">
          • Size: ${item.size || 'N/A'} / Color: ${item.color || 'N/A'} - Qty: ${item.quantity}
        </div>
      `;
    }

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; color: #333;">${item.productName}</div>
          <div style="font-size: 12px; color: #888;">Brand: ${item.brand}</div>
          ${variationsHtml}
          ${item.isPack ? `<div style="margin-left: 15px; font-size: 12px; color: #666;">Pack: ${item.itemCount} items</div>` : ''}
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; white-space: nowrap;">£${item.totalPrice.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">🔔 New Order Received</h1>
                  <p style="margin: 10px 0 0 0; color: #fee2e2; font-size: 15px;">Action Required - Process and Deliver</p>
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                    <div style="font-size: 13px; color: #991b1b; margin-bottom: 5px;">ORDER ID</div>
                    <div style="font-size: 24px; font-weight: 700; color: #7f1d1d;">${order.orderId}</div>
                    <div style="margin-top: 10px; font-size: 14px; color: #991b1b;">
                      Placed: ${new Date(order.createdAt).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
                    </div>
                  </div>

                  <!-- Customer Info -->
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Customer Information</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 15px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">Name:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${user.firstName || ''} ${user.lastName || ''}</td>
                          </tr>
                          ${user.companyName ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Company:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${user.companyName}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email:</td>
                            <td style="padding: 8px 0; color: #3b82f6;"><a href="mailto:${user.email}" style="color: #3b82f6; text-decoration: none;">${user.email}</a></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Phone:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${order.shippingAddress.phone}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Payment:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${order.paymentMethod.toUpperCase()}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Order Items -->
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Order Items</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
                    <tr style="background-color: #f1f5f9;">
                      <th style="padding: 12px; text-align: left; color: #475569; font-size: 13px; font-weight: 600;">Product</th>
                      <th style="padding: 12px; text-align: center; color: #475569; font-size: 13px; font-weight: 600;">Qty</th>
                      <th style="padding: 12px; text-align: right; color: #475569; font-size: 13px; font-weight: 600;">Price</th>
                    </tr>
                    ${itemsHtml}
                    <tr style="background-color: #fef2f2;">
                      <td colspan="2" style="padding: 15px; text-align: right; font-weight: 700; font-size: 16px; color: #7f1d1d;">TOTAL:</td>
                      <td style="padding: 15px; text-align: right; font-weight: 700; font-size: 16px; color: #7f1d1d;">£${order.totalAmount.toFixed(2)}</td>
                    </tr>
                  </table>

                  <!-- Shipping Details -->
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Shipping Details</h2>
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <div style="color: #1e293b; font-weight: 600; font-size: 15px; margin-bottom: 10px;">${order.shippingAddress.fullName}</div>
                    <div style="color: #475569; line-height: 1.8; font-size: 14px;">
                      ${order.shippingAddress.street}<br>
                      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                      ${order.shippingAddress.country}
                    </div>
                  </div>

                  ${order.customerNotes ? `
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                    <div style="color: #92400e; font-weight: 600; margin-bottom: 8px; font-size: 14px;">📝 Customer Note:</div>
                    <div style="color: #78350f; font-size: 14px; line-height: 1.6;">${order.customerNotes}</div>
                  </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Action Required -->
              <tr>
                <td style="background-color: #fef2f2; padding: 20px; text-align: center; border-top: 2px solid #fecaca;">
                  <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: 600; font-size: 15px;">
                    ⚠️ Action Required: Process this order and prepare for delivery
                  </p>
                  <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
                    Update order status in the admin panel after processing
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `🔔 New Order #${order.orderId} - £${order.totalAmount.toFixed(2)}`,
    html,
    text: `New Order Received!\n\nOrder: ${order.orderId}\nCustomer: ${user.firstName} ${user.lastName}\nTotal: £${order.totalAmount.toFixed(2)}\n\nProcess and deliver this order.`
  };
}

/**
 * Generate customer order cancellation email HTML
 * @param {Object} order - The order object
 * @param {Object} user - The user object
 * @returns {Object} Email subject and HTML content
 */
function generateCustomerCancellationEmail(order, user) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Order Cancelled</h1>
                  <p style="margin: 10px 0 0 0; color: #fee2e2; font-size: 16px;">Your order has been cancelled</p>
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Hi <strong>${user.firstName || user.companyName || 'Customer'}</strong>,</p>
                  <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.6;">
                    Your order has been successfully cancelled as requested. No charges will be processed for this order.
                  </p>

                  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <div style="font-size: 14px; color: #991b1b; margin-bottom: 5px;">Cancelled Order Number</div>
                    <div style="font-size: 20px; font-weight: 700; color: #7f1d1d;">${order.orderId}</div>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-size: 14px;">Order Date:</td>
                      <td style="padding: 10px 0; text-align: right; color: #333; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-size: 14px;">Cancelled Date:</td>
                      <td style="padding: 10px 0; text-align: right; color: #333; font-weight: 600;">${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-size: 14px;">Total Amount:</td>
                      <td style="padding: 10px 0; text-align: right; color: #333; font-weight: 600;">£${order.totalAmount.toFixed(2)}</td>
                    </tr>
                  </table>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      <strong>What happens next?</strong><br>
                      If you paid for this order, any charges will be refunded within 5-7 business days. You can place a new order anytime from our website.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                    If you have any questions or didn't request this cancellation, please contact us at 
                    <a href="mailto:sales@buy2brands.com" style="color: #3b82f6; text-decoration: none;">sales@buy2brands.com</a>
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                    © ${new Date().getFullYear()} Buy2Brands. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `Order Cancelled - ${order.orderId}`,
    html,
    text: `Your order ${order.orderId} has been cancelled.\n\nTotal: £${order.totalAmount.toFixed(2)}\n\nIf you paid for this order, charges will be refunded within 5-7 business days.`
  };
}

/**
 * Generate admin order cancellation notification email HTML
 * @param {Object} order - The order object
 * @param {Object} user - The user object
 * @returns {Object} Email subject and HTML content
 */
function generateAdminCancellationEmail(order, user) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancellation Notice</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">⚠️ Order Cancelled</h1>
                  <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 15px;">Customer Cancellation Notice</p>
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                    <div style="font-size: 13px; color: #991b1b; margin-bottom: 5px;">CANCELLED ORDER ID</div>
                    <div style="font-size: 24px; font-weight: 700; color: #7f1d1d;">${order.orderId}</div>
                    <div style="margin-top: 10px; font-size: 14px; color: #991b1b;">
                      Cancelled: ${new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
                    </div>
                  </div>

                  <!-- Customer Info -->
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Customer Information</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 15px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">Name:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${user.firstName || ''} ${user.lastName || ''}</td>
                          </tr>
                          ${user.companyName ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Company:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${user.companyName}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email:</td>
                            <td style="padding: 8px 0; color: #3b82f6;"><a href="mailto:${user.email}" style="color: #3b82f6; text-decoration: none;">${user.email}</a></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Order Date:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Total Amount:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">£${order.totalAmount.toFixed(2)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                    <div style="color: #92400e; font-weight: 600; margin-bottom: 8px; font-size: 14px;">⚠️ Action Required:</div>
                    <div style="color: #78350f; font-size: 14px; line-height: 1.6;">
                      • Stop processing this order if not yet shipped<br>
                      • Update inventory if items were reserved<br>
                      • Process refund if payment was received<br>
                      • Update order status in the system
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #fef2f2; padding: 20px; text-align: center; border-top: 2px solid #fecaca;">
                  <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
                    Update the order status in the admin panel
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `⚠️ Order Cancelled #${order.orderId} - £${order.totalAmount.toFixed(2)}`,
    html,
    text: `Order Cancelled!\n\nOrder: ${order.orderId}\nCustomer: ${user.firstName} ${user.lastName}\nTotal: £${order.totalAmount.toFixed(2)}\n\nStop processing and issue refund if needed.`
  };
}

/**
 * Generate email verification code email HTML
 * @param {String} code - The 6-digit verification code
 * @returns {Object} Email subject and HTML content
 */
function generateVerificationEmail(code) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Verify Your Email</h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">Complete your registration</p>
                </td>
              </tr>

              <!-- Verification Code -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                    Enter this verification code to complete your registration:
                  </p>

                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 3px dashed #3b82f6; border-radius: 12px; padding: 30px; margin: 25px 0;">
                    <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #1e3a8a; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </div>

                  <p style="margin: 20px 0 10px 0; color: #666; font-size: 14px;">
                    This code will expire in <strong style="color: #dc2626;">15 minutes</strong>
                  </p>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px; text-align: left;">
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      <strong>Security Note:</strong><br>
                      • Never share this code with anyone<br>
                      • We will never ask for this code via phone or email<br>
                      • If you didn't request this code, please ignore this email
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                    If you're having trouble, please contact us at 
                    <a href="mailto:sales@buy2brands.com" style="color: #3b82f6; text-decoration: none;">sales@buy2brands.com</a>
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                    © ${new Date().getFullYear()} Buy2Brands. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: 'Your Verification Code - Buy2Brands',
    html,
    text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`
  };
}


/**
 * Generate admin return request notification email HTML
 * @param {Object} request - The return request object
 * @param {Object} user - The user object
 * @returns {Object} Email subject and HTML content
 */
function generateAdminReturnRequestEmail(request, user) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Return Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">↩️ New Return Request</h1>
                  <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 15px;">Customer submitted a return request</p>
                </td>
              </tr>

              <!-- Request Info -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                    <div style="font-size: 13px; color: #92400e; margin-bottom: 5px;">ORDER ID</div>
                    <div style="font-size: 24px; font-weight: 700; color: #78350f;">${request.orderId}</div>
                  </div>

                  <!-- Customer Info -->
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Customer Information</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 15px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">Name:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${user.firstName || ''} ${user.lastName || ''}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email:</td>
                            <td style="padding: 8px 0; color: #3b82f6;"><a href="mailto:${user.email}" style="color: #3b82f6; text-decoration: none;">${user.email}</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Return Details -->
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Return Details</h2>
                  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: white;">
                    <div style="margin-bottom: 15px;">
                      <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">Reason:</div>
                      <div style="color: #1e293b; font-weight: 600; font-size: 16px;">${request.reason}</div>
                    </div>
                    <div>
                      <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">Message:</div>
                      <div style="color: #333; line-height: 1.6; background-color: #f8fafc; padding: 12px; border-radius: 6px;">
                        ${request.message || 'No additional message provided.'}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #fef3c7; padding: 20px; text-align: center; border-top: 2px solid #fcd34d;">
                  <p style="margin: 0; color: #78350f; font-size: 13px;">
                    Manage this request in the admin panel
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `↩️ New Return Request - ${request.orderId} (${request.reason})`,
    html,
    text: `New Return Request\n\nOrder: ${request.orderId}\nCustomer: ${user.firstName} ${user.lastName}\nReason: ${request.reason}\n\nMessage: ${request.message || 'None'}\n\nPlease check the admin panel.`
  };
}

module.exports = {
  generateCustomerOrderEmail,
  generateAdminOrderEmail,
  generateCustomerCancellationEmail,
  generateAdminCancellationEmail,
  generateVerificationEmail,
  generateAdminReturnRequestEmail
};
