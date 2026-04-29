import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/Navigation';
import { Button } from '../components/Button';
import { 
  Package, TrendingUp, Users, Shield, BarChart3, ShoppingCart, 
  Store, Smartphone, Zap, CheckCircle, Star, Play, Check, ArrowRight,
  AlertTriangle, Lock, Shirt, Wrench, Pill, Footprints, Coffee,
  Droplet, Croissant, BookOpen, Gamepad2, Sparkles, DollarSign, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shop icons for trust bar
  const shopIcons = [
    { icon: Shirt, business: 'Clothing Boutique' },
    { icon: Smartphone, business: 'Electronics Shop' },
    { icon: ShoppingCart, business: 'Grocery / Duka' },
    { icon: Sparkles, business: 'Cosmetics Shop' },
    { icon: Wrench, business: 'Hardware Store' },
    { icon: Pill, business: 'Pharmacy' },
    { icon: Footprints, business: 'Shoe Shop' },
    { icon: Store, business: 'General Retail' },
    { icon: Package, business: 'Wholesale Supplier' },
    { icon: Coffee, business: 'Café / Restaurant' },
    { icon: Shirt, business: 'Formal Wear' },
    { icon: Droplet, business: 'Beauty / Skincare' },
    { icon: Croissant, business: 'Bakery' },
    { icon: BookOpen, business: 'Bookshop' },
    { icon: Gamepad2, business: 'Gaming / Entertainment' },
  ];

  // Intersection Observer for scroll animations
  const [isVisible, setIsVisible] = useState(false);
  const trustBarRef = React.useRef(null);

  // Business Types section observer
  const [businessTypesVisible, setBusinessTypesVisible] = useState(false);
  const businessTypesRef = React.useRef(null);

  // Core Features section observer
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = React.useRef(null);

  // How It Works section observer
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = React.useRef(null);

  // Dashboard Preview section observer
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const dashboardRef = React.useRef(null);

  // Billing toggle state
  const [isAnnual, setIsAnnual] = useState(false);

  // Testimonials carousel state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Pricing Card Component
  const PricingCard = ({ plan, price, monthlyEquivalent, isAnnual, maxWidth, isMobile }) => (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: isMobile ? '28px 20px' : 'clamp(24px, 3vw, 32px) clamp(20px, 3vw, 24px)',
        boxShadow: plan.popular ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: plan.popular ? '2px solid #E8835C' : '1px solid #E2E8F0',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        transform: plan.popular && !isMobile ? 'scale(1.02)' : 'scale(1)',
        cursor: 'pointer',
        maxWidth: maxWidth || '100%',
        margin: isMobile ? '0 0 20px 0' : '0 auto',
        width: '100%',
        animation: plan.popular && isMobile ? 'pulse-shadow 3s infinite' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = plan.popular ? 'scale(1.02) translateY(-6px)' : 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = plan.popular ? '#E8835C' : '#E0E7FF';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = plan.popular ? 'scale(1.02)' : 'scale(1)';
        e.currentTarget.style.boxShadow = plan.popular ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = plan.popular ? '#E8835C' : '#E2E8F0';
      }}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <span style={{
            backgroundColor: '#E8835C',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            padding: '6px 18px',
            borderRadius: '40px',
            letterSpacing: '0.5px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            whiteSpace: 'nowrap'
          }}>
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 style={{
        fontSize: 'clamp(20px, 3vw, 22px)',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '8px'
      }}>
        {plan.name}
      </h3>

      {/* Price */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: '4px',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: isMobile ? '20px' : 'clamp(18px, 3vw, 20px)',
          fontWeight: 500,
          color: '#64748B'
        }}>
          KSh
        </span>
        <span style={{
          fontSize: isMobile ? '38px' : 'clamp(36px, 5vw, 42px)',
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.2
        }}>
          {isAnnual ? monthlyEquivalent.toLocaleString() : price.toLocaleString()}
        </span>
        <span style={{
          fontSize: isMobile ? '14px' : 'clamp(14px, 2vw, 15px)',
          fontWeight: 400,
          color: '#64748B'
        }}>
          / month
        </span>
      </div>

      {/* Annual Price Note */}
      {isAnnual && (
        <div style={{
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <p style={{
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '2px'
          }}>
            KSh {price.toLocaleString()}/yr
          </p>
          <p style={{
            fontSize: '13px',
            color: '#64748B'
          }}>
            (KSh {monthlyEquivalent.toLocaleString()}/mo) • Save KSh {(plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString()}
          </p>
        </div>
      )}

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: '#E2E8F0',
        margin: 'clamp(20px, 3vw, 24px) 0'
      }} />

      {/* Features */}
      <ul style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '12px' : 'clamp(10px, 2vw, 14px)',
        marginBottom: 'clamp(24px, 3vw, 32px)',
        flex: 1,
        listStyle: 'none',
        padding: 0,
        margin: 0
      }}>
        {plan.features.map((feature, fIndex) => (
          <li key={fIndex} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: isMobile ? '14px' : 'clamp(14px, 1.5vw, 15px)',
            color: '#334155',
            textAlign: 'left'
          }}>
            <Check size={18} style={{ color: '#10B981', flexShrink: 0 }} />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        style={{
          width: '100%',
          padding: isMobile ? '16px 20px' : '14px 20px',
          fontSize: '16px',
          fontWeight: 600,
          borderRadius: '12px',
          border: plan.popular ? 'none' : '1.5px solid #312E81',
          backgroundColor: plan.popular ? '#312E81' : 'white',
          color: plan.popular ? 'white' : '#312E81',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginTop: isMobile ? '24px' : 'auto'
        }}
        onMouseEnter={(e) => {
          if (plan.popular) {
            e.currentTarget.style.backgroundColor = '#1E1B4B';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          } else {
            e.currentTarget.style.backgroundColor = '#312E81';
            e.currentTarget.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (plan.popular) {
            e.currentTarget.style.backgroundColor = '#312E81';
            e.currentTarget.style.boxShadow = 'none';
          } else {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = '#312E81';
          }
        }}
      >
        {plan.cta}
      </button>
    </div>
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (trustBarRef.current) {
      observer.observe(trustBarRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBusinessTypesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (businessTypesRef.current) {
      observer.observe(businessTypesRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHowItWorksVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDashboardVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (dashboardRef.current) {
      observer.observe(dashboardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const businessTypes = [
    { 
      icon: Shirt, 
      title: 'Clothing Boutique', 
      description: 'Track sizes, colors, and seasonal collections. Never lose track of what\'s on your racks.'
    },
    { 
      icon: Smartphone, 
      title: 'Electronics Shop', 
      description: 'Track serial numbers, variants, and warranty periods. Know exactly which model is selling best.'
    },
    { 
      icon: ShoppingCart, 
      title: 'Grocery & Duka', 
      description: 'Track expiry dates, manage perishable stock. Get alerts before products spoil.'
    },
    { 
      icon: Sparkles, 
      title: 'Cosmetics Shop', 
      description: 'Track shades, expiry dates, and testers. Know which products are flying off the shelves.'
    },
    { 
      icon: Wrench, 
      title: 'Hardware Store', 
      description: 'Track varied SKUs, bulk pricing, and contractor purchases. Never run out of fast-moving items.'
    },
    { 
      icon: Pill, 
      title: 'Pharmacy', 
      description: 'Track batches, expiry alerts, and controlled substances. Stay compliant and stocked.'
    },
  ];

  const features = [
    { 
      icon: Package, 
      title: 'Stock Clarity', 
      description: 'Know exactly what\'s on your shelves. Get alerts before you run out. Never miss a bestseller again.' 
    },
    { 
      icon: DollarSign, 
      title: 'Profit Visibility', 
      description: 'See your actual profit—not just cash in hand. Understand where money comes from and where it goes.' 
    },
    { 
      icon: Users, 
      title: 'Worker Accountability', 
      description: 'Track who sold what. End the guessing game with staff. Know your top performers.' 
    },
    { 
      icon: BarChart3, 
      title: 'Automatic Reports', 
      description: 'Daily, weekly, and monthly summaries delivered to your inbox. Bank-ready reports at your fingertips.' 
    },
    { 
      icon: Zap, 
      title: 'Low Stock & Expiry Alerts', 
      description: 'Never miss a restock. Get warned before products expire. Save thousands in wasted stock.' 
    },
    { 
      icon: Smartphone, 
      title: 'Mobile-First Design', 
      description: 'Run your duka from anywhere. Works perfectly on your phone or tablet.' 
    },
  ];

  const steps = [
    { 
      title: 'Sign Up', 
      description: 'Create your free account in under a minute. No credit card required.' 
    },
    { 
      title: 'Add Your Products', 
      description: 'Upload your inventory in minutes. Add photos, prices, and quantities with ease.' 
    },
    { 
      title: 'Sell & Track', 
      description: 'Record sales, watch profits grow. Get insights that help you earn more.' 
    },
  ];

  const pricingPlans = [
    {
      name: 'Starta',
      monthlyPrice: 750,
      annualPrice: 7200,
      description: 'Perfect for solo entrepreneurs',
      features: [
        '1 User',
        '1 Shop Location',
        '500 Products',
        'Basic Reports',
        'Email Support',
        'Mobile App'
      ],
      popular: false,
      cta: 'Get Started',
    },
    {
      name: 'Kuuza',
      monthlyPrice: 1500,
      annualPrice: 14400,
      description: 'For growing businesses',
      features: [
        '3 Users',
        '1 Shop Location',
        '2,000 Products',
        'Advanced Reports',
        'Credit Tracking',
        'Priority Support',
        'Mobile App'
      ],
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Biashara',
      monthlyPrice: 3000,
      annualPrice: 28800,
      description: 'For multi-branch operations',
      features: [
        '5+ Users',
        'Multiple Branches',
        'Unlimited Products',
        'Advanced Reports',
        'Priority Support',
        'API Access',
        'Custom Onboarding',
        'Mobile App'
      ],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  const testimonials = [
    { 
      name: 'Cecilia Wanjiku', 
      shop: 'Cecilia Fashions, CBD', 
      quote: 'DukaFlow showed me I was losing money on Tuesdays. Now I run promotions and I\'m profitable every day.',
      rating: 5
    },
    { 
      name: 'John Mwangi', 
      shop: 'Mwangi Electronics, River Road', 
      quote: 'I used to guess my profit. Now I know exactly how much I make each day. It\'s changed how I run my business.',
      rating: 5
    },
    { 
      name: 'Fatma Ali', 
      shop: 'Ali Cosmetics, Eastleigh', 
      quote: 'My workers can\'t hide anymore. I see exactly who sold what from my phone.',
      rating: 5
    },
    { 
      name: 'Peter Odhiambo', 
      shop: 'Odhiambo Hardware, Industrial Area', 
      quote: 'The expiry alerts saved me thousands. I haven\'t thrown away expired stock in 6 months.',
      rating: 5
    },
    { 
      name: 'Grace Njeri', 
      shop: 'Njeri Groceries, Kilimani', 
      quote: 'I got a bank loan using DukaFlow reports. They took my business seriously.',
      rating: 5
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden" 
        style={{ 
          background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #FDF2EC 100%)',
          minHeight: '90vh'
        }}
        role="banner"
        aria-label="DukaFlow hero section"
      >
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#312E81 1px, transparent 1px), linear-gradient(90deg, #312E81 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ minHeight: '90vh', paddingTop: '80px' }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center" style={{ minHeight: 'calc(90vh - 80px)' }}>
            {/* Left Column */}
            <div style={{ 
              padding: '80px 0 80px 64px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {/* Headline - Line 1 */}
              <h1 
                style={{ 
                  fontSize: 'clamp(34px, 5vw, 52px)',
                  fontWeight: 700,
                  lineHeight: 'clamp(1.2, 1.1, 1.1)',
                  marginBottom: '8px',
                  color: '#111827',
                  animation: prefersReducedMotion ? 'none' : 'fadeUp 0.5s ease 0ms both'
                }}
              >
                Run Your Duka,
                <br />
                {/* Headline - Line 2 */}
                <span 
                  style={{ 
                    color: '#312E81',
                    animation: prefersReducedMotion ? 'none' : 'fadeUp 0.5s ease 100ms both'
                  }}
                >
                  Smarter.
                </span>
              </h1>
              
              {/* Subheadline */}
              <p
                style={{
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#4B5563',
                  maxWidth: '520px',
                  marginTop: 'clamp(16px, 3vw, 24px)',
                  marginBottom: 'clamp(24px, 4vw, 32px)',
                  padding: '0 clamp(0px, 2vw, 8px)',
                  textAlign: 'center',
                  animation: prefersReducedMotion ? 'none' : 'fadeUp 0.5s ease 200ms both'
                }}
              >
                Inventory, sales, and profit tracking—built for Kenyan shops. Start your 14-day free trial. No credit card required.
              </p>
              
              {/* Button Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(12px, 2vw, 16px)',
                marginTop: 'clamp(24px, 4vw, 32px)',
                width: '100%',
                animation: prefersReducedMotion ? 'none' : 'fadeUp 0.5s ease 300ms both'
              }}>
                {/* Primary CTA - Start Free Trial */}
                <Link to="/signup" className="w-full">
                  <button
                    className="group w-full"
                    style={{
                      padding: 'clamp(14px, 2vw, 16px) clamp(20px, 3vw, 28px)',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'white',
                      backgroundColor: '#312E81',
                      borderRadius: '10px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1E1B4B';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#312E81';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    aria-label="Start your 14-day free trial"
                  >
                    Start Free Trial
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                {/* Secondary CTA - Watch Demo */}
                <button
                  className="group w-full"
                  style={{
                    padding: 'clamp(14px, 2vw, 16px) clamp(20px, 3vw, 28px)',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#374151',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#312E81';
                    e.currentTarget.style.color = '#312E81';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.color = '#374151';
                  }}
                  aria-label="Watch product demo video"
                >
                  <Play size={16} className="transition-transform group-hover:translate-x-1" />
                  Watch Demo
                </button>
              </div>

              {/* Trust Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 'clamp(12px, 2vw, 20px)',
                marginTop: 'clamp(24px, 4vw, 32px)',
                animation: prefersReducedMotion ? 'none' : 'fadeUp 0.4s ease 400ms both'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'clamp(12px, 1.5vw, 13px)',
                  fontWeight: 500,
                  color: '#6B7280'
                }}>
                  <Check size={14} style={{ marginRight: '6px', color: '#43B02A' }} />
                  No credit card
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'clamp(12px, 1.5vw, 13px)',
                  fontWeight: 500,
                  color: '#6B7280'
                }}>
                  <Check size={14} style={{ marginRight: '6px', color: '#43B02A' }} />
                  14-day trial
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'clamp(12px, 1.5vw, 13px)',
                  fontWeight: 500,
                  color: '#6B7280'
                }}>
                  <Check size={14} style={{ marginRight: '6px', color: '#43B02A' }} />
                  Cancel anytime
                </div>
              </div>

              {/* Mobile Mockup - Visible only on small screens */}
              <div 
                className="lg:hidden"
                style={{
                  marginTop: '40px',
                  width: '100%',
                  animation: prefersReducedMotion ? 'none' : 'fadeInScale 0.6s ease 400ms both'
                }}
              >
                {/* Mockup Container for Mobile */}
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '100%',
                    animation: prefersReducedMotion ? 'none' : 'float 4s ease-in-out infinite',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  role="img"
                  aria-label="DukaFlow dashboard preview showing profit card, sales chart, recent transactions, and low stock alerts"
                >
                  {/* Mockup Frame */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2)',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden'
                  }}>
                    {/* Mockup Header (Browser Top Bar) */}
                    <div style={{
                      height: '32px',
                      backgroundColor: '#F3F4F6',
                      borderBottom: '1px solid #E5E7EB',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {/* Browser Dots */}
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                      </div>

                      {/* URL Bar */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '5px',
                        padding: '3px 10px',
                        marginLeft: '8px',
                        fontSize: '10px',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flex: 1
                      }}>
                        <Lock size={10} style={{ color: '#10B981' }} />
                        cecilia.dukaflow.com
                      </div>
                    </div>

                    {/* Mockup Content Area */}
                    <div style={{
                      padding: '16px 12px',
                      backgroundColor: '#F9FAFB'
                    }}>
                      {/* Profit Card */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '14px',
                        marginBottom: '12px',
                        borderLeft: '3px solid #E8835C',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Today's Profit</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#E8835C', fontFamily: 'monospace' }}>KSh 4,210</p>
                        <p style={{ fontSize: '10px', color: '#43B02A', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <TrendingUp size={10} />
                          ↑12% vs yesterday
                        </p>
                      </div>

                      {/* Mini Stats Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ fontSize: '10px', color: '#6B7280', marginBottom: '3px' }}>Sales Today</p>
                          <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>47</p>
                        </div>
                        <div style={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ fontSize: '10px', color: '#6B7280', marginBottom: '3px' }}>Items in Stock</p>
                          <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>1,234</p>
                        </div>
                      </div>

                      {/* Transaction Rows */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '10px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '10px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>Recent Sales</p>
                        {[
                          { product: 'Blue Jeans', amount: '3,200' },
                          { product: 'Nike Sneakers', amount: '4,500' },
                          { product: 'Phone Case', amount: '1,500' }
                        ].map((tx, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '5px 0',
                            borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none'
                          }}>
                            <span style={{ fontSize: '10px', color: '#374151' }}>{tx.product}</span>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#E8835C', fontFamily: 'monospace' }}>KSh {tx.amount}</span>
                          </div>
                        ))}
                      </div>

                      {/* Alert Badge */}
                      <div style={{
                        marginTop: '10px',
                        backgroundColor: '#FEF3C7',
                        borderRadius: '5px',
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: '#92400E'
                      }}>
                        <AlertTriangle size={12} />
                        3 Low Stock Items
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Mockup */}
            <div 
              className="hidden lg:flex"
              style={{ 
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 64px 40px 0',
                animation: prefersReducedMotion ? 'none' : 'fadeInScale 0.6s ease 200ms both'
              }}
            >
              {/* Glow Effect Behind Mockup */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(238, 242, 255, 0.4) 0%, transparent 70%)',
                filter: 'blur(60px)',
                zIndex: -1
              }}></div>

              {/* Mockup Container with Float Animation */}
              <div 
                style={{
                  position: 'relative',
                  maxWidth: '520px',
                  width: '100%',
                  animation: prefersReducedMotion ? 'none' : 'float 4s ease-in-out infinite',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                role="img"
                aria-label="DukaFlow dashboard preview showing profit card, sales chart, recent transactions, and low stock alerts"
              >
                {/* Mockup Frame */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden'
                }}>
                  {/* Mockup Header (Browser Top Bar) */}
                  <div style={{
                    height: '36px',
                    backgroundColor: '#F3F4F6',
                    borderBottom: '1px solid #E5E7EB',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {/* Browser Dots */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                    </div>

                    {/* URL Bar */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      marginLeft: '12px',
                      fontSize: '11px',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: 1
                    }}>
                      <Lock size={12} style={{ color: '#10B981' }} />
                      cecilia.dukaflow.com
                    </div>
                  </div>

                  {/* Mockup Content Area */}
                  <div style={{
                    padding: '20px 16px',
                    backgroundColor: '#F9FAFB',
                    transform: `translateY(${scrollY * 0.1}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}>
                    {/* Profit Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      borderLeft: '4px solid #E8835C',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Today's Profit</p>
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#E8835C', fontFamily: 'monospace' }}>KSh 4,210</p>
                      <p style={{ fontSize: '11px', color: '#43B02A', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={12} />
                        ↑12% vs yesterday
                      </p>
                    </div>

                    {/* Mini Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Sales Today</p>
                        <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>47</p>
                      </div>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Items in Stock</p>
                        <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>1,234</p>
                      </div>
                    </div>

                    {/* Transaction Rows */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Recent Sales</p>
                      {[
                        { product: 'Blue Jeans', amount: '3,200' },
                        { product: 'Nike Sneakers', amount: '4,500' },
                        { product: 'Phone Case', amount: '1,500' }
                      ].map((tx, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none'
                        }}>
                          <span style={{ fontSize: '11px', color: '#374151' }}>{tx.product}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8835C', fontFamily: 'monospace' }}>KSh {tx.amount}</span>
                        </div>
                      ))}
                    </div>

                    {/* Alert Badge */}
                    <div style={{
                      marginTop: '12px',
                      backgroundColor: '#FEF3C7',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#92400E'
                    }}>
                      <AlertTriangle size={14} />
                      3 Low Stock Items
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <section 
        ref={trustBarRef}
        className="bg-white border-y border-neutral-200"
        style={{
          padding: 'clamp(28px, 4vw, 40px) clamp(16px, 4vw, 64px)',
          textAlign: 'center'
        }}
        role="region"
        aria-label="Trusted business types"
      >
        {/* Section Label */}
        <p style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: 'clamp(20px, 3vw, 28px)'
        }}>
          Trusted by shops across Kenya
        </p>

        {/* Desktop & Tablet - Flex/Grid Layout */}
        <div className="hidden md:flex flex-wrap justify-center items-center" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          gap: 'clamp(24px, 3vw, 40px)'
        }}>
          {shopIcons.map((shop, index) => {
            const IconComponent = shop.icon;
            return (
              <div
                key={index}
                className="group"
                style={{
                  width: 'clamp(64px, 7vw, 72px)',
                  height: 'clamp(64px, 7vw, 72px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F9FAFB',
                  borderRadius: 'clamp(18px, 2vw, 20px)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  animation: prefersReducedMotion ? 'none' : `fadeUp 0.5s ease-out ${index * 50}ms both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FF';
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.style.color = '#312E81';
                    icon.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.style.color = '#6B7280';
                    icon.style.transform = 'scale(1)';
                  }
                }}
                title={shop.business}
                role="img"
                aria-label={shop.business}
              >
                <IconComponent 
                  size={36}
                  style={{ 
                    color: '#6B7280',
                    strokeWidth: '1.5px',
                    transition: 'all 0.25s ease',
                    width: 'clamp(28px, 3vw, 36px)',
                    height: 'clamp(28px, 3vw, 36px)'
                  }} 
                />
              </div>
            );
          })}
        </div>

        {/* Mobile - Horizontal Scroll */}
        <div className="md:hidden" style={{ position: 'relative' }}>
          {/* Fade Edges */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to right, white 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to left, white 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          {/* Scroll Container */}
          <div
            id="trustBarScroll"
            style={{
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollBehavior: 'smooth',
              padding: '8px 4px 16px',
              margin: '0 -16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {shopIcons.map((shop, index) => {
              const IconComponent = shop.icon;
              return (
                <div
                  key={index}
                  style={{
                    width: '60px',
                    height: '60px',
                    flexShrink: 0,
                    backgroundColor: '#F9FAFB',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    scrollSnapAlign: 'start',
                    opacity: isVisible ? 1 : 0,
                    animation: prefersReducedMotion ? 'none' : `fadeUp 0.5s ease-out ${index * 50}ms both`
                  }}
                  title={shop.business}
                  role="img"
                  aria-label={shop.business}
                >
                  <IconComponent 
                    size={28}
                    style={{ 
                      color: '#6B7280',
                      strokeWidth: '1.5px'
                    }} 
                  />
                </div>
              );
            })}
          </div>

          {/* Scroll Indicator */}
          <p style={{
            fontSize: '11px',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: '8px',
            opacity: 0.7,
            animation: prefersReducedMotion ? 'none' : 'pulse 2s infinite'
          }}>
            scroll for more →
          </p>

          {/* Pagination Dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px'
          }}>
            {[0, 1, 2, 3, 4, 5].map((dot) => (
              <div
                key={dot}
                style={{
                  width: dot === 0 ? '20px' : '6px',
                  height: '6px',
                  backgroundColor: dot === 0 ? '#312E81' : '#D1D5DB',
                  borderRadius: '9999px',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section 
        ref={businessTypesRef}
        className="bg-neutral-50"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)'
        }}
        role="region"
        aria-labelledby="business-types-title"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: 'clamp(40px, 5vw, 56px)' }}>
            <h2 
              id="business-types-title"
              style={{
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
                opacity: businessTypesVisible ? 1 : 0,
                transform: businessTypesVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out'
              }}
            >
              Built for Every Duka
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 400,
              color: '#4B5563',
              maxWidth: 'clamp(300px, 60vw, 600px)',
              margin: '0 auto',
              opacity: businessTypesVisible ? 1 : 0,
              transform: businessTypesVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out 100ms'
            }}>
              From fashion boutiques to hardware stores—DukaFlow adapts to your business.
            </p>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'clamp(16px, 2vw, 28px)' }}>
            {businessTypes.map((type, index) => {
              const IconComponent = type.icon;
              // Stagger delays for cards
              const staggerDelays = [0, 100, 200, 150, 250, 350];
              const delay = staggerDelays[index] || index * 100;
              
              return (
                <div
                  key={index}
                  className="group"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: 'clamp(24px, 3vw, 36px) clamp(20px, 2vw, 28px)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    transition: prefersReducedMotion ? 'none' : 'all 0.25s ease',
                    border: '1px solid #F3F4F6',
                    cursor: 'default',
                    opacity: businessTypesVisible ? 1 : 0,
                    transform: businessTypesVisible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: prefersReducedMotion ? '0ms' : `${delay}ms`
                  }}
                  onMouseEnter={(e) => {
                    if (businessTypesVisible) {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#E0E7FF';
                      
                      // Icon container hover
                      const iconContainer = e.currentTarget.querySelector('.icon-container');
                      if (iconContainer) {
                        iconContainer.style.backgroundColor = '#312E81';
                        iconContainer.style.transform = 'scale(1.05)';
                        const icon = iconContainer.querySelector('svg');
                        if (icon) {
                          icon.style.color = 'white';
                        }
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (businessTypesVisible) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#F3F4F6';
                      
                      // Icon container reset
                      const iconContainer = e.currentTarget.querySelector('.icon-container');
                      if (iconContainer) {
                        iconContainer.style.backgroundColor = '#EEF2FF';
                        iconContainer.style.transform = 'scale(1)';
                        const icon = iconContainer.querySelector('svg');
                        if (icon) {
                          icon.style.color = '#312E81';
                        }
                      }
                    }
                  }}
                >
                  {/* Icon Container */}
                  <div 
                    className="icon-container"
                    style={{
                      width: 'clamp(56px, 8vw, 80px)',
                      height: 'clamp(56px, 8vw, 80px)',
                      backgroundColor: '#EEF2FF',
                      borderRadius: 'clamp(16px, 2vw, 20px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto clamp(16px, 3vw, 24px)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <IconComponent 
                      size={32}
                      style={{ 
                        color: '#312E81',
                        transition: 'color 0.25s ease'
                      }} 
                    />
                  </div>

                  {/* Card Title */}
                  <h3 style={{
                    fontSize: 'clamp(18px, 2.5vw, 22px)',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 'clamp(12px, 2vw, 16px)',
                    textAlign: 'center'
                  }}>
                    {type.title}
                  </h3>

                  {/* Card Description */}
                  <p style={{
                    fontSize: 'clamp(14px, 1.5vw, 15px)',
                    fontWeight: 400,
                    color: '#4B5563',
                    lineHeight: 1.6,
                    textAlign: 'center',
                    maxWidth: '280px',
                    margin: '0 auto'
                  }}>
                    {type.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section 
        ref={featuresRef}
        id="features" 
        className="bg-white"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)'
        }}
        role="region"
        aria-labelledby="features-title"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: 'clamp(40px, 5vw, 56px)' }}>
            <h2 
              id="features-title"
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
                opacity: featuresVisible ? 1 : 0,
                transform: featuresVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out'
              }}
            >
              Everything You Need to Run Your Duka
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 400,
              color: '#4B5563',
              maxWidth: 'clamp(300px, 55vw, 550px)',
              margin: '0 auto',
              opacity: featuresVisible ? 1 : 0,
              transform: featuresVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out 100ms'
            }}>
              Replace notebooks and Excel with a system built for clarity
            </p>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'clamp(16px, 3vw, 32px)' }}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              // Stagger delays for cards
              const staggerDelays = [0, 100, 200, 150, 250, 350];
              const delay = staggerDelays[index] || index * 100;
              
              return (
                <div
                  key={index}
                  className="group"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 'clamp(16px, 2vw, 20px)',
                    padding: 'clamp(24px, 3vw, 32px) clamp(20px, 2vw, 24px)',
                    boxShadow: 'none',
                    textAlign: 'center',
                    transition: prefersReducedMotion ? 'none' : 'all 0.25s ease',
                    border: '1px solid #F3F4F6',
                    cursor: 'default',
                    opacity: featuresVisible ? 1 : 0,
                    transform: featuresVisible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: prefersReducedMotion ? '0ms' : `${delay}ms`
                  }}
                  onMouseEnter={(e) => {
                    if (featuresVisible && window.innerWidth >= 640) {
                      e.currentTarget.style.borderColor = '#E0E7FF';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      
                      // Icon container hover
                      const iconContainer = e.currentTarget.querySelector('.feature-icon-container');
                      if (iconContainer) {
                        iconContainer.style.backgroundColor = '#312E81';
                        iconContainer.style.transform = 'scale(1.05)';
                        const icon = iconContainer.querySelector('svg');
                        if (icon) {
                          icon.style.color = 'white';
                        }
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (featuresVisible && window.innerWidth >= 640) {
                      e.currentTarget.style.borderColor = '#F3F4F6';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                      
                      // Icon container reset
                      const iconContainer = e.currentTarget.querySelector('.feature-icon-container');
                      if (iconContainer) {
                        iconContainer.style.backgroundColor = '#EEF2FF';
                        iconContainer.style.transform = 'scale(1)';
                        const icon = iconContainer.querySelector('svg');
                        if (icon) {
                          icon.style.color = '#312E81';
                        }
                      }
                    }
                  }}
                >
                  {/* Icon Container */}
                  <div 
                    className="feature-icon-container"
                    style={{
                      width: 'clamp(56px, 7vw, 72px)',
                      height: 'clamp(56px, 7vw, 72px)',
                      backgroundColor: '#EEF2FF',
                      borderRadius: 'clamp(14px, 2vw, 18px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto clamp(16px, 3vw, 24px)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <IconComponent 
                      size={30}
                      style={{ 
                        color: '#312E81',
                        strokeWidth: '1.75px',
                        transition: 'color 0.25s ease'
                      }} 
                    />
                  </div>

                  {/* Card Title */}
                  <h3 style={{
                    fontSize: 'clamp(18px, 2.5vw, 20px)',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 'clamp(12px, 2vw, 14px)',
                    lineHeight: 1.3,
                    textAlign: 'center'
                  }}>
                    {feature.title}
                  </h3>

                  {/* Card Description */}
                  <p style={{
                    fontSize: 'clamp(14px, 1.5vw, 15px)',
                    fontWeight: 400,
                    color: '#4B5563',
                    lineHeight: 1.6,
                    textAlign: 'center',
                    maxWidth: '260px',
                    margin: '0 auto'
                  }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        ref={howItWorksRef}
        className="bg-primary-soft"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)',
          position: 'relative'
        }}
        role="region"
        aria-labelledby="how-it-works-title"
      >
        {/* Subtle noise texture overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            pointerEvents: 'none'
          }}
        />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: 'clamp(40px, 5vw, 56px)' }}>
            <h2 
              id="how-it-works-title"
              style={{
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
                opacity: howItWorksVisible ? 1 : 0,
                transform: howItWorksVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out'
              }}
            >
              Start in 60 Seconds
            </h2>
          </div>

          {/* Desktop Layout - Horizontal with arrows (≥1024px) */}
          <div className="hidden lg:flex items-center justify-center" style={{ gap: '0', maxWidth: '1100px', margin: '0 auto' }}>
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Step Card */}
                <div 
                  className="group"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '36px 28px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    width: '320px',
                    position: 'relative',
                    zIndex: 2,
                    transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
                    cursor: 'default',
                    opacity: howItWorksVisible ? 1 : 0,
                    transform: howItWorksVisible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: prefersReducedMotion ? '0ms' : `${index * 200}ms`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Step Number Circle */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: '#312E81',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    animation: prefersReducedMotion ? 'none' : 'numberPulse 2.5s ease-in-out infinite'
                  }}>
                    <span style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'white'
                    }}>
                      {index + 1}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '14px'
                  }}>
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: '#4B5563',
                    lineHeight: 1.6,
                    maxWidth: '250px',
                    margin: '0 auto'
                  }}>
                    {step.description}
                  </p>
                </div>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div style={{
                    width: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                    animation: prefersReducedMotion ? 'none' : 'slideRight 1.5s ease-in-out infinite'
                  }}>
                    <ArrowRight 
                      size={32} 
                      style={{ 
                        color: '#6366F1',
                        strokeWidth: '2px'
                      }} 
                      aria-hidden="true"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Tablet & Mobile Layout - Vertical with arrows (<1024px) */}
          <div className="lg:hidden" style={{ flexDirection: 'column', alignItems: 'center', gap: '0', maxWidth: 'clamp(320px, 90vw, 400px)', margin: '0 auto' }}>
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Step Card */}
                <div 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 'clamp(20px, 3vw, 24px)',
                    padding: 'clamp(24px, 3vw, 32px) clamp(20px, 3vw, 24px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    width: '100%',
                    position: 'relative',
                    zIndex: 2,
                    opacity: howItWorksVisible ? 1 : 0,
                    transform: howItWorksVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: prefersReducedMotion ? 'none' : 'all 0.5s ease-out',
                    transitionDelay: prefersReducedMotion ? '0ms' : `${index * 200}ms`
                  }}
                >
                  {/* Step Number Circle */}
                  <div style={{
                    width: 'clamp(48px, 8vw, 52px)',
                    height: 'clamp(48px, 8vw, 52px)',
                    backgroundColor: '#312E81',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto clamp(16px, 3vw, 20px)',
                    animation: prefersReducedMotion ? 'none' : 'numberPulse 2.5s ease-in-out infinite'
                  }}>
                    <span style={{
                      fontSize: 'clamp(24px, 4vw, 26px)',
                      fontWeight: 700,
                      color: 'white'
                    }}>
                      {index + 1}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3 style={{
                    fontSize: 'clamp(18px, 3vw, 20px)',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 'clamp(10px, 2vw, 12px)'
                  }}>
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p style={{
                    fontSize: 'clamp(13px, 2vw, 14px)',
                    fontWeight: 400,
                    color: '#4B5563',
                    lineHeight: 1.6
                  }}>
                    {step.description}
                  </p>
                </div>

                {/* Down Arrow */}
                {index < steps.length - 1 && (
                  <div style={{
                    margin: 'clamp(4px, 1vw, 8px) 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    animation: prefersReducedMotion ? 'none' : 'slideDown 1.5s ease-in-out infinite'
                  }}>
                    <svg width="clamp(24px, 4vw, 28px)" height="clamp(24px, 4vw, 28px)" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" aria-hidden="true">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section 
        ref={dashboardRef}
        className="bg-white"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)'
        }}
        role="region"
        aria-labelledby="preview-title"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
            <h2 
              id="preview-title"
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
                opacity: dashboardVisible ? 1 : 0,
                transform: dashboardVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: prefersReducedMotion ? 'none' : 'all 0.7s ease-out'
              }}
            >
              See Your Duka Like Never Before
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 400,
              color: '#4B5563',
              maxWidth: 'clamp(280px, 50vw, 500px)',
              margin: '0 auto',
              opacity: dashboardVisible ? 1 : 0,
              transform: dashboardVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: prefersReducedMotion ? 'none' : 'all 0.7s ease-out 100ms'
            }}>
              A beautiful dashboard that shows you exactly what matters
            </p>
          </div>

          {/* Mockup Container */}
          <div 
            style={{
              maxWidth: 'clamp(300px, 95vw, 1100px)',
              margin: '0 auto',
              position: 'relative',
              opacity: dashboardVisible ? 1 : 0,
              transform: dashboardVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: prefersReducedMotion ? 'none' : 'all 0.7s ease-out 200ms'
            }}
          >
            {/* Browser Window Frame */}
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: 'clamp(16px, 3vw, 24px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
                animation: prefersReducedMotion ? 'none' : 'dashboardFloat 4s ease-in-out infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Browser Top Bar */}
              <div style={{
                height: 'clamp(36px, 5vw, 44px)',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                padding: '0 clamp(12px, 3vw, 20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {/* Browser Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: 'clamp(10px, 2vw, 12px)', height: 'clamp(10px, 2vw, 12px)', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <div style={{ width: 'clamp(10px, 2vw, 12px)', height: 'clamp(10px, 2vw, 12px)', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <div style={{ width: 'clamp(10px, 2vw, 12px)', height: 'clamp(10px, 2vw, 12px)', borderRadius: '50%', backgroundColor: '#10B981' }} />
                </div>

                {/* URL Bar */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: 'clamp(4px, 1vw, 6px) clamp(12px, 2vw, 16px)',
                  marginLeft: 'clamp(8px, 2vw, 16px)',
                  flex: 1,
                  maxWidth: '300px',
                  fontSize: 'clamp(11px, 1.5vw, 13px)',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Lock size={12} style={{ color: '#10B981' }} />
                  <span>cecilia.dukaflow.com/dashboard</span>
                </div>

                {/* Browser Action Icons */}
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#94A3B8', opacity: 0.5 }} />
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#94A3B8', opacity: 0.5 }} />
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#94A3B8', opacity: 0.5 }} />
                </div>
              </div>

              {/* Dashboard Preview Content Area */}
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: 'clamp(16px, 3vw, 24px)',
                minHeight: 'clamp(400px, 50vw, 600px)'
              }}>
                {/* Dashboard Mockup Content */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  {/* Profit Card */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    borderLeft: '4px solid #E8835C',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Today's Profit</p>
                    <p style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: '#E8835C', marginBottom: '4px' }}>KSh 4,210</p>
                    <p style={{ fontSize: '13px', color: '#10B981' }}>↑ 12% from yesterday</p>
                  </div>

                  {/* Sales Card */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Today's Sales</p>
                    <p style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: '#312E81', marginBottom: '4px' }}>KSh 12,450</p>
                    <p style={{ fontSize: '13px', color: '#10B981' }}>↑ 8% from yesterday</p>
                  </div>

                  {/* Low Stock Card */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Low Stock Alert</p>
                    <p style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: '#F59E0B', marginBottom: '4px' }}>7 Items</p>
                    <p style={{ fontSize: '13px', color: '#64748B' }}>Need restocking</p>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  height: 'clamp(200px, 25vw, 280px)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around'
                }}>
                  {/* Bar Chart Mockup */}
                  {[60, 45, 75, 50, 80, 65, 90].map((height, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: 'clamp(30px, 4vw, 50px)',
                        height: `${height}%`,
                        backgroundColor: i % 2 === 0 ? '#312E81' : '#E8835C',
                        borderRadius: '6px 6px 0 0',
                        opacity: 0.8
                      }} />
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Section - Transactions & Alerts */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Recent Transactions */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Recent Transactions</h4>
                    {[
                      { product: 'Blue Dress (M)', amount: 'KSh 1,200', worker: 'Amina' },
                      { product: 'Phone Case', amount: 'KSh 350', worker: 'John' },
                      { product: 'Milk 500ml', amount: 'KSh 60', worker: 'Amina' }
                    ].map((tx, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none'
                      }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{tx.product}</p>
                          <p style={{ fontSize: '12px', color: '#94A3B8' }}>{tx.worker}</p>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#312E81' }}>{tx.amount}</p>
                      </div>
                    ))}
                  </div>

                  {/* Low Stock Alerts */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Low Stock Alerts</h4>
                    {[
                      { item: 'Sugar 1kg', stock: '3 left', urgent: true },
                      { item: 'Bread (White)', stock: '5 left', urgent: true },
                      { item: 'Cooking Oil 1L', stock: '8 left', urgent: false }
                    ].map((alert, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none'
                      }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{alert.item}</p>
                          <p style={{ fontSize: '12px', color: alert.urgent ? '#EF4444' : '#94A3B8' }}>{alert.stock}</p>
                        </div>
                        <button style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#312E81',
                          backgroundColor: '#EEF2FF',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}>
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(12px, 3vw, 32px)',
            marginTop: 'clamp(28px, 4vw, 40px)'
          }}>
            {['Real-time updates', 'Mobile responsive', 'No training needed'].map((feature, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 'clamp(14px, 1.5vw, 15px)',
                fontWeight: 500,
                color: '#334155',
                opacity: dashboardVisible ? 1 : 0,
                transform: dashboardVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: prefersReducedMotion ? 'none' : 'all 0.5s ease-out',
                transitionDelay: prefersReducedMotion ? '0ms' : `${i * 100}ms`
              }}>
                <CheckCircle size={18} style={{ color: '#10B981' }} />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className="bg-neutral-50"
        role="region"
        aria-labelledby="pricing-title"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
            <h2 
              id="pricing-title"
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '12px'
              }}
            >
              Simple, Transparent Pricing
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 400,
              color: '#4B5563',
              maxWidth: 'clamp(280px, 50vw, 500px)',
              margin: '0 auto'
            }}>
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Billing Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 'clamp(32px, 5vw, 48px)'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '40px',
              padding: '4px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              display: 'flex'
            }}>
              <button
                onClick={() => setIsAnnual(false)}
                role="switch"
                aria-checked={!isAnnual}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  backgroundColor: !isAnnual ? '#312E81' : 'transparent',
                  color: !isAnnual ? 'white' : '#4B5563'
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                role="switch"
                aria-checked={isAnnual}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  backgroundColor: isAnnual ? '#312E81' : 'transparent',
                  color: isAnnual ? 'white' : '#4B5563',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Annual
                {isAnnual && (
                  <span style={{
                    backgroundColor: '#FDE8E0',
                    color: '#C2410C',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}>
                    Save 20%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Pricing Grid - Desktop (3 columns) */}
          <div className="hidden lg:grid" style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(20px, 3vw, 28px)',
            marginBottom: 'clamp(32px, 5vw, 40px)',
            alignItems: 'stretch'
          }}>
            {pricingPlans.map((plan, index) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : null;

              return (
                <PricingCard 
                  key={index}
                  plan={plan}
                  price={price}
                  monthlyEquivalent={monthlyEquivalent}
                  isAnnual={isAnnual}
                />
              );
            })}
          </div>

          {/* Tablet Layout - Popular on top, others side-by-side */}
          <div className="hidden md:flex lg:hidden" style={{
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            marginBottom: 'clamp(32px, 5vw, 40px)'
          }}>
            {/* Popular Card - Full Width */}
            {pricingPlans.filter(p => p.popular).map((plan, index) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : null;
              
              return (
                <PricingCard 
                  key={index}
                  plan={plan}
                  price={price}
                  monthlyEquivalent={monthlyEquivalent}
                  isAnnual={isAnnual}
                  maxWidth="400px"
                />
              );
            })}
            
            {/* Other Plans - Side by Side */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              width: '100%',
              maxWidth: '800px'
            }}>
              {pricingPlans.filter(p => !p.popular).map((plan, index) => {
                const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : null;
                
                return (
                  <PricingCard 
                    key={index}
                    plan={plan}
                    price={price}
                    monthlyEquivalent={monthlyEquivalent}
                    isAnnual={isAnnual}
                    maxWidth="350px"
                  />
                );
              })}
            </div>
          </div>

          {/* Mobile Layout - Stacked, most popular first */}
          <div className="md:hidden" style={{
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0',
            marginBottom: 'clamp(32px, 5vw, 40px)'
          }}>
            {pricingPlans
              .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
              .map((plan, index) => {
                const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : null;
                
                return (
                  <PricingCard 
                    key={index}
                    plan={plan}
                    price={price}
                    monthlyEquivalent={monthlyEquivalent}
                    isAnnual={isAnnual}
                    maxWidth="100%"
                    isMobile={true}
                  />
                );
              })}
          </div>

          {/* Footer Note */}
          <div style={{
            maxWidth: '900px',
            margin: 'clamp(32px, 4vw, 40px) auto 0',
            paddingTop: '24px',
            borderTop: '1px solid #E2E8F0'
          }}>
            <p className="text-center" style={{
              fontSize: 'clamp(13px, 1.5vw, 14px)',
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 1.6
            }}>
              All plans include: Stock management • Sales tracking • Worker management • Email notifications • Data export • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        className="bg-white"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)'
        }}
        role="region"
        aria-labelledby="testimonials-title"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
            <h2 
              id="testimonials-title"
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '12px'
              }}
            >
              Trusted by Duka Owners Across Kenya
            </h2>
          </div>

          {/* Desktop Grid (3 cards) */}
          <div className="hidden md:grid" style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <div
                key={index}
                className="group"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '20px',
                  padding: '32px',
                  border: '1px solid #F3F4F6',
                  transition: 'all 0.25s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#F3F4F6';
                }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="fill-accent" style={{ color: '#E8835C' }} />
                  ))}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#374151',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  marginBottom: '24px'
                }}>
                  "{testimonial.quote}"
                </p>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '20px' }} />

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#EEF2FF',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={24} style={{ color: '#312E81' }} />
                  </div>
                  {/* Author Info */}
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                      {testimonial.name}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6B7280' }}>
                      {testimonial.shop}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile - Single Card Carousel */}
          <div className="md:hidden" style={{ position: 'relative' }}>
            <div
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '20px',
                padding: '24px 20px',
                border: '1px solid #F3F4F6'
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} size={18} className="fill-accent" style={{ color: '#E8835C' }} />
                ))}
              </div>

              {/* Quote */}
              <p style={{
                fontSize: '15px',
                fontWeight: 400,
                color: '#374151',
                lineHeight: 1.6,
                fontStyle: 'italic',
                marginBottom: '20px'
              }}>
                "{testimonials[currentTestimonial].quote}"
              </p>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '16px' }} />

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#EEF2FF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} style={{ color: '#312E81' }} />
                </div>
                {/* Author Info */}
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B7280' }}>
                    {testimonials[currentTestimonial].shop}
                  </p>
                </div>
              </div>
            </div>

            {/* Carousel Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '24px'
            }}>
              {/* Previous Button */}
              <button
                onClick={() => setCurrentTestimonial(prev => 
                  prev === 0 ? testimonials.length - 1 : prev - 1
                )}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#312E81';
                  e.currentTarget.style.borderColor = '#312E81';
                  e.currentTarget.querySelector('svg').style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.querySelector('svg').style.color = '#9CA3AF';
                }}
              >
                <ChevronLeft size={20} style={{ color: '#9CA3AF', transition: 'color 0.2s ease' }} />
              </button>

              {/* Dot Indicators */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {testimonials.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: index === currentTestimonial ? '24px' : '8px',
                      height: '8px',
                      backgroundColor: index === currentTestimonial ? '#312E81' : '#D1D5DB',
                      borderRadius: index === currentTestimonial ? '4px' : '50%',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentTestimonial(prev => 
                  prev === testimonials.length - 1 ? 0 : prev + 1
                )}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#312E81';
                  e.currentTarget.style.borderColor = '#312E81';
                  e.currentTarget.querySelector('svg').style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.querySelector('svg').style.color = '#9CA3AF';
                }}
              >
                <ChevronRight size={20} style={{ color: '#9CA3AF', transition: 'color 0.2s ease' }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section 
        className="bg-[#1E1B4B]"
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)'
        }}
        role="region"
        aria-labelledby="cta-title"
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          {/* Title */}
          <h2 
            id="cta-title"
            style={{
              fontSize: 'clamp(30px, 4vw, 40px)',
              fontWeight: 700,
              color: 'white',
              marginBottom: '16px'
            }}
          >
            Ready to Run Your Duka Smarter?
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            fontWeight: 400,
            color: '#EEF2FF',
            marginBottom: '36px'
          }}>
            Join 500+ Kenyan shop owners who've already made the switch
          </p>

          {/* Button Group */}
          <div 
            className="flex flex-col md:flex-row"
            style={{
              justifyContent: 'center',
              gap: 'clamp(12px, 2vw, 20px)',
              marginBottom: '28px'
            }}
          >
            {/* Primary CTA - Start Free Trial */}
            <Link to="/signup">
              <button
                style={{
                  width: '100%',
                  padding: 'clamp(14px, 2vw, 16px) clamp(24px, 3vw, 32px)',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'white',
                  color: '#1E1B4B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FF';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Start Free Trial
              </button>
            </Link>

            {/* Secondary CTA - Contact Sales */}
            <button
              style={{
                width: '100%',
                padding: 'clamp(14px, 2vw, 16px) clamp(24px, 3vw, 32px)',
                fontSize: '16px',
                fontWeight: 500,
                borderRadius: '10px',
                border: '1.5px solid #6366F1',
                backgroundColor: 'transparent',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#6366F1';
              }}
            >
              Contact Sales
            </button>
          </div>

          {/* Trust Text */}
          <p style={{
            fontSize: '14px',
            color: '#6366F1'
          }}>
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      <Footer />

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeLeft {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes numberPulse {
          0%, 100% { 
            box-shadow: 0 4px 6px -1px rgba(49, 46, 129, 0.3);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(49, 46, 129, 0.1);
          }
        }

        @keyframes slideRight {
          0%, 100% { 
            transform: translateX(0);
          }
          50% { 
            transform: translateX(4px);
          }
        }

        @keyframes slideDown {
          0%, 100% { 
            transform: translateY(0);
          }
          50% { 
            transform: translateY(4px);
          }
        }

        @keyframes dashboardFloat {
          0%, 100% { 
            transform: translateY(0);
          }
          50% { 
            transform: translateY(-6px);
          }
        }

        @keyframes pillFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hide scrollbar for mobile trust bar */
        #trustBarScroll::-webkit-scrollbar {
          display: none;
        }
        #trustBarScroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Responsive adjustments */
        @media (max-width: 639px) {
          section[role="banner"] {
            padding: 40px 20px !important;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          section[role="banner"] {
            padding: 60px 40px !important;
          }
        }

        @media (min-width: 1024px) {
          section[role="banner"] > div > div:first-child {
            text-align: left !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
