'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  positionType: string;
  message: string;
}

const initialFormData: FormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  positionType: '',
  message: '',
};

const positionTypes = [
  'Veliki zidni format',
  'Totem i vertikalni format',
  'Digitalni ekrani',
  'Kombinacija formata',
  'Nisam siguran/na',
];

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitStatus('success');
    setFormData(initialFormData);
    setIsSubmitting(false);
  };

  const inputClass = `
    w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-dark-200 bg-white
    text-sm text-dark-900 placeholder:text-dark-400
    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
    transition-all
  `;

  const labelClass = 'block text-xs sm:text-sm font-semibold text-dark-700 mb-1.5 sm:mb-2';

  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-4 sm:mb-5">
          <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-dark-900 mb-2">
          Upit uspješno poslan!
        </h3>
        <p className="text-xs sm:text-sm text-dark-500 mb-5 sm:mb-6 max-w-sm">
          Hvala vam na interesovanju. Naš tim će vas kontaktirati u najkraćem mogućem roku.
        </p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
        >
          Pošalji novi upit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-dark-900 mb-1">Pošaljite upit</h3>
        <p className="text-xs sm:text-sm text-dark-500">Javit ćemo vam se u najkraćem roku</p>
      </div>

      {submitStatus === 'error' && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-700">
            Došlo je do greške. Molimo pokušajte ponovo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Ime i prezime <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Vaše ime"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="company" className={labelClass}>
            Kompanija <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            required
            value={formData.company}
            onChange={handleChange}
            placeholder="Naziv kompanije"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="vas@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Telefon
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+387 ..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="positionType" className={labelClass}>
          Vrsta reklamne pozicije
        </label>
        <select
          id="positionType"
          name="positionType"
          value={formData.positionType}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Odaberite...</option>
          {positionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Poruka
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          placeholder="Opišite vašu ideju..."
          className={`${inputClass} h-auto py-2.5 sm:py-3 resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full h-11 sm:h-12 flex items-center justify-center gap-2
          bg-primary-600 text-white text-sm font-semibold rounded-xl
          hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-all shadow-soft
        `}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Slanje...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Pošaljite upit
          </>
        )}
      </button>

      <p className="text-[10px] sm:text-xs text-dark-400 text-center">
        Slanjem ovog upita prihvatate našu politiku privatnosti.
      </p>
    </form>
  );
}
