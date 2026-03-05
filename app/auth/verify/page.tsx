export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">📬</div>
        <h2 className="font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-500">
          A sign-in link has been sent to your email address. Click it to access
          your dashboard. The link expires in 24 hours.
        </p>
      </div>
    </div>
  );
}
