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
      className="bg-neutral-900"
      style={{
        padding: 'clamp(48px, 6vw, 64px) clamp(20px, 5vw, 64px) clamp(24px, 3vw, 32px)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Main Footer Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-4"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'clamp(32px, 4vw, 40px)',
            marginBottom: '48px'
          }}
        >
          {/* Column 1 - Brand */}
          <div className="md:col-span-1">
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'white',
              marginBottom: '16px'
            }}>
              Duka<span style={{ color: '#E8835C' }}>Flow</span>
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#9CA3AF',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Run your duka smarter.
            </p>
            {/* Social Icons */}
            <div className="flex md:justify-start justify-center" style={{ gap: '16px' }}>
              <a 
                href="#" 
                className="group"
                aria-label="Twitter"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    color: '#9CA3AF', 
                    transition: 'all 0.2s ease' 
                  }}
                  className="group-hover:text-white"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="group"
                aria-label="Facebook"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    color: '#9CA3AF', 
                    transition: 'all 0.2s ease' 
                  }}
                  className="group-hover:text-white"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="group"
                aria-label="Instagram"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    color: '#9CA3AF', 
                    transition: 'all 0.2s ease' 
                  }}
                  className="group-hover:text-white"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="group"
                aria-label="LinkedIn"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    color: '#9CA3AF', 
                    transition: 'all 0.2s ease' 
                  }}
                  className="group-hover:text-white"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2 - Product */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'white',
              marginBottom: '20px'
            }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Features', 'Pricing', 'About', 'Careers'].map((item, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <a 
                    href="#" 
                    className="group"
                    style={{
                      fontSize: '14px',
                      color: '#9CA3AF',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      display: 'inline-block'
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Resources */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'white',
              marginBottom: '20px'
            }}>
              Resources
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Help Center', 'Blog', 'API Docs', 'System Status'].map((item, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <a 
                    href="#" 
                    className="group"
                    style={{
                      fontSize: '14px',
                      color: '#9CA3AF',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      display: 'inline-block'
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'white',
              marginBottom: '20px'
            }}>
              Contact
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <a 
                  href="mailto:hello@dukaflow.com" 
                  style={{
                    fontSize: '14px',
                    color: '#9CA3AF',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  hello@dukaflow.com
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <a 
                  href="tel:+254700123456" 
                  style={{
                    fontSize: '14px',
                    color: '#9CA3AF',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  +254 700 123 456
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>
                  Nairobi, Kenya
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: '#374151',
          maxWidth: '1200px',
          margin: '0 auto 24px'
        }} />

        {/* Bottom Bar */}
        <div 
          className="flex flex-col md:flex-row"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#6B7280'
          }}
        >
          <p style={{ marginBottom: '16px' }}>
            © 2026 DukaFlow. All rights reserved.
          </p>
          <div className="flex" style={{ gap: '32px' }}>
            <a 
              href="#" 
              style={{
                color: '#6B7280',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              style={{
                color: '#6B7280',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
