'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Languages, ChevronDown, LifeBuoy, Mail, Send,
  AtSign, Music2, Hash, PlayCircle, ShieldCheck, FileText,
} from 'lucide-react'
import LegalFooter from '@/components/legal/LegalFooter'
import type { Lang } from '@/components/legal/content'

// ─── Bilingual content ──────────────────────────────────────────────────────────

interface Faq { q: string; a: string }

const COPY: Record<Lang, {
  title: string
  subtitle: string
  back: string
  faqTitle: string
  faqs: Faq[]
  contactTitle: string
  contactDesc: string
  name: string
  email: string
  subject: string
  message: string
  send: string
  legalTitle: string
  termsLink: string
  privacyLink: string
  socialTitle: string
}> = {
  fr: {
    title: "Centre d'Aide",
    subtitle: 'Trouvez des réponses ou contactez notre équipe.',
    back: 'Retour',
    faqTitle: 'Questions fréquentes',
    faqs: [
      { q: 'Comment créer un compte ?', a: "Appuyez sur l'icône de profil, puis « S'inscrire ». Renseignez votre e-mail et un mot de passe, ou utilisez une connexion rapide. Complétez ensuite votre profil pour gagner vos premiers Pulse Points." },
      { q: 'Comment acheter un ticket ?', a: "Ouvrez la page d'un événement, choisissez votre type de billet et suivez le moyen de paiement proposé par l'organisateur (Wave, Orange Money, PayPal, carte ou sur place). Votre QR code apparaît ensuite dans « Mes Billets » et vous est envoyé sur WhatsApp." },
      { q: 'Comment devenir organisateur ?', a: "Rendez-vous dans l'espace Entreprise et suivez l'onboarding. Choisissez la formule Basic (gratuit), Pro ou Premium selon vos besoins. Vous pourrez alors publier des événements et, selon la formule, vendre des billets." },
      { q: 'Comment fonctionnent les Pulse Points ?', a: "Vous gagnez des points en utilisant VYBZ : ouvrir l'app, sauvegarder un événement, faire un check-in, laisser un avis, acheter un billet, etc. Les points débloquent des paliers (Neon, Gold, Diamond) et des récompenses." },
      { q: 'Comment signaler un problème ?', a: "Utilisez le formulaire de contact ci-dessous ou écrivez à hello@amdylabs.com en décrivant le problème. Ajoutez une capture d'écran si possible pour un traitement plus rapide." },
      { q: 'Comment supprimer mon compte ?', a: "Envoyez une demande à hello@amdylabs.com depuis l'adresse e-mail de votre compte. Vos données seront effacées ou anonymisées sous 30 jours, conformément à notre Politique de Confidentialité." },
      { q: 'Comment contacter un organisateur ?', a: "Depuis la page de l'événement ou la page de l'organisateur, utilisez le bouton de contact (WhatsApp ou messagerie VYBZ). Les questions de paiement et de remboursement relèvent directement de l'organisateur." },
      { q: 'Politique de remboursement', a: "VYBZ ne gère pas les paiements de billets : les remboursements sont assurés par l'organisateur selon sa propre politique, indiquée sur la page de l'événement. Contactez l'organisateur pour toute demande de remboursement." },
    ],
    contactTitle: 'Nous contacter',
    contactDesc: 'Une question ? Écrivez-nous, nous répondons rapidement.',
    name: 'Nom',
    email: 'E-mail',
    subject: 'Sujet',
    message: 'Message',
    send: 'Envoyer le message',
    legalTitle: 'Informations légales',
    termsLink: "Conditions d'utilisation",
    privacyLink: 'Politique de confidentialité',
    socialTitle: 'Suivez-nous',
  },
  en: {
    title: 'Help Center',
    subtitle: 'Find answers or get in touch with our team.',
    back: 'Back',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'How do I create an account?', a: "Tap the profile icon, then “Sign up”. Enter your email and a password, or use a quick sign-in. Then complete your profile to earn your first Pulse Points." },
      { q: 'How do I buy a ticket?', a: "Open an event page, choose your ticket type and follow the payment method offered by the organizer (Wave, Orange Money, PayPal, card or cash on arrival). Your QR code then appears under “My Tickets” and is sent to you on WhatsApp." },
      { q: 'How do I become an organizer?', a: "Go to the Enterprise area and follow the onboarding. Choose the Basic (free), Pro or Premium plan based on your needs. You can then publish events and, depending on the plan, sell tickets." },
      { q: 'How do Pulse Points work?', a: "You earn points by using VYBZ: opening the app, saving an event, checking in, leaving a review, buying a ticket and more. Points unlock tiers (Neon, Gold, Diamond) and rewards." },
      { q: 'How do I report a problem?', a: "Use the contact form below or email hello@amdylabs.com describing the issue. Add a screenshot if possible for faster handling." },
      { q: 'How do I delete my account?', a: "Send a request to hello@amdylabs.com from your account email address. Your data will be erased or anonymized within 30 days, in line with our Privacy Policy." },
      { q: 'How do I contact an organizer?', a: "From the event page or organizer page, use the contact button (WhatsApp or VYBZ messaging). Payment and refund questions are handled directly by the organizer." },
      { q: 'Refund policy', a: "VYBZ does not handle ticket payments: refunds are provided by the organizer according to their own policy, shown on the event page. Contact the organizer for any refund request." },
    ],
    contactTitle: 'Contact us',
    contactDesc: 'Have a question? Write to us, we reply quickly.',
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    send: 'Send message',
    legalTitle: 'Legal information',
    termsLink: 'Terms of Use',
    privacyLink: 'Privacy Policy',
    socialTitle: 'Follow us',
  },
}

const SOCIALS = [
  { icon: AtSign,     label: 'Instagram', href: 'https://instagram.com/vybz.city' },
  { icon: Music2,     label: 'TikTok',    href: 'https://tiktok.com/@vybz.city' },
  { icon: Hash,       label: 'X',         href: 'https://x.com/vybzcity' },
  { icon: PlayCircle, label: 'YouTube',   href: 'https://youtube.com/@vybzcity' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [open, setOpen] = useState<number | null>(0)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  useEffect(() => {
    const saved = window.localStorage.getItem('vybz_lang')
    if (saved === 'fr' || saved === 'en') setLang(saved)
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    window.localStorage.setItem('vybz_lang', next)
  }

  const t = COPY[lang]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(form.subject || 'VYBZ — Support')
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`
    )
    window.location.href = `mailto:hello@amdylabs.com?subject=${subject}&body=${body}`
  }

  const inputCls =
    'w-full bg-zinc-900 border border-purple-900/30 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors'

  return (
    <div className="min-h-screen bg-[#08080F] px-4 py-6">
      <div className="max-w-2xl mx-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center">
            <Image src="/vybz-logo.webp" alt="VYBZ" width={48} height={48} className="h-12 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Changer de langue"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.back}
            </Link>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {t.title}
          </h1>
        </div>
        <p className="text-zinc-400 text-sm mb-8">{t.subtitle}</p>

        {/* ── FAQ ── */}
        <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          {t.faqTitle}
        </h2>
        <div className="space-y-2.5 mb-12">
          {t.faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="bg-zinc-900 border border-purple-900/30 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-white text-sm font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-fuchsia-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Contact form ── */}
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          <Mail className="w-4 h-4 text-fuchsia-400" />
          {t.contactTitle}
        </h2>
        <p className="text-zinc-400 text-sm mb-4">{t.contactDesc}</p>
        <form onSubmit={handleSubmit} className="space-y-3 mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.name} className={inputCls}
            />
            <input
              required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t.email} className={inputCls}
            />
          </div>
          <input
            value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={t.subject} className={inputCls}
          />
          <textarea
            required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={t.message} className={`${inputCls} resize-none`}
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Send className="w-4 h-4" />
            {t.send}
          </button>
          <p className="text-center text-zinc-600 text-xs">hello@amdylabs.com</p>
        </form>

        {/* ── Legal links ── */}
        <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          {t.legalTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-12">
          <Link
            href="/legal/terms"
            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-purple-900/30 hover:border-fuchsia-500/30 transition-all"
          >
            <FileText className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span className="text-white/90 text-sm font-medium">{t.termsLink}</span>
          </Link>
          <Link
            href="/legal/privacy"
            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-purple-900/30 hover:border-fuchsia-500/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span className="text-white/90 text-sm font-medium">{t.privacyLink}</span>
          </Link>
        </div>

        {/* ── Social ── */}
        <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          {t.socialTitle}
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {SOCIALS.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-2 px-4 h-11 rounded-full bg-zinc-900 border border-purple-900/30 text-white/70 text-sm font-semibold hover:text-white hover:border-fuchsia-500/40 active:scale-95 transition-all"
            >
              <Icon className="w-4 h-4 text-fuchsia-400" />
              {label}
            </a>
          ))}
        </div>

        <LegalFooter lang={lang} />
      </div>
    </div>
  )
}
