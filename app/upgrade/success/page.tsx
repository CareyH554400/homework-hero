import Link from "next/link";

export default function UpgradeSuccessPage() {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">You&apos;re Premium!</h1>
      <p className="text-slate-500 mb-8">
        Thank you for upgrading. Your account now has full access to all premium features —
        time estimation and calendar feed import are unlocked.
      </p>
      <div className="space-y-3">
        <Link
          href="/today"
          className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Today&apos;s Plan
        </Link>
        <Link
          href="/settings"
          className="block w-full bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Set Up Calendar Feeds
        </Link>
      </div>
    </div>
  );
}
