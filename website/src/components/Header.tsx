import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { IconPulse } from './IconPulse';
import { Button } from './ui/Button';
import { getDemoUrl, getLoginUrl, getSignupUrl } from '../config/app';

const NAV_LINKS = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Planos', href: '#planos' },
  { label: 'Resultados', href: '#resultados' },
  { label: 'FAQ', href: '#faq' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-border bg-white/88 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]'
          : 'border-transparent bg-white/72 backdrop-blur-lg'
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="relative flex h-[4.5rem] items-center justify-between md:h-20">
          <a href="#main-content" className="flex items-center gap-3 hover-scale-subtle">
            <IconPulse size={36} className="shrink-0" />
            <span className="text-lg font-bold text-dark tracking-tight">
              Fit Insight
            </span>
          </a>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link-underline text-body-sm font-medium text-content-muted hover:text-dark transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={getDemoUrl()}
              className="nav-link-underline text-body-sm font-medium text-content-muted hover:text-dark transition-colors"
            >
              Agendar demo
            </a>
            <a
              href={getLoginUrl()}
              className="nav-link-underline text-body-sm font-medium text-content-muted hover:text-dark transition-colors"
            >
              Entrar
            </a>
            <Button href={getSignupUrl()} variant="dark" size="sm" icon>
              Testar grátis
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-content-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white/96 backdrop-blur-xl md:hidden" id="mobile-menu" role="dialog" aria-label="Menu de navegação">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
            <div className="space-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-xl px-3 text-sm font-medium text-content-muted transition-colors hover:bg-slate-50 hover:text-dark"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <a
                href={getDemoUrl()}
                className="flex min-h-[48px] items-center rounded-xl px-3 text-sm font-medium text-content-muted transition-colors hover:bg-slate-50 hover:text-dark"
              >
                Agendar demo
              </a>
              <a
                href={getLoginUrl()}
                className="flex min-h-[48px] items-center rounded-xl px-3 text-sm font-medium text-content-muted transition-colors hover:bg-slate-50 hover:text-dark"
              >
                Entrar
              </a>
              <Button href={getSignupUrl()} variant="dark" size="md" className="mt-3 w-full">
                Testar grátis
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
