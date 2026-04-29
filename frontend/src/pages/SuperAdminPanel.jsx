import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SearchInput } from '../components/Form';
import { Users, Store, DollarSign, TrendingUp, Mail, Eye, Edit } from 'lucide-react';

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const metrics = [
    { label: 'Total Shops', value: '547', icon: Store, trend: '+12 this week', color: 'accent' },
    { label: 'Trial Shops', value: '89', icon: Users, trend: '16% of total', color: 'warning' },
    { label: 'Paying Shops', value: '458', icon: DollarSign, trend: '84% conversion', color: 'success' },
    { label: 'MRR', value: 'KSh 687,000', icon: TrendingUp, trend: '↑15% vs last month', color: 'primary' },
  ];

  const recentSignups = [
    { id: 1, shop: 'Fashion Hub', owner: 'Jane Wanjiku', email: 'jane@example.com', plan: 'Starta', date: '2 hours ago' },
    { id: 2, shop: 'Tech World', owner: 'Mohammed Hassan', email: 'mohammed@example.com', plan: 'Kuuza', date: '5 hours ago' },
    { id: 3, shop: 'Green Grocers', owner: 'Grace Akinyi', email: 'grace@example.com', plan: 'Starta', date: '1 day ago' },
    { id: 4, shop: 'Beauty Palace', owner: 'Faith Njeri', email: 'faith@example.com', plan: 'Biashara', date: '1 day ago' },
  ];

  const trialEnding = [
    { id: 1, shop: 'Quick Mart', owner: 'Peter Kamau', email: 'peter@example.com', endsIn: '2 days', plan: 'Starta' },
    { id: 2, shop: 'Electronics Plus', owner: 'Amina Osman', email: 'amina@example.com', endsIn: '3 days', plan: 'Kuuza' },
    { id: 3, shop: 'Style Boutique', owner: 'Lucy Muthoni', email: 'lucy@example.com', endsIn: '5 days', plan: 'Starta' },
  ];

  const allShops = [
    { id: 1, name: 'Cecilia Fashions', owner: 'Cecilia Wambui', plan: 'Starta', status: 'active', created: 'Jan 15, 2026' },
    { id: 2, name: 'Nairobi Electronics', owner: 'John Mwangi', plan: 'Kuuza', status: 'active', created: 'Feb 3, 2026' },
    { id: 3, name: 'Mombasa Traders', owner: 'Fatima Ali', plan: 'Biashara', status: 'active', created: 'Feb 20, 2026' },
    { id: 4, name: 'Kisumu Market', owner: 'David Ochieng', plan: 'Starta', status: 'trial', created: 'Mar 10, 2026' },
    { id: 5, name: 'Eldoret Shops', owner: 'Sarah Chebet', plan: 'Kuuza', status: 'suspended', created: 'Mar 25, 2026' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-deep">DukaFlow</h1>
            <span className="px-3 py-1 bg-primary-subtle text-primary rounded-full text-sm font-medium">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-neutral-600 hover:text-primary">
              View Public Site
            </a>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 w-fit">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'shops', label: 'Shops Management' },
            { id: 'announcements', label: 'Announcements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <Icon size={24} className="text-neutral-700" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-neutral-900 number-font mb-1">{metric.value}</p>
                    <p className="text-sm text-neutral-600">{metric.label}</p>
                    <p className="text-xs text-neutral-500 mt-2">{metric.trend}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Signups */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Signups</h3>
                <div className="space-y-3">
                  {recentSignups.map((signup) => (
                    <div key={signup.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{signup.shop}</p>
                        <p className="text-xs text-neutral-500">{signup.owner} • {signup.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="primary">{signup.plan}</Badge>
                        <p className="text-xs text-neutral-500 mt-1">{signup.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trials Ending Soon */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Trials Ending Soon</h3>
                <div className="space-y-3">
                  {trialEnding.map((trial) => (
                    <div key={trial.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{trial.shop}</p>
                        <p className="text-xs text-neutral-500">{trial.owner}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="warning">{trial.endsIn}</Badge>
                        <p className="text-xs text-neutral-500 mt-1">{trial.plan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shops Management Tab */}
        {activeTab === 'shops' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">All Shops</h3>
                <Button variant="secondary" size="sm" icon={Mail}>Send Bulk Email</Button>
              </div>
              <SearchInput placeholder="Search shops..." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Shop Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Owner</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allShops.map((shop) => (
                    <tr key={shop.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900">{shop.name}</td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{shop.owner}</td>
                      <td className="py-3 px-4">
                        <Badge variant="primary">{shop.plan}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            shop.status === 'active'
                              ? 'success'
                              : shop.status === 'trial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {shop.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">{shop.created}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-primary-soft rounded" title="Login as Owner">
                            <Eye size={16} className="text-primary" />
                          </button>
                          <button className="p-1.5 hover:bg-primary-soft rounded" title="Manage Subscription">
                            <Edit size={16} className="text-primary" />
                          </button>
                          <button className="p-1.5 hover:bg-primary-soft rounded" title="Send Email">
                            <Mail size={16} className="text-primary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">Send Global Announcement</h3>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Recipients
                </label>
                <select className="w-full h-11 px-4 bg-white border border-neutral-300 rounded-md text-base text-neutral-700 focus:outline-none focus:border-primary">
                  <option>All Shop Owners</option>
                  <option>Trial Users Only</option>
                  <option>Paying Customers</option>
                  <option>Specific Plan (Starta)</option>
                  <option>Specific Plan (Kuuza)</option>
                  <option>Specific Plan (Biashara)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Announcement subject"
                  className="w-full h-11 px-4 bg-white border border-neutral-300 rounded-md text-base placeholder:text-neutral-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Message
                </label>
                <textarea
                  placeholder="Write your announcement..."
                  rows={8}
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-md text-base placeholder:text-neutral-400 focus:outline-none focus:border-primary resize-vertical"
                ></textarea>
              </div>

              <div className="flex gap-3">
                <Button variant="primary">Send Announcement</Button>
                <Button variant="secondary">Save as Draft</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;
