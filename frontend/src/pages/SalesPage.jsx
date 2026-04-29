import React, { useState } from 'react';
import { StatCard } from '../components/Cards';
import { Button } from '../components/Button';
import { SearchInput } from '../components/Form';
import { Badge } from '../components/Badge';
import { ShoppingCart, TrendingUp, DollarSign, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const salesData = [
  { time: '9AM', sales: 3 },
  { time: '10AM', sales: 5 },
  { time: '11AM', sales: 8 },
  { time: '12PM', sales: 12 },
  { time: '1PM', sales: 7 },
  { time: '2PM', sales: 9 },
  { time: '3PM', sales: 11 },
  { time: '4PM', sales: 6 },
];

const recentSales = [
  { id: 'SAL001', product: 'Men\'s T-Shirt', quantity: 2, total: 1600, payment: 'M-Pesa', time: '2 mins ago', worker: 'John' },
  { id: 'SAL002', product: 'Bluetooth Speaker', quantity: 1, total: 3000, payment: 'Cash', time: '15 mins ago', worker: 'Sarah' },
  { id: 'SAL003', product: 'Phone Case', quantity: 3, total: 1500, payment: 'M-Pesa', time: '32 mins ago', worker: 'John' },
  { id: 'SAL004', product: 'Ladies Dress', quantity: 1, total: 1500, payment: 'Card', time: '1 hour ago', worker: 'Mike' },
  { id: 'SAL005', product: 'Sneakers', quantity: 1, total: 4500, payment: 'M-Pesa', time: '2 hours ago', worker: 'Sarah' },
];

const SalesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = recentSales.filter(sale =>
    sale.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="h2 text-neutral-900 mb-2">Sales</h1>
          <p className="text-neutral-600">Track and manage all your sales transactions.</p>
        </div>
        <Button variant="primary" icon={Plus}>New Sale</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Today's Sales"
          value="KSh 45,200"
          icon={ShoppingCart}
          trend="up"
          trendValue="+12% from yesterday"
          accentColor="accent"
        />
        <StatCard
          title="Transactions"
          value="47"
          icon={TrendingUp}
          trend="up"
          trendValue="+8 from yesterday"
          accentColor="primary"
        />
        <StatCard
          title="Average Sale"
          value="KSh 962"
          icon={DollarSign}
          accentColor="success"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Sales by Hour</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="time" stroke="#64748B" />
            <YAxis stroke="#64748B" />
            <Tooltip />
            <Bar dataKey="sales" fill="#312E81" name="Sales Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Transactions</h3>
          <SearchInput
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Sale ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Qty</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Payment</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Worker</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 text-sm font-medium text-primary number-font">{sale.id}</td>
                  <td className="py-3 px-4 text-sm text-neutral-900">{sale.product}</td>
                  <td className="py-3 px-4 text-sm text-neutral-700 number-font">{sale.quantity}</td>
                  <td className="py-3 px-4 text-sm text-accent font-semibold number-font">KSh {sale.total}</td>
                  <td className="py-3 px-4">
                    {sale.payment === 'M-Pesa' ? (
                      <Badge variant="mpesa">M-Pesa</Badge>
                    ) : sale.payment === 'Cash' ? (
                      <Badge variant="success">Cash</Badge>
                    ) : (
                      <Badge variant="info">Card</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700">{sale.worker}</td>
                  <td className="py-3 px-4 text-sm text-neutral-500">{sale.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
