import jsPDF from 'jspdf';

// Alternative HTML-based PDF generation (fallback)
const generateHTMLReceipt = (order) => {
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.orderNumber || 'ORDER'}</title>
      <style>
        @page { margin: 0.5in; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .receipt { max-width: 8in; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .section { margin-bottom: 15px; }
        .section h3 { margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
        .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>AGRICULTURAL SUPPLIES RECEIPT</h1>
          <p>AgriBusiness Manager</p>
          <p>Agricultural Supplies & Equipment</p>
        </div>
        
        <div class="section">
          <h3>RECEIPT DETAILS</h3>
          <div class="item"><span>Receipt #:</span><span>${order.invoiceNumber || order.orderNumber || 'N/A'}</span></div>
          <div class="item"><span>Date:</span><span>${new Date(order.createdAt || new Date()).toLocaleDateString('en-IN')}</span></div>
          <div class="item"><span>Order #:</span><span>${order.orderNumber || 'N/A'}</span></div>
          <div class="item"><span>Status:</span><span>${order.orderStatus || 'Pending'}</span></div>
        </div>
        
        <div class="section">
          <h3>CUSTOMER</h3>
          <div class="item"><span>Name:</span><span>${order.customer?.name || 'N/A'}</span></div>
          <div class="item"><span>Phone:</span><span>${order.customer?.phone || 'N/A'}</span></div>
          ${order.customer?.email ? `<div class="item"><span>Email:</span><span>${order.customer.email}</span></div>` : ''}
        </div>
        
        <div class="section">
          <h3>ITEMS</h3>
          ${order.items && order.items.length > 0 ? order.items.map(item => `
            <div class="item">
              <span>${item.product?.name || 'Unknown Product'} (Qty: ${item.quantity || 0})</span>
              <span>₹${(item.totalPrice || 0).toLocaleString()}</span>
            </div>
          `).join('') : '<div class="item"><span>No items found</span></div>'}
        </div>
        
        <div class="section">
          <h3>PAYMENT SUMMARY</h3>
          <div class="item"><span>Subtotal:</span><span>₹${(order.subtotal || 0).toLocaleString()}</span></div>
          ${(order.taxAmount || 0) > 0 ? `<div class="item"><span>Tax:</span><span>₹${(order.taxAmount || 0).toLocaleString()}</span></div>` : ''}
          ${(order.discountAmount || 0) > 0 ? `<div class="item"><span>Discount:</span><span>-₹${(order.discountAmount || 0).toLocaleString()}</span></div>` : ''}
          <div class="item total"><span>TOTAL:</span><span>₹${(order.totalAmount || 0).toLocaleString()}</span></div>
        </div>
        
        <div class="section">
          <div class="item"><span>Payment Method:</span><span>${order.paymentMethod || 'Cash'}</span></div>
          <div class="item"><span>Payment Status:</span><span>${order.paymentStatus || 'Pending'}</span></div>
          ${order.notes ? `<div class="item"><span>Notes:</span><span>${order.notes}</span></div>` : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return receiptHTML;
};

// Create a receipt folder in the user's downloads
const createReceiptFolder = () => {
  // This will create a folder in the user's default download directory
  return 'AgriBusiness_Receipts';
};

// Generate a unique filename for the receipt
const generateReceiptFilename = (orderNumber) => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `Receipt_${orderNumber}_${dateStr}_${timeStr}.pdf`;
};

// Print receipt to PDF and save to downloads folder
export const printReceiptToPDF = (order) => {
  try {
    console.log('Generating PDF for order:', order);
    console.log('jsPDF available:', typeof jsPDF);
    
    if (!order) {
      throw new Error('Order data is required');
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRICULTURAL SUPPLIES RECEIPT', pageWidth / 2, 20, { align: 'center' });
    
    // Business Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('AgriBusiness Manager', pageWidth / 2, 30, { align: 'center' });
    doc.text('Agricultural Supplies & Equipment', pageWidth / 2, 35, { align: 'center' });
    doc.text('India', pageWidth / 2, 40, { align: 'center' });
    
    // Receipt Details
    doc.setFontSize(10);
    doc.text(`Receipt #: ${order.invoiceNumber || order.orderNumber || 'N/A'}`, 20, 55);
    doc.text(`Date: ${new Date(order.createdAt || new Date()).toLocaleDateString('en-IN')}`, 20, 60);
    doc.text(`Order #: ${order.orderNumber || 'N/A'}`, 20, 65);
    doc.text(`Status: ${order.orderStatus || 'Pending'}`, 20, 70);
    
    // Customer Info
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS:', 20, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.customer?.name || 'N/A'}`, 20, 95);
    doc.text(`Phone: ${order.customer?.phone || 'N/A'}`, 20, 100);
    if (order.customer?.email) {
      doc.text(`Email: ${order.customer.email}`, 20, 105);
    }
    
    // Items Table Header
    doc.setFont('helvetica', 'bold');
    doc.text('ITEMS PURCHASED:', 20, 120);
    
    // Table headers
    const tableY = 130;
    doc.setFontSize(9);
    doc.text('Product', 20, tableY);
    doc.text('Qty', 100, tableY);
    doc.text('Unit Price', 120, tableY);
    doc.text('Total', 160, tableY);
    
    // Draw line under headers
    doc.line(20, tableY + 2, pageWidth - 20, tableY + 2);
    
    // Items
    let currentY = tableY + 8;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(item.product?.name || 'Unknown Product', 20, currentY);
        doc.text((item.quantity || 0).toString(), 100, currentY);
        doc.text(`₹${(item.unitPrice || 0).toLocaleString()}`, 120, currentY);
        doc.text(`₹${(item.totalPrice || 0).toLocaleString()}`, 160, currentY);
        
        currentY += 6;
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text('No items found', 20, currentY);
      currentY += 6;
    }
    
    // Summary
    const summaryY = Math.max(currentY + 10, pageHeight - 80);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY:', 20, summaryY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ₹${(order.subtotal || 0).toLocaleString()}`, 20, summaryY + 10);
    if (order.taxAmount > 0) {
      doc.text(`Tax: ₹${(order.taxAmount || 0).toLocaleString()}`, 20, summaryY + 15);
    }
    if (order.discountAmount > 0) {
      doc.text(`Discount: -₹${(order.discountAmount || 0).toLocaleString()}`, 20, summaryY + 20);
    }
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ₹${(order.totalAmount || 0).toLocaleString()}`, 20, summaryY + 30);
    
    // Payment Info
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${order.paymentMethod || 'Cash'}`, 20, summaryY + 40);
    doc.text(`Payment Status: ${order.paymentStatus || 'Pending'}`, 20, summaryY + 45);
    
    if (order.notes) {
      doc.text(`Notes: ${order.notes}`, 20, summaryY + 55);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text('For queries, contact us at your registered phone number', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Save the PDF
    const filename = generateReceiptFilename(order.orderNumber || 'ORDER');
    
    try {
      doc.save(filename);
      console.log('PDF generated successfully:', filename);
      return filename;
    } catch (saveError) {
      console.error('Error saving PDF:', saveError);
      // Try alternative save method
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('PDF saved using alternative method:', filename);
      return filename;
    }
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    console.log('Falling back to HTML-based PDF generation...');
    
    // Fallback to HTML-based PDF generation
    try {
      const receiptHTML = generateHTMLReceipt(order);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      setTimeout(() => {
        printWindow.print();
        // Don't close immediately, let user decide
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
      
      const filename = generateReceiptFilename(order.orderNumber || 'ORDER');
      console.log('HTML-based PDF generation completed:', filename);
      return filename;
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw new Error('Failed to generate PDF: ' + error.message + ' | Fallback error: ' + fallbackError.message);
    }
  }
};

// Print receipt using browser's print dialog
export const printReceipt = (order) => {
  try {
    console.log('Printing receipt for order:', order);
    
    const printWindow = window.open('', '_blank');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.orderNumber || 'ORDER'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 1px solid #ccc;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .section {
            margin-bottom: 15px;
          }
          .section h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            width: 30px;
            text-align: center;
          }
          .item-price {
            width: 60px;
            text-align: right;
          }
          .total {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>AGRICULTURAL SUPPLIES</h1>
            <p>AgriBusiness Manager</p>
            <p>Agricultural Supplies & Equipment</p>
            <p>India</p>
          </div>
          
          <div class="section">
            <h3>RECEIPT DETAILS</h3>
            <div class="item">
              <span>Receipt #:</span>
              <span>${order.invoiceNumber || order.orderNumber || 'N/A'}</span>
            </div>
            <div class="item">
              <span>Date:</span>
              <span>${new Date(order.createdAt || new Date()).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="item">
              <span>Order #:</span>
              <span>${order.orderNumber || 'N/A'}</span>
            </div>
            <div class="item">
              <span>Status:</span>
              <span>${order.orderStatus || 'Pending'}</span>
            </div>
          </div>
          
          <div class="section">
            <h3>CUSTOMER</h3>
            <div class="item">
              <span>Name:</span>
              <span>${order.customer?.name || 'N/A'}</span>
            </div>
            <div class="item">
              <span>Phone:</span>
              <span>${order.customer?.phone || 'N/A'}</span>
            </div>
            ${order.customer?.email ? `
            <div class="item">
              <span>Email:</span>
              <span>${order.customer.email}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="section">
            <h3>ITEMS</h3>
            ${order.items && order.items.length > 0 ? order.items.map(item => `
              <div class="item">
                <span class="item-name">${item.product?.name || 'Unknown Product'}</span>
                <span class="item-qty">${item.quantity || 0}</span>
                <span class="item-price">₹${(item.totalPrice || 0).toLocaleString()}</span>
              </div>
            `).join('') : '<div class="item"><span>No items found</span></div>'}
          </div>
          
          <div class="section">
            <h3>PAYMENT SUMMARY</h3>
            <div class="item">
              <span>Subtotal:</span>
              <span>₹${(order.subtotal || 0).toLocaleString()}</span>
            </div>
            ${(order.taxAmount || 0) > 0 ? `
            <div class="item">
              <span>Tax:</span>
              <span>₹${(order.taxAmount || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            ${(order.discountAmount || 0) > 0 ? `
            <div class="item">
              <span>Discount:</span>
              <span>-₹${(order.discountAmount || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="item total">
              <span>TOTAL:</span>
              <span>₹${(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="item">
              <span>Payment Method:</span>
              <span>${order.paymentMethod || 'Cash'}</span>
            </div>
            <div class="item">
              <span>Payment Status:</span>
              <span>${order.paymentStatus || 'Pending'}</span>
            </div>
            ${order.notes ? `
            <div class="item">
              <span>Notes:</span>
              <span>${order.notes}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>For queries, contact us at your registered phone number</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  } catch (error) {
    console.error('Error printing receipt:', error);
    alert('Failed to print receipt: ' + error.message);
  }
};
