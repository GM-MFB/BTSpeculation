import { Link } from "react-router-dom";

export default function Overview() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white">
      <div className="max-w-lg w-full p-8 rounded-xl bg-white/3">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <p className="text-sm text-white/80 mb-6">
          This is the Overview page. Add your summary content here.
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-md border border-white/12 text-sm font-medium"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
