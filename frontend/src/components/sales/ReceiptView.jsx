import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PAYMENT_LABELS = { cash: 'Cash', mpesa: 'M-Pesa', card: 'Credit' };
const PAYMENT_ICONS = { cash: '💵', mpesa: '📱', card: '📋' };

/**
 * Generates a WhatsApp text summary of the receipt.
 */
export const generateWhatsAppMessage = (sale, shop) => {
  const lines = [
    `*${shop?.name || 'Shop'} - Receipt*`,
    `${sale.saleNumber}`,
    `Date: ${formatDateTime(sale.createdAt)}`,
    '',
  ];
  (sale.items || []).forEach((item) => {
    lines.push(`${item.name} x${item.quantity} - ${formatCurrency(item.total || item.price * item.quantity)}`);
  });
  if (sale.discount > 0) lines.push(`Discount: -${formatCurrency(sale.discount)}`);
  lines.push('-----------------------------');
  lines.push(`Total: ${formatCurrency(sale.total)}`);
  lines.push(`Payment: ${PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}`);
  if (sale.customerName) lines.push(`Customer: ${sale.customerName}`);
  lines.push('');
  lines.push('Thank you! Powered by DukaFlow');
  return lines.join('\n');
};

/**
 * Printable receipt component.
 * Renders a clean receipt layout for printing or preview.
 */
const ReceiptView = ({ sale, shop, workerName }) => {
  if (!sale) return null;

  const items = sale.items || [];
  const paymentLabel = PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod;
  const paymentIcon = PAYMENT_ICONS[sale.paymentMethod] || '';

  return (
    <div className="bg-white max-w-[400px] mx-auto p-6 font-sans text-[#1E293B] print:p-4 print:max-w-full" id="receipt-content">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[#312E81]">{shop?.name || 'DukaFlow'}</h2>
        {shop?.contact?.address && (
          <p className="text-xs text-[#64748B] mt-0.5">{shop.contact.address}{shop.contact.city ? `, ${shop.contact.city}` : ''}</p>
        )}
        {shop?.contact?.phone && (
          <p className="text-xs text-[#64748B]">{shop.contact.phone}</p>
        )}
      </div>

      <div className="border-t border-b border-dashed border-neutral-300 py-2 mb-4 text-center">
        <p className="text-sm font-mono font-bold text-[#1E293B]">{sale.saleNumber}</p>
        <p className="text-xs text-[#64748B]">{formatDateTime(sale.createdAt)}</p>
      </div>

      {/* Items Table */}
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-neutral-200 text-xs text-[#64748B]">
            <th className="text-left pb-1 font-medium">Item</th>
            <th className="text-center pb-1 font-medium w-10">Qty</th>
            <th className="text-right pb-1 font-medium">Price</th>
            <th className="text-right pb-1 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-neutral-100">
              <td className="py-1.5 text-[13px]">{item.name}</td>
              <td className="py-1.5 text-center text-[13px]">{item.quantity}</td>
              <td className="py-1.5 text-right text-[13px]">{formatCurrency(item.price)}</td>
              <td className="py-1.5 text-right text-[13px] font-medium">{formatCurrency(item.total || item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-neutral-200 pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-[#64748B]">Subtotal</span>
          <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-[#64748B]">Discount</span>
            <span className="text-[#E8835C]">−{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-1 border-t border-neutral-200">
          <span>Total</span>
          <span className="text-[#E8835C]">{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t border-neutral-200 mt-3 pt-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-[#64748B]">Payment</span>
          <span className="font-medium">{paymentIcon} {paymentLabel}</span>
        </div>
        {sale.paymentMethod === 'mpesa' && sale.paymentDetails?.mpesaCode && (
          <div className="flex justify-between">
            <span className="text-[#64748B]">M-Pesa Code</span>
            <span className="font-mono text-[13px]">{sale.paymentDetails.mpesaCode}</span>
          </div>
        )}
        {sale.customerName && (
          <div className="flex justify-between">
            <span className="text-[#64748B]">Customer</span>
            <span className="font-medium">{sale.customerName}</span>
          </div>
        )}
        {sale.dueDate && (
          <div className="flex justify-between">
            <span className="text-[#64748B]">Due Date</span>
            <span className="font-medium">{formatDateTime(sale.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Worker Info */}
      {workerName && (
        <div className="border-t border-neutral-200 mt-3 pt-3 text-sm text-center text-[#64748B]">
          Served by: <span className="font-medium text-[#1E293B]">{workerName}</span>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-neutral-200 mt-3 pt-3 text-center">
        <p className="text-xs text-[#64748B]">Thank you for shopping with us!</p>
        <p className="text-[11px] text-neutral-400 mt-1">Powered by DukaFlow</p>
      </div>
    </div>
  );
};

/**
 * Opens the receipt in a new window and triggers browser print.
 */
export const printReceipt = (sale, shop, workerName) => {
  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) return;

  const receiptHTML = document.getElementById('receipt-content')?.outerHTML;
  if (!receiptHTML) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${sale.saleNumber}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          @page { margin: 8mm; size: 80mm auto; }
        }
      </style>
    </head>
    <body class="bg-white">
      ${receiptHTML}
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => window.print(), 300);
        });
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

export default ReceiptView;
