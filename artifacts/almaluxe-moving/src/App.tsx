import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Box, BriefcaseBusiness,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, FileDown,
  House, Mail, MapPin, Menu, MoveRight, PackageCheck, Phone, ShieldCheck, Truck,
  X,
} from 'lucide-react';
import {
  getExportLeadsQueryKey, getGetLeadSummaryQueryKey, getListLeadsQueryKey,
  useCreateLead, useExportLeads, useGetAdminSession, useGetLeadSummary,
  useListLeads, useUpdateLead,
} from '@workspace/api-client-react';
import type { Lead, LeadStatus, MovingService, PropertyType } from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import './app.css';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the frontend environment.');
const phones = [{ number: '+91 94478 34071', href: '+919447834071' }, { number: '+91 99950 55922', href: '+919995055922' }];
const email = 'packersandmovers@almaluxeexportllp.com';
const address = 'Perumbilavu, Thrissur, Kerala 680519';
const navItems = [
  { href: '/', label: 'Home' }, { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' }, { href: '/areas', label: 'Areas' },
  { href: '/contact', label: 'Contact' },
];
const serviceOptions: { value: MovingService; label: string }[] = [
  { value: 'household-shifting', label: 'Household shifting' },
  { value: 'office-relocation', label: 'Office relocation' },
  { value: 'packing-unpacking', label: 'Packing & unpacking' },
  { value: 'loading-unloading', label: 'Loading & unloading' },
  { value: 'local-moving', label: 'Local moving' },
  { value: 'long-distance-moving', label: 'Long-distance moving' },
];
const statusOptions: LeadStatus[] = ['new', 'contacted', 'quoted', 'booked', 'closed'];

function setPageMeta(title: string, description: string) {
  document.title = title;
  const set = (selector: string, attribute: string, value: string) => {
    let tag = document.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      const [key, keyValue] = selector.replace('meta[', '').replace(']', '').split('=');
      tag.setAttribute(key.replace('name', 'name').replace('property', 'property'), keyValue.replaceAll('"', ''));
      document.head.appendChild(tag);
    }
    tag.setAttribute(attribute, value);
  };
  set('meta[name="description"]', 'content', description);
  set('meta[property="og:title"]', 'content', title);
  set('meta[property="og:description"]', 'content', description);
}

function BrandMark({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brandmark focus-ring ${light ? 'brandmark-light' : ''}`} aria-label="Almaluxe Packers & Movers home" data-testid="link-brand-home">
    <span className="brand-symbol"><Truck size={19} strokeWidth={2.1} /></span>
    <span className="brand-name display">ALMALUX<span>E</span><small>PACKERS AND MOVERS</small></span>
  </Link>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => setOpen(false), [location]);
  return <>
    <div className="topline"><div className="topline-inner">
      <span><MapPin size={13} /> Thrissur, Kerala · Route confirmation required</span>
      <div className="topline-contact"><span>Speak with our team</span>{phones.map((p) => <a key={p.href} href={`tel:${p.href}`} data-testid={`link-top-phone-${p.href}`}><Phone size={12} />{p.number}</a>)}</div>
    </div></div>
    <header className="site-header">
      <div className="header-inner"><BrandMark />
        <nav className="desktop-nav" aria-label="Main navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className={`nav-link ${location === item.href ? 'is-active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase()}`}>{item.label}</Link>)}</nav>
        <Show when="signed-in"><Link href="/admin" className="nav-link" data-testid="link-admin-desk">Lead desk</Link></Show>
        <Link href="/quote" className="button button-dark header-cta" data-testid="link-header-quote">Request a quote <ArrowUpRight size={16} /></Link>
        <button className="mobile-menu-button focus-ring" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} data-testid="button-mobile-menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className="mobile-nav-link" data-testid={`link-mobile-${item.label.toLowerCase()}`}>{item.label}<ArrowRight size={16} /></Link>)}<Link href="/quote" className="button button-gold mobile-quote" data-testid="link-mobile-quote">Request a quote <ArrowUpRight size={16} /></Link></nav>}
    </header>
  </>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><BrandMark light /><p>Moving enquiries for homes and workplaces, from Thrissur. Tell us what you need; we’ll confirm service and route availability before booking.</p><Link href="/quote" className="footer-cta">Start a quote request <ArrowUpRight size={16} /></Link></div>
      <div className="footer-column"><span className="footer-label">Explore</span>{navItems.slice(1).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}<Link href="/privacy">Privacy notice</Link></div>
      <div className="footer-column"><span className="footer-label">Contact</span>{phones.map((p) => <a key={p.href} href={`tel:${p.href}`}>{p.number}</a>)}<a href={`mailto:${email}`}>{email}</a><span className="footer-address">{address}</span></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Almaluxe Packers & Movers</span><span>Thrissur, Kerala</span></div>
  </footer>;
}

function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="site-noise"><Header />{children}<Footer /></div>;
}

function PublicPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  useEffect(() => setPageMeta(title, description), [title, description]);
  return <PublicLayout>{children}</PublicLayout>;
}

function HomePage() {
  const title = 'Almaluxe Packers & Movers | Moving enquiries in Thrissur';
  const description = 'Request information about household and business moving services from Almaluxe Packers & Movers in Thrissur. Routes and services are confirmed before booking.';
  return <PublicPage title={title} description={description}>
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy rise-in">
            <div className="eyebrow"><span className="eyebrow-line" /> MOVING, STARTING WITH A CONVERSATION</div>
            <h1 className="display">A new address.<br /><em>A considered move.</em></h1>
            <p className="hero-intro">Household and business moving enquiries, handled from Thrissur. Share the details and we’ll help you understand what can be arranged.</p>
            <div className="hero-actions"><Link href="/quote" className="button button-gold" data-testid="link-hero-quote">Request a quote <ArrowUpRight size={17} /></Link><a href="tel:+919447834071" className="text-link" data-testid="link-hero-call"><Phone size={15} /> Call +91 94478 34071</a></div>
            <div className="hero-note"><ShieldCheck size={16} /><span>Every route and requested service is confirmed before booking.</span></div>
          </div>
          <div className="hero-visual" aria-label="Moving boxes and a truck illustration">
            <div className="visual-index mono">ALM / 01 — THRISSUR</div>
            <div className="visual-glow" />
            <div className="route-mark"><span className="route-dot" /><span className="route-dash" /><MapPin size={27} /></div>
            <div className="moving-illustration">
              <div className="sun-disc" />
              <div className="building building-back"><i /><i /><i /><i /><i /><i /></div>
              <div className="building building-front"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="road" />
              <div className="truck-art"><div className="truck-cargo"><div className="cargo-line" /><div className="cargo-mark display">ALM</div><div className="cargo-line short" /></div><div className="truck-cab"><div className="cab-window" /></div><div className="truck-chassis" /><div className="wheel wheel-one" /><div className="wheel wheel-two" /><div className="wheel-wheel-one" /><div className="wheel-wheel-two" /></div>
              <div className="box-art box-a"><span /><span /></div><div className="box-art box-b"><span /><span /></div><div className="box-art box-c"><span /><span /></div>
              <div className="visual-caption"><span className="caption-number mono">01 / 04</span><span>From first details<br />to a move plan</span><ArrowDownRight size={18} /></div>
            </div>
            <div className="hero-side-label display">PACKERS<br />& MOVERS</div>
          </div>
        </div>
        <div className="hero-bottom"><span>HOUSEHOLD MOVING</span><i /><span>BUSINESS RELOCATION</span><i /><span>THRISSUR, KERALA</span><ArrowRight size={16} /></div>
      </section>

      <section className="intro-strip">
        <span className="section-kicker">A CLEAR START</span>
        <p>Moving begins with the right questions.<br className="desktop-break" /> We’ll ask about <span>your places, your date,</span> and what you’d like to move.</p>
        <Link href="/quote" className="round-link" aria-label="Request a quote" data-testid="link-intro-quote"><ArrowUpRight size={21} /></Link>
      </section>

      <section className="services-teaser page-section">
        <div className="section-heading"><div><span className="section-kicker">HOW WE CAN HELP</span><h2 className="display">Moving needs<br /><em>aren’t all alike.</em></h2></div><p>Choose the service information you’re looking for. Each selection is a request only; we’ll confirm what is available for your route and date.</p></div>
        <div className="service-list">
          {serviceOptions.slice(0, 4).map((service, i) => <Link href="/services" className="service-row" key={service.value} data-testid={`link-service-row-${service.value}`}><span className="service-num mono">0{i + 1}</span><span className="service-name display">{service.label}</span><span className="service-category">{i < 2 ? 'HOME & WORK' : 'MOVE SUPPORT'}</span><ArrowUpRight className="service-arrow" size={20} /></Link>)}
        </div>
        <Link href="/services" className="underlined-link">View requested services <MoveRight size={16} /></Link>
      </section>

      <section className="process-band">
        <div className="process-copy"><span className="section-kicker">NO ASSUMPTIONS</span><h2 className="display">First, let’s confirm<br />what’s possible.</h2><p>Thrissur is our primary service area. Whether a particular move can be arranged depends on its route, service needs and date. We’ll confirm those details before booking.</p><Link href="/areas" className="button button-light">Read about service areas <ArrowRight size={16} /></Link></div>
        <div className="process-steps">
          <div className="process-step"><span className="process-index mono">01</span><div><h3>Tell us the outline</h3><p>Pickup, destination, moving date and the kind of property.</p></div><ArrowRight size={16} /></div>
          <div className="process-step"><span className="process-index mono">02</span><div><h3>We review your request</h3><p>Our team checks the specific route and requested service.</p></div><ArrowRight size={16} /></div>
          <div className="process-step"><span className="process-index mono">03</span><div><h3>Discuss next steps</h3><p>Booking follows only after availability is confirmed with you.</p></div><ArrowRight size={16} /></div>
        </div>
      </section>
      <section className="faq-section page-section" aria-labelledby="faq-heading">
        <div className="faq-heading">
          <span className="section-kicker">FREQUENTLY ASKED</span>
          <h2 id="faq-heading" className="display">Clear answers<br /><em>before you move.</em></h2>
          <p>Every move is different. We’ll confirm route and service availability with you before any booking.</p>
        </div>
        <div className="faq-list">
          <details><summary>Is Thrissur your primary service area?<span aria-hidden="true">+</span></summary><p>Yes. The supplied company information identifies Thrissur as the primary area. Please share your pickup and destination so the team can confirm coverage for your specific move.</p></details>
          <details><summary>Can I request a move to any destination?<span aria-hidden="true">+</span></summary><p>You can send a request for your route. Availability depends on the locations, date and services needed, and will be confirmed by the team.</p></details>
          <details><summary>Does a quote request confirm my booking?<span aria-hidden="true">+</span></summary><p>No. A quote request is an enquiry only. Your move is not booked unless the team confirms availability and next steps with you.</p></details>
          <details><summary>What details should I include?<span aria-hidden="true">+</span></summary><p>Share your pickup and destination, preferred moving date, property type and the services you’re interested in. You can add other useful details in the message field.</p></details>
        </div>
      </section>
      <section className="contact-ribbon"><div><span className="section-kicker">READY WHEN YOU ARE</span><h2 className="display">Start with a few details.</h2></div><Link href="/quote" className="button button-gold" data-testid="link-home-bottom-quote">Request a quote <ArrowUpRight size={17} /></Link></section>
    </main>
  </PublicPage>;
}

function PageHero({ label, title, accent, copy }: { label: string; title: string; accent: string; copy: string }) {
  return <section className="page-hero"><div className="page-hero-inner"><span className="eyebrow"><span className="eyebrow-line" />{label}</span><h1 className="display">{title}<br /><em>{accent}</em></h1><p>{copy}</p></div><div className="page-hero-mark display">A<span>.</span></div></section>;
}

function AboutPage() {
  const title = 'About Almaluxe Packers & Movers | Thrissur';
  const description = 'Learn about Almaluxe Packers & Movers and how to begin a household or business moving enquiry from Thrissur.';
  return <PublicPage title={title} description={description}><main>
    <PageHero label="ABOUT ALMALUXE" title="Every move has" accent="its own details." copy="Almaluxe Packers & Movers serves households and businesses from Perumbilavu, Thrissur. We begin by understanding the move you have in mind." />
    <section className="about-content page-section"><div className="about-sidebar"><span className="section-kicker">OUR APPROACH</span><div className="about-stamp display">A<br /><small>THRISSUR</small></div></div><div className="about-story"><h2 className="display">Clear details make<br />a better first step.</h2><p>Moving a home and moving a workplace call for different conversations. We invite you to share your pickup point, destination, date and the services you want to ask about.</p><p>From there, we can check the specific route and service request with you. Thrissur is our primary service area; no route or service is assumed available until it has been confirmed.</p><div className="about-facts"><div><span className="mono">01 / BASE</span><strong>Perumbilavu</strong><small>Thrissur, Kerala</small></div><div><span className="mono">02 / ENQUIRIES</span><strong>Homes & businesses</strong><small>Service details confirmed per request</small></div></div><Link href="/quote" className="button button-dark">Tell us about your move <ArrowUpRight size={16} /></Link></div></section>
  </main></PublicPage>;
}

function ServicesPage() {
  const title = 'Moving service enquiries | Almaluxe Packers & Movers';
  const description = 'Explore household and business moving service requests. All service choices are information requests and require availability confirmation.';
  const details = [
    { icon: House, title: 'Household shifting', text: 'Ask about a home move and share the size and locations involved.' },
    { icon: BriefcaseBusiness, title: 'Office relocation', text: 'Share the workplace move details and any timing considerations.' },
    { icon: Box, title: 'Packing & unpacking', text: 'Ask whether packing or unpacking support can be arranged for your move.' },
    { icon: PackageCheck, title: 'Loading & unloading', text: 'Let us know if you want information about loading or unloading support.' },
    { icon: Truck, title: 'Local moving', text: 'Request information about a move within or around your location.' },
    { icon: MoveRight, title: 'Long-distance moving', text: 'Tell us your origin and destination so the route can be checked.' },
  ];
  return <PublicPage title={title} description={description}><main><PageHero label="REQUESTED SERVICES" title="What are you" accent="planning to move?" copy="These are ways to describe what you need information about—not a promise that a particular service or route is available." />
    <section className="requested-services page-section"><div className="service-disclaimer"><CircleAlert size={19} /><p><strong>Availability is confirmed case by case.</strong> Share your date and route; our team will confirm whether the requested service can be arranged before booking.</p></div><div className="service-catalog">{details.map(({ icon: Icon, title: name, text }, index) => <article className="catalog-item" key={name}><span className="catalog-index mono">0{index + 1}</span><span className="catalog-icon"><Icon size={22} strokeWidth={1.7} /></span><div><h2 className="display">{name}</h2><p>{text}</p></div><Link href="/quote" className="catalog-link" aria-label={`Ask about ${name}`} data-testid={`link-ask-${index}`}><ArrowUpRight size={18} /></Link></article>)}</div></section>
    <section className="inline-cta"><span>Not sure which service to choose?</span><Link href="/quote" className="button button-gold">Describe your move <ArrowRight size={16} /></Link></section>
  </main></PublicPage>;
}

function AreasPage() {
  const title = 'Service areas & route confirmation | Almaluxe';
  const description = 'Thrissur is the primary service area for Almaluxe Packers & Movers. Confirm every route and requested service before booking.';
  return <PublicPage title={title} description={description}><main><PageHero label="SERVICE AREA INFORMATION" title="Start from" accent="your locations." copy="Thrissur is our primary service area. Every pickup-to-destination route and requested service needs confirmation before a booking." />
    <section className="areas-content page-section"><div className="area-location"><div className="area-pin"><MapPin size={27} /></div><span className="section-kicker">PRIMARY SERVICE AREA</span><h2 className="display">Thrissur</h2><p>Perumbilavu, Thrissur, Kerala 680519</p><div className="area-coordinates mono">10°42′N&nbsp; 76°04′E</div></div><div className="area-explain"><span className="section-kicker">ROUTE BY ROUTE</span><h2 className="display">Please check<br />before you plan.</h2><p>A service-area listing is not a guarantee that a route is available. Tell us both ends of the move, your date and the service information you need.</p><div className="area-check"><Check size={16} /><span>We’ll confirm whether your route and service request can be accommodated before booking.</span></div><p className="fine-print">The six service choices on this site are requests for information, not a statement of availability.</p><Link href="/quote" className="button button-dark">Check a route <ArrowUpRight size={16} /></Link></div></section>
    <section className="route-question"><div><span className="section-kicker">HAVE A SPECIFIC ROUTE?</span><h2 className="display">Let’s check it together.</h2></div><Link href="/quote" className="button button-gold">Send an enquiry <ArrowRight size={16} /></Link></section>
  </main></PublicPage>;
}

const initialLead = {
  name: '', phone: '', email: '', pickupLocation: '', destination: '', movingDate: '',
  propertyType: 'house' as PropertyType, services: [] as MovingService[], additionalDetails: '', website: '',
};

function QuotePage() {
  const title = 'Request moving information | Almaluxe Packers & Movers';
  const description = 'Share your moving details with Almaluxe Packers & Movers. Service and route availability in Thrissur and elsewhere must be confirmed before booking.';
  const createLead = useCreateLead();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initialLead);
  const [submitted, setSubmitted] = useState<{ reference: string } | null>(null);
  const [formError, setFormError] = useState('');
  const toggleService = (value: MovingService) => setValues((current) => ({ ...current, services: current.services.includes(value) ? current.services.filter((service) => service !== value) : [...current.services, value] }));
  const setField = (field: keyof typeof initialLead, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (values.services.length === 0) { setFormError('Choose at least one service you’d like information about.'); return; }
    try {
      const result = await createLead.mutateAsync({ data: { ...values, email: values.email.trim() || null } });
      void queryClient.invalidateQueries({ queryKey: getGetLeadSummaryQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
      setSubmitted({ reference: result.reference });
    } catch {
      setFormError('We couldn’t send your request just now. Please try again, or call our team directly.');
    }
  };
  const field = (name: keyof typeof initialLead, label: string, type = 'text', required = true, placeholder = '') => <label className="field" key={name}><span>{label}{required && <b> *</b>}</span><input data-testid={`input-${name}`} type={type} required={required} value={values[name] as string} placeholder={placeholder} onChange={(e) => setField(name, e.target.value)} /></label>;
  return <PublicPage title={title} description={description}><main><PageHero label="QUOTE REQUEST" title="Tell us about" accent="your move." copy="A few practical details help us review your enquiry. Sending a request does not confirm service or a booking." />
    <section className="quote-layout page-section">
      <div className="quote-aside"><span className="section-kicker">A GOOD PLACE TO BEGIN</span><h2 className="display">The details<br />shape the move.</h2><p>Give us your locations, preferred date, property type and the moving services you want to ask about.</p><div className="quote-contact"><span>Would rather talk?</span>{phones.map((phone) => <a key={phone.href} href={`tel:${phone.href}`}><Phone size={15} />{phone.number}</a>)}</div><div className="quote-aside-note"><ShieldCheck size={16} /><span>We’ll confirm route and service availability before booking.</span></div></div>
      <div className="quote-form-wrap">{submitted ? <div className="success-panel" role="status"><span className="success-icon"><Check size={24} /></span><span className="section-kicker">REQUEST RECEIVED</span><h2 className="display">Thank you for getting in touch.</h2><p>Your enquiry reference is <strong className="mono">{submitted.reference}</strong>. Our team can now review the details you shared. This is not a booking confirmation.</p><button className="button button-dark" onClick={() => { setSubmitted(null); setValues(initialLead); }} data-testid="button-new-enquiry">Send another enquiry <ArrowRight size={16} /></button></div> : <form className="quote-form" onSubmit={submit}>
        <div className="form-heading"><span className="mono">01 — YOUR DETAILS</span><span className="required-note">* Required fields</span></div>
        <div className="form-grid">{field('name', 'Your name', 'text', true, 'Name')} {field('phone', 'Phone number', 'tel', true, '+91')} {field('email', 'Email address', 'email', false, 'name@example.com')}</div>
        <div className="form-heading"><span className="mono">02 — THE MOVE</span></div>
        <div className="form-grid">{field('pickupLocation', 'Pickup location', 'text', true, 'Area, town or city')}{field('destination', 'Destination', 'text', true, 'Area, town or city')}{field('movingDate', 'Preferred moving date', 'date') }
          <label className="field"><span>Property type <b>*</b></span><select value={values.propertyType} required onChange={(e) => setField('propertyType', e.target.value)} data-testid="select-property-type"><option value="house">House</option><option value="apartment">Apartment</option><option value="office">Office</option><option value="other">Other</option></select></label></div>
        <fieldset className="services-field"><legend>What would you like information about? <b>*</b></legend><p>Select one or more; these are requests, not confirmed availability.</p><div className="service-checkboxes">{serviceOptions.map((service) => <label className={`service-check ${values.services.includes(service.value) ? 'checked' : ''}`} key={service.value}><input type="checkbox" checked={values.services.includes(service.value)} onChange={() => toggleService(service.value)} data-testid={`checkbox-service-${service.value}`} /><span className="check-box">{values.services.includes(service.value) && <Check size={13} />}</span>{service.label}</label>)}</div></fieldset>
        <label className="field"><span>Anything else we should know?</span><textarea rows={4} maxLength={3000} value={values.additionalDetails} onChange={(e) => setField('additionalDetails', e.target.value)} placeholder="Optional details about your move" data-testid="input-additional-details" /></label>
        <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => setField('website', e.target.value)} name="website" /></label>
        {formError && <p className="form-error" role="alert"><CircleAlert size={16} />{formError}</p>}
        <div className="form-submit-row"><button className="button button-gold submit-button" type="submit" disabled={createLead.isPending} data-testid="button-submit-quote">{createLead.isPending ? 'Sending request…' : 'Send quote request'}{!createLead.isPending && <ArrowUpRight size={17} />}</button><span>We’ll review your request and confirm route and service availability before booking.</span></div>
      </form>}</div>
    </section>
  </main></PublicPage>;
}

function ContactPage() {
  const title = 'Contact Almaluxe Packers & Movers | Thrissur';
  const description = 'Contact Almaluxe Packers & Movers by phone, email or at Perumbilavu, Thrissur, Kerala. Ask us to confirm your route and service.';
  return <PublicPage title={title} description={description}><main><PageHero label="CONTACT" title="Let’s talk about" accent="your next move." copy="Get in touch with our team in Thrissur. For a route or service enquiry, include where you’re moving from and to." />
    <section className="contact-page-content page-section"><div className="contact-intro"><span className="section-kicker">REACH ALMALUXE</span><h2 className="display">Choose how<br />to get in touch.</h2><p>For a moving enquiry, a quote request form helps us collect the details needed to check your route.</p><Link href="/quote" className="button button-dark">Request a quote <ArrowUpRight size={16} /></Link></div><div className="contact-details">
      <article className="contact-detail"><span className="detail-icon"><Phone size={20} /></span><div><span className="section-kicker">CALL US</span>{phones.map((p) => <a className="contact-value" href={`tel:${p.href}`} key={p.href} data-testid={`link-contact-phone-${p.href}`}>{p.number}</a>)}<small>Tap a number to call from your device.</small></div></article>
      <article className="contact-detail"><span className="detail-icon"><Mail size={20} /></span><div><span className="section-kicker">EMAIL</span><a className="contact-value contact-email" href={`mailto:${email}`} data-testid="link-contact-email">{email}</a><small>Include your pickup and destination in your message.</small></div></article>
      <article className="contact-detail"><span className="detail-icon"><MapPin size={20} /></span><div><span className="section-kicker">LOCATION</span><strong className="contact-value">{address}</strong><small>Thrissur is the primary service area; routes are confirmed individually.</small></div></article>
    </div></section>
  </main></PublicPage>;
}

function PrivacyPage() {
  const title = 'Privacy notice | Almaluxe Packers & Movers';
  const description = 'Privacy notice for moving enquiries submitted to Almaluxe Packers & Movers.';
  return <PublicPage title={title} description={description}><main><PageHero label="PRIVACY NOTICE" title="Your details," accent="used for your enquiry." copy="This notice explains the information requested by the moving enquiry form and why it is collected." />
    <section className="privacy-content page-section"><aside><span className="section-kicker">PRIVACY / ENQUIRIES</span><span className="mono">ALMALUXE · THRISSUR</span><span className="section-kicker privacy-aside-label">QUESTIONS?</span><a href={`mailto:${email}`}>{email}</a></aside><div className="privacy-article">
      <h2>Information you choose to share</h2><p>The enquiry form asks for your name, phone number, optional email address, pickup location, destination, preferred moving date, property type, requested service information and any additional details you provide.</p>
      <h2>Why we request it</h2><p>We use these details to receive and review your moving enquiry, contact you about it, and determine whether the specific route and requested service can be confirmed. A submission is not a booking.</p>
      <h2>Storage and integrations</h2><p>When enquiry storage is configured, form submissions are saved in MongoDB so the authorized team can review them. Optional Google Sheets, WhatsApp Business and Facebook or Instagram lead integrations are not active by default; the site does not send enquiries to those services unless the business separately configures them.</p>
      <h2>How to contact us</h2><p>For a question about information you have submitted, contact Almaluxe Packers & Movers at <a href={`mailto:${email}`}>{email}</a> or by phone at <a href="tel:+919447834071">+91 94478 34071</a>.</p>
      <h2>Availability and booking</h2><p>Submitting details does not mean a route or service is available. Thrissur is the primary service area, and each route and service request must be confirmed before booking.</p>
    </div></section>
  </main></PublicPage>;
}

function SignInPage() { return <div className="auth-page"><div className="auth-brand"><BrandMark /></div><div className="auth-shell"><div className="auth-side"><span className="section-kicker">ALMALUXE / LEAD DESK</span><h1 className="display">A calmer view<br />of every enquiry.</h1><p>Team access for managing moving requests.</p><div className="auth-mark display">A<span>.</span></div></div><div className="auth-card"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></div></div>; }
function SignUpPage() { return <div className="auth-page"><div className="auth-brand"><BrandMark /></div><div className="auth-shell"><div className="auth-side"><span className="section-kicker">ALMALUXE / LEAD DESK</span><h1 className="display">Make room<br />for clarity.</h1><p>Create an account to continue to the lead desk.</p><div className="auth-mark display">A<span>.</span></div></div><div className="auth-card"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></div></div>; }

const clerkAppearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#d7a700', colorForeground: '#29251e', colorMutedForeground: '#756f63', colorDanger: '#a64135', colorBackground: '#fbf9f2', colorInput: '#fffdf8', colorInputForeground: '#29251e', colorNeutral: '#ddd6c6', fontFamily: 'DM Sans, sans-serif', borderRadius: '0.65rem' },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf9f2] rounded-2xl w-[440px] max-w-full mx-auto overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#29251e] font-semibold', headerSubtitle: 'text-[#756f63]',
    socialButtonsBlockButtonText: 'text-[#29251e]', formFieldLabel: 'text-[#403b32]',
    footerActionLink: 'text-[#7c6000]', footerActionText: 'text-[#756f63]',
    dividerText: 'text-[#756f63]', identityPreviewEditButton: 'text-[#7c6000]',
    formFieldSuccessText: 'text-[#38664e]', alertText: 'text-[#8f342b]',
    logoBox: 'rounded-xl', logoImage: 'object-contain',
    socialButtonsBlockButton: 'border-[#ddd6c6] bg-[#fffdf8] hover:bg-[#f3efdf]',
    formButtonPrimary: 'bg-[#d7a700] text-[#29251e] hover:bg-[#e6b815]',
    formFieldInput: 'bg-[#fffdf8] border-[#ddd6c6] text-[#29251e]',
    footerAction: 'bg-transparent', dividerLine: 'bg-[#ddd6c6]',
    alert: 'bg-[#f7e7e2] border-[#e8c1b9]', otpCodeFieldInput: 'bg-[#fffdf8] border-[#ddd6c6]',
    formFieldRow: 'text-[#29251e]', main: 'text-[#29251e]',
  },
};

function ClerkRouter({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const stripBase = (path: string) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access the Almaluxe lead desk' } }, signUp: { start: { title: 'Create your account', subtitle: 'Continue to the Almaluxe lead desk' } } }}
    routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><ClerkQueryCacheInvalidator />{children}</ClerkProvider>;
}

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function AdminPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const [queryState, setQueryState] = useState({ search: '', status: '' as '' | LeadStatus, page: 1 });
  useEffect(() => setPageMeta('Lead desk | Almaluxe Packers & Movers', 'Private enquiry dashboard for Almaluxe Packers & Movers.'), []);
  const session = useGetAdminSession({ query: { queryKey: ['/api/admin/session'], enabled: isLoaded && Boolean(isSignedIn), retry: false } });
  if (!isLoaded) return <AdminLoading />;
  if (!isSignedIn) return <div className="admin-access"><div className="admin-access-card"><BrandMark /><span className="section-kicker">PRIVATE LEAD DESK</span><h1 className="display">Team access required.</h1><p>Sign in to continue. Admin access is checked separately after authentication.</p><Link href="/sign-in" className="button button-dark">Sign in <ArrowRight size={16} /></Link><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to public site</Link></div></div>;
  if (session.isLoading) return <AdminLoading />;
  if (session.isError || !session.data) return <AdminForbidden onRetry={() => session.refetch()} />;
  return <AdminDashboard name={session.data.name || session.data.email} search={queryState.search} status={queryState.status} page={queryState.page}
    onSearch={(search) => setQueryState((state) => ({ ...state, search, page: 1 }))} onStatus={(status) => setQueryState((state) => ({ ...state, status, page: 1 }))} onPage={(page) => setQueryState((state) => ({ ...state, page }))} onPublic={() => setLocation('/')} />;
}

function AdminForbidden({ onRetry }: { onRetry: () => void }) {
  const { signOut } = useClerk();
  return <div className="admin-access"><div className="admin-access-card"><BrandMark /><span className="access-denied-mark"><CircleAlert size={22} /></span><span className="section-kicker">ACCESS NOT AUTHORIZED</span><h1 className="display">This desk is restricted.</h1><p>Your account is signed in, but the admin session endpoint did not grant access. An authenticated account is not automatically an administrator.</p><button className="button button-dark" onClick={onRetry} data-testid="button-recheck-admin">Check access again <ArrowRight size={16} /></button><button className="signout-link" onClick={() => void signOut({ redirectUrl: basePath || '/' })}>Sign out</button><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to public site</Link></div></div>;
}

function AdminLoading() {
  return <div className="admin-loading"><div className="admin-skeleton-head" /><div className="admin-skeleton-row" /><div className="admin-skeleton-row" /><div className="admin-skeleton-table" /></div>;
}

function AdminDashboard({ name, search, status, page, onSearch, onStatus, onPage, onPublic }: { name: string; search: string; status: '' | LeadStatus; page: number; onSearch: (search: string) => void; onStatus: (status: '' | LeadStatus) => void; onPage: (page: number) => void; onPublic: () => void }) {
  const queryClient = useQueryClient();
  const params = useMemo(() => ({ search: search || undefined, status: status || undefined, page, pageSize: 10 }), [search, status, page]);
  const summary = useGetLeadSummary({ query: { queryKey: getGetLeadSummaryQueryKey() } });
  const list = useListLeads(params, { query: { queryKey: getListLeadsQueryKey(params) } });
  const update = useUpdateLead({ mutation: { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() }); void queryClient.invalidateQueries({ queryKey: getGetLeadSummaryQueryKey() }); } } });
  const exportQuery = useExportLeads({ query: { enabled: false, queryKey: getExportLeadsQueryKey(), retry: false } });
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { signOut } = useClerk();
  const handleExport = async () => {
    setMessage('');
    try {
      const result = await exportQuery.refetch();
      if (!result.data) throw new Error('No export data');
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `almaluxe-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      void queryClient.invalidateQueries({ queryKey: getExportLeadsQueryKey() });
    } catch { setMessage('Export could not be prepared. Please try again.'); }
  };
  const changeStatus = (lead: Lead, next: LeadStatus) => update.mutate({ id: lead.id, data: { status: next } }, { onError: () => setMessage('Status update failed. Please retry.') });
  const saveNotes = (lead: Lead) => {
    const current = notes[lead.id] ?? lead.internalNotes ?? '';
    if (current === lead.internalNotes) return;
    update.mutate({ id: lead.id, data: { internalNotes: current } }, { onSuccess: () => setMessage('Internal note saved.'), onError: () => setMessage('Note could not be saved. Please retry.') });
  };
  const loading = summary.isLoading || list.isLoading;
  const pageCount = Math.max(1, Math.ceil((list.data?.total || 0) / (list.data?.pageSize || 10)));
  return <div className="admin-shell">
    <aside className="admin-sidebar"><BrandMark /><div className="admin-nav-section"><span className="admin-nav-label">WORKSPACE</span><button className="admin-nav-item active"><span className="admin-nav-icon"><Mail size={17} /></span>Enquiries<span className="nav-current-dot" /></button></div><div className="admin-sidebar-bottom"><div className="sidebar-user"><span className="user-avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>Administrator</small></div></div><button onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="sidebar-signout" data-testid="button-admin-signout">Sign out <ArrowUpRight size={14} /></button><button onClick={onPublic} className="sidebar-public" data-testid="button-view-public">View public site <ArrowUpRight size={14} /></button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><span className="mono admin-breadcrumb">ALMALUXE / ENQUIRIES</span><h1 className="display">Lead desk</h1></div><div className="admin-top-actions"><span className="admin-live"><i /> PRIVATE WORKSPACE</span><button className="button button-outline" onClick={handleExport} disabled={exportQuery.isFetching} data-testid="button-export-csv"><FileDown size={16} />{exportQuery.isFetching ? 'Preparing…' : 'Export CSV'}</button></div></header>
      <div className="admin-content">
        {message && <div className="admin-message" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage('')}><X size={14} /></button></div>}
        {summary.isError && <div className="admin-message summary-error" role="alert">Summary counts could not be refreshed.<button onClick={() => summary.refetch()} data-testid="button-retry-summary">Retry</button></div>}
        <section className="summary-grid" aria-label="Enquiry summary">
          <article className="summary-card summary-total"><span className="summary-label">ALL ENQUIRIES</span>{loading ? <div className="summary-skeleton" /> : <><strong>{summary.data?.total ?? 0}</strong><span className="summary-foot">Recorded requests</span></>}</article>
          <article className="summary-card"><span className="summary-label">NEW TODAY</span>{loading ? <div className="summary-skeleton" /> : <><strong>{summary.data?.newToday ?? 0}</strong><span className="summary-foot">Received today</span></>}</article>
          <article className="summary-status-card"><div><span className="summary-label">BY STATUS</span><div className="status-counts">{statusOptions.map((item) => <button key={item} onClick={() => onStatus(status === item ? '' : item)} className={`status-count ${status === item ? 'status-count-active' : ''}`} data-testid={`filter-status-${item}`}><span className={`status-dot status-${item}`} /><span>{item}</span><strong>{loading ? '—' : summary.data?.byStatus.find((row) => row.status === item)?.count ?? 0}</strong></button>)}</div></div></article>
        </section>
        <section className="lead-panel"><div className="lead-panel-heading"><div><span className="section-kicker">INCOMING REQUESTS</span><h2 className="display">Enquiry inbox</h2></div><span className="lead-total mono">{list.data?.total ?? 0} RECORDS</span></div>
          <div className="lead-filters"><label className="search-box"><span className="sr-only">Search enquiries</span><input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search name, phone or location" data-testid="input-search-leads" /><span className="search-symbol">⌕</span></label><label className="filter-select"><span className="sr-only">Filter by status</span><select value={status} onChange={(e) => onStatus(e.target.value as '' | LeadStatus)} data-testid="select-filter-status"><option value="">All statuses</option>{statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select><ChevronDown size={15} /></label></div>
          {list.isError ? <div className="admin-state"><CircleAlert size={22} /><h3>Enquiries couldn’t load.</h3><p>Try refreshing the list.</p><button className="button button-dark" onClick={() => list.refetch()} data-testid="button-retry-leads">Retry <ArrowRight size={15} /></button></div> : list.isLoading ? <div className="lead-loading">{[1, 2, 3].map((i) => <div key={i} className="lead-skeleton" />)}</div> : list.data?.items.length ? <div className="lead-list">
            {list.data.items.map((lead) => <LeadRow key={lead.id} lead={lead} note={notes[lead.id] ?? lead.internalNotes ?? ''} onNote={(value) => setNotes((all) => ({ ...all, [lead.id]: value }))} onSave={() => saveNotes(lead)} onStatus={(next) => changeStatus(lead, next)} disabled={update.isPending} />)}
          </div> : <div className="admin-state empty-state"><span className="empty-mark"><Mail size={22} /></span><h3>No enquiries here yet.</h3><p>New quote requests will appear in this space.</p>{(search || status) && <button className="underlined-link" onClick={() => { onSearch(''); onStatus(''); }}>Clear filters <X size={14} /></button>}</div>}
          <div className="lead-pagination"><span>Showing {list.data?.items.length ? (page - 1) * (list.data?.pageSize || 10) + 1 : 0}–{Math.min(page * (list.data?.pageSize || 10), list.data?.total || 0)} of {list.data?.total || 0}</span><div><button aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} data-testid="button-page-prev"><ChevronLeft size={17} /></button><span className="mono">{page} / {pageCount}</span><button aria-label="Next page" disabled={page >= pageCount} onClick={() => onPage(page + 1)} data-testid="button-page-next"><ChevronRight size={17} /></button></div></div>
        </section>
        <p className="admin-footer-note"><ShieldCheck size={14} /> Enquiry details are visible only in this admin area. Service and route availability must be confirmed before booking.</p>
      </div>
    </main>
  </div>;
}

function LeadRow({ lead, note, onNote, onSave, onStatus, disabled }: { lead: Lead; note: string; onNote: (value: string) => void; onSave: () => void; onStatus: (status: LeadStatus) => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return <article className="lead-card" data-testid={`card-lead-${lead.id}`}>
    <button className="lead-summary" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} data-testid={`button-expand-lead-${lead.id}`}>
      <span className="lead-date mono">{new Date(lead.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span><span className="lead-main-info"><strong>{lead.name}</strong><span>{lead.pickupLocation} <ArrowRight size={12} /> {lead.destination}</span></span><span className="lead-phone">{lead.phone}</span><span className={`lead-status-pill status-${lead.status}`}><i />{lead.status}</span><ChevronDown className={`lead-chevron ${expanded ? 'expanded' : ''}`} size={17} />
    </button>
    {expanded && <div className="lead-expanded">
      <div className="lead-info-grid"><div><span className="admin-label">EMAIL</span><span>{lead.email || 'Not provided'}</span></div><div><span className="admin-label">MOVING DATE</span><span>{lead.movingDate || 'Not specified'}</span></div><div><span className="admin-label">PROPERTY</span><span>{lead.propertyType}</span></div><div><span className="admin-label">SOURCE</span><span>{lead.source}</span></div></div>
      <div className="lead-service-chips">{lead.services.map((service) => <span key={service}>{serviceOptions.find((item) => item.value === service)?.label || service}</span>)}</div>
      {lead.additionalDetails && <p className="lead-detail-text">{lead.additionalDetails}</p>}
      <div className="lead-actions"><label><span className="admin-label">STATUS</span><select value={lead.status} disabled={disabled} onChange={(e) => onStatus(e.target.value as LeadStatus)} data-testid={`select-lead-status-${lead.id}`}>{statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></label><label className="internal-note"><span className="admin-label">INTERNAL NOTE</span><textarea value={note} maxLength={5000} rows={2} placeholder="Add a private note…" onChange={(e) => onNote(e.target.value)} onBlur={onSave} data-testid={`textarea-note-${lead.id}`} /></label><a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} className="button button-dark lead-call"><Phone size={14} /> Call</a></div>
    </div>}
  </article>;
}

function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function SiteRoutes() {
  return <Switch>
    <Route path="/" component={HomePage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/services" component={ServicesPage} />
    <Route path="/areas" component={AreasPage} />
    <Route path="/quote" component={QuotePage} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/privacy" component={PrivacyPage} />
    <Route path="/admin" component={AdminPage} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}><RouteErrorBoundary><ClerkRouter><SiteRoutes /></ClerkRouter></RouteErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
