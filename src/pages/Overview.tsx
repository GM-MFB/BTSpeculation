import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Overview() {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingEquity, setAddingEquity] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    shares: "",
    average_cost: "",
    current_price: "",
  });

  // Optional fallback current prices (used if equity doesn't include `current_price`)
  const [currentPrices] = useState<Record<string, number>>({
    HIMS: 39.5,
    BROS: 59.2,
    SMCI: 37.5,
  });

  useEffect(() => {
    fetch("/db.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setDb(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));

    // Detect localhost
    setIsLocalhost(
      window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    );
  }, []);

  const equities: any[] = db?.Equities ?? [];

  const enrichedEquities = useMemo(() => {
    const mapped = equities.map((e: any) => {
      const shares = Number(e.shares) || 0;
      const avg = Number(e.average_cost) || 0;
      const price =
        Number(e.current_price ?? currentPrices[e.symbol] ?? e.price ?? avg) ||
        0;
      const value = shares * price;
      const pnl = shares * (price - avg);
      const pnlPercent = avg !== 0 ? ((price - avg) / avg) * 100 : 0;
      return { ...e, shares, avg, price, value, pnl, pnlPercent };
    });

    // Sort alphabetically by name (fallback to symbol), case-insensitive
    return mapped.sort((a: any, b: any) => {
      const an = String(a.name ?? a.symbol ?? "").toLowerCase();
      const bn = String(b.name ?? b.symbol ?? "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
  }, [equities, currentPrices]);

  // Columns: start with 1; if a single-column layout causes the page to overflow vertically,
  // switch to 2 columns (desktop only). On mobile (below `sm`), always use 1 column.
  const [columns, setColumns] = useState<number>(1);
  const measureTimer = useRef<number | null>(null);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 640; // Tailwind `sm` breakpoint
      if (isMobile) {
        setColumns(1);
        return;
      }

      // Start with 1-column layout, then measure. If page height exceeds viewport, switch to 2.
      setColumns(1);
      // wait for paint
      if (measureTimer.current)
        window.cancelAnimationFrame(measureTimer.current);
      measureTimer.current = window.requestAnimationFrame(() => {
        const overflow =
          document.documentElement.scrollHeight > window.innerHeight;
        setColumns(overflow ? 2 : 1);
      });
    };

    check();
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
      if (measureTimer.current)
        window.cancelAnimationFrame(measureTimer.current);
    };
  }, [enrichedEquities, db, loading]);

  const marketValue = useMemo(() => {
    return enrichedEquities.reduce(
      (sum: number, e: any) => sum + (e.value || 0),
      0
    );
  }, [enrichedEquities]);

  const totalValue = useMemo(() => {
    const candidates = [
      db?.account?.balance,
      db?.total,
      db?.account_total,
      db?.Account?.total,
      db?.account?.total,
      db?.totals?.account,
      db?.AccountBalance,
    ];
    const found = candidates.find((c) => typeof c === "number");
    return typeof found === "number" ? found : marketValue;
  }, [db, marketValue]);

  const cash = totalValue - marketValue;

  const totalPnl = useMemo(() => {
    return enrichedEquities.reduce(
      (sum: number, e: any) => sum + (e.pnl || 0),
      0
    );
  }, [enrichedEquities]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  const handleAddEquity = async () => {
    if (
      !formData.name ||
      !formData.symbol ||
      !formData.shares ||
      !formData.average_cost
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setAddingEquity(true);
    try {
      const response = await fetch("http://localhost:3001/Equities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          symbol: formData.symbol,
          shares: Number(formData.shares),
          average_cost: Number(formData.average_cost),
          current_price: formData.current_price
            ? Number(formData.current_price)
            : undefined,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      // Refresh the data
      const dbRes = await fetch("/db.json");
      const updatedDb = await dbRes.json();
      setDb(updatedDb);

      setFormData({
        name: "",
        symbol: "",
        shares: "",
        average_cost: "",
        current_price: "",
      });
      setShowAddModal(false);
    } catch (err) {
      alert(`Error adding equity: ${err}`);
    } finally {
      setAddingEquity(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!newBalance) {
      alert("Please enter a balance amount");
      return;
    }

    setUpdatingBalance(true);
    try {
      // PATCH the account resource at /account/1
      const response = await fetch("http://localhost:3001/account/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: Number(newBalance) }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      // Refresh the data
      const dbRes = await fetch("/db.json");
      const refreshedDb = await dbRes.json();
      setDb(refreshedDb);

      setNewBalance("");
      setShowBalanceModal(false);
    } catch (err) {
      alert(`Error updating balance: ${err}`);
    } finally {
      setUpdatingBalance(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-white p-6">
      <div className="max-w-3xl w-full p-8 rounded-2xl bg-linear-to-br from-white/3 to-white/2 backdrop-blur-sm border border-white/6 shadow-xl">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-1">Overview</h2>
            <p className="text-sm text-white/80">
              Account summary and holdings
            </p>
          </div>
          <div className="flex gap-2">
            {isLocalhost && (
              <>
                <button
                  onClick={() => setShowBalanceModal(true)}
                  className="px-3 py-1.5 rounded-md border border-blue-500 text-sm font-medium text-blue-300 hover:bg-blue-500/10 transition"
                >
                  Update Balance
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 rounded-md border border-green-500 text-sm font-medium text-green-300 hover:bg-green-500/10 transition"
                >
                  + Add Equity
                </button>
              </>
            )}
            <Link
              to="/"
              className="inline-block px-3 py-1.5 rounded-md border border-white/12 text-sm font-medium"
            >
              Back
            </Link>
          </div>
        </div>

        {loading && <p className="text-sm text-white/80 mb-4">Loading data…</p>}
        {error && (
          <p className="text-sm text-red-400 mb-4">
            Error loading data: {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between bg-linear-to-r from-indigo-600 to-violet-600 p-5 rounded-xl text-white shadow-md">
                <div>
                  <p className="text-xs uppercase opacity-90">Total Account</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(totalValue)}
                  </p>
                  <div className="mt-2 flex items-center gap-6 text-sm opacity-90">
                    <div>
                      <p className="text-xs">Market Value</p>
                      <p className="font-medium">
                        {formatCurrency(marketValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs">Cash</p>
                      <p
                        className={`font-medium ${
                          cash >= 0 ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {formatCurrency(cash)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs">Total P&L</p>
                      <p
                        className={`font-medium ${
                          totalPnl >= 0 ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {totalPnl >= 0 ? "+" : ""}
                        {formatCurrency(totalPnl)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={
                columns === 2
                  ? "grid grid-cols-2 gap-4"
                  : "grid grid-cols-1 gap-4"
              }
            >
              {enrichedEquities.length === 0 ? (
                <div className="p-4 rounded-lg bg-white/3 text-white/80">
                  No holdings available.
                </div>
              ) : (
                enrichedEquities.map((equity: any) => (
                  <div
                    key={equity.symbol}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-white/4 border border-white/6"
                  >
                    <div className="w-full">
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-lg font-semibold">{equity.name}</h3>
                        <span className="text-xs text-white/70">
                          {equity.symbol}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mt-1">
                        Shares:{" "}
                        <span className="font-medium text-white">
                          {equity.shares}
                        </span>
                      </p>
                      <p className="text-sm text-white/70">
                        Avg Cost:{" "}
                        <span className="font-medium text-white">
                          {formatCurrency(equity.avg)}
                        </span>
                      </p>
                      <p className="text-sm text-white/70">
                        Current Price:{" "}
                        <span className="font-medium text-white">
                          {formatCurrency(equity.price)}
                        </span>
                      </p>
                    </div>
                    <div className="w-full sm:w-auto text-left sm:text-right mt-3 sm:mt-0">
                      <p className="text-sm text-white/70">Market Value</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(equity.value)}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          equity.pnl >= 0 ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {equity.pnl >= 0 ? "+" : ""}
                        {formatCurrency(equity.pnl)} (
                        {equity.pnlPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Add Equity Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-sm w-full border border-white/10">
              <h3 className="text-xl font-semibold mb-4">Add New Equity</h3>
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
                <input
                  type="text"
                  placeholder="Symbol"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
                <input
                  type="number"
                  placeholder="Shares"
                  value={formData.shares}
                  onChange={(e) =>
                    setFormData({ ...formData, shares: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
                <input
                  type="number"
                  placeholder="Average Cost"
                  value={formData.average_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, average_cost: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
                <input
                  type="number"
                  placeholder="Current Price (optional)"
                  value={formData.current_price}
                  onChange={(e) =>
                    setFormData({ ...formData, current_price: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded border border-white/20 text-sm font-medium hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEquity}
                  disabled={addingEquity}
                  className="px-4 py-2 rounded bg-green-600 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {addingEquity ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Balance Modal */}
        {showBalanceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-sm w-full border border-white/10">
              <h3 className="text-xl font-semibold mb-4">
                Update Account Balance
              </h3>
              <p className="text-sm text-white/70 mb-4">
                Current Balance: {formatCurrency(totalValue)}
              </p>
              <div className="mb-6">
                <input
                  type="number"
                  placeholder="New Balance"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-2 rounded border border-white/20 text-sm font-medium hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBalance}
                  disabled={updatingBalance}
                  className="px-4 py-2 rounded bg-blue-600 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {updatingBalance ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
