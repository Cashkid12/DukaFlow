import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Menu, X, Store, Smartphone, ShoppingCart, Sparkles, Wrench, Pill, TrendingUp, Package, Users, Check, Play, ArrowRight } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-sm border-b border-neutral-200' 
          : 'bg-transparent'
      }`}
      style={{ height: isScrolled ? '72px' : '80px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold text-primary-deep">
              Duka<span className="text-accent">Flow</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-base font-medium text-neutral-600 hover:text-primary transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#pricing" className="text-base font-medium text-neutral-600 hover:text-primary transition-colors relative group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#about" className="text-base font-medium text-neutral-600 hover:text-primary transition-colors relative group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="py-2 px-5">Dashboard</Button>
                </Link>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" className="py-2 px-5">Sign In</Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="primary" className="py-2 px-5">Start Free Trial</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/signup">
              <Button variant="primary" className="py-1.5 px-4 text-sm">Start</Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-primary transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-xl" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="p-6">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mt-12 space-y-2">
                <a
                  href="#features"
                  className="block py-4 px-6 text-lg font-medium text-neutral-700 hover:bg-primary-soft hover:text-primary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="block py-4 px-6 text-lg font-medium text-neutral-700 hover:bg-primary-soft hover:text-primary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#about"
                  className="block py-4 px-6 text-lg font-medium text-neutral-700 hover:bg-primary-soft hover:text-primary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </a>

                <div className="pt-4 mt-4 border-t border-neutral-200">
                  <Link
                    to="/signin"
                    className="block py-4 px-6 text-lg font-medium text-neutral-700 hover:bg-primary-soft hover:text-primary rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block py-4 px-6 text-lg font-medium text-primary hover:bg-primary-soft rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export const Footer = () => {
  return (
    <footer
      className="bg-neutral-900 text-neutral-400"
      style={{ padding: '40px 20px 24px', width: '100%' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          style={{
            gap: '32px',
            marginBottom: '32px',
          }}
        >
          {/* Column 1 - Brand (full width on tablet, spans wider on desktop) */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>
              Duka<span style={{ color: '#E8835C' }}>Flow</span>
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#9CA3AF',
              marginTop: '8px',
              marginBottom: '16px'
            }}>
              Run your duka smarter.
            </p>
            {/* Social Icons */}
            <div className="flex" style={{ gap: '16px', marginTop: '16px' }}>
              <a href="#" aria-label="Twitter" className="group"
                style={{ color: '#9CA3AF', transition: 'color 0.2s ease' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="group"
                style={{ color: '#9CA3AF', transition: 'color 0.2s ease' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="group"
                style={{ color: '#9CA3AF', transition: 'color 0.2s ease' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2+3: Product + Resources (stack on mobile, side-by-side on tablet, separate on desktop) */}
          <div className="flex flex-col sm:flex-row lg:contents" style={{ gap: '32px' }}>
            {/* Product */}
            <div className="flex-1">
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '12px',
                marginTop: '32px',
              }}
                className="sm:mt-0">
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Features', 'Pricing', 'About', 'Careers'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '10px' }}>
                    <a href="#" style={{
                      fontSize: '14px',
                      color: '#9CA3AF',
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'color 0.2s ease',
                    }}
                      onMouseEnter={e => e.target.style.color = '#FFFFFF'}
                      onMouseLeave={e => e.target.style.color = '#9CA3AF'}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="flex-1">
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '12px',
                marginTop: '24px',
              }}
                className="sm:mt-0">
                Resources
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Help Center', 'Blog', 'API Docs', 'System Status'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '10px' }}>
                    <a href="#" style={{
                      fontSize: '14px',
                      color: '#9CA3AF',
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'color 0.2s ease',
                    }}
                      onMouseEnter={e => e.target.style.color = '#FFFFFF'}
                      onMouseLeave={e => e.target.style.color = '#9CA3AF'}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '12px',
              marginTop: '24px',
            }}
              className="lg:mt-0">
              Contact
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <a href="mailto:hello@dukaflow.com"
                  style={{
                    fontSize: '14px',
                    color: '#9CA3AF',
                    textDecoration: 'none',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={e => e.target.style.color = '#9CA3AF'}>
                  hello@dukaflow.com
                </a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="tel:+254700123456"
                  style={{
                    fontSize: '14px',
                    color: '#9CA3AF',
                    textDecoration: 'none',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={e => e.target.style.color = '#9CA3AF'}>
                  +254 700 123 456
                </a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '14px',
                  color: '#9CA3AF',
                  display: 'block',
                  whiteSpace: 'nowrap',
                }}>
                  Nairobi, Kenya
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#374151',
          margin: '32px 0 20px',
        }} />

        {/* Bottom Bar */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '12px',
            color: '#6B7280',
            marginBottom: '12px',
          }}>
            © 2026 DukaFlow. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
          }}>
            <a href="#" style={{
              fontSize: '12px',
              color: '#6B7280',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={e => e.target.style.color = '#FFFFFF'}
              onMouseLeave={e => e.target.style.color = '#6B7280'}>
              Privacy Policy
            </a>
            <a href="#" style={{
              fontSize: '12px',
              color: '#6B7280',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={e => e.target.style.color = '#FFFFFF'}
              onMouseLeave={e => e.target.style.color = '#6B7280'}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
