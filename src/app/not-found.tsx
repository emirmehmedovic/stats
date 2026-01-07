import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 p-8">
      <div className="max-w-lg w-full text-center bg-white rounded-3xl shadow-soft-lg p-10 border border-dark-100">
        <h1 className="text-3xl font-bold text-dark-900 mb-3">Stranica nije pronađena</h1>
        <p className="text-dark-500 mb-6">
          Link koji ste otvorili ne postoji ili je premješten.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-dark-900 text-white font-semibold hover:bg-dark-800 transition-colors"
        >
          Povratak na dashboard
        </Link>
      </div>
    </div>
  );
}
