import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Logo from "../components/ui/Logo";
import Loader from "../components/ui/Loader";

const TABS = ["All Coins", "Top Gainers", "New Listings"];

const CryptoTable = ({ coins, loading }) => {
  if (loading) return <Loader fullScreen={false} />;

  if (!coins.length) {
    return <p className="text-gray-500 py-4">No crypto data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-200">
            <th className="text-left py-3 pr-4 font-semibold">Asset</th>
            <th className="text-right py-3 pr-4 font-semibold">Price</th>
            <th className="text-right py-3 font-semibold">24h Change</th>
          </tr>
        </thead>

        <tbody>
          {coins.map((coin) => (
            <tr
              key={coin._id || coin.symbol}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  {coin.image ? (
                    <img
                      src={coin.image}
                      alt={coin.symbol}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                      {coin.symbol?.[0] || "?"}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{coin.name}</p>
                    <p className="text-xs text-gray-400 uppercase">
                      {coin.symbol}
                    </p>
                  </div>
                </div>
              </td>

              <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                $
                {Number(coin.price || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </td>

              <td
                className={`py-3 text-right font-semibold ${
                  (coin.change24h ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(coin.change24h ?? 0) >= 0 ? "+" : ""}
                {Number(coin.change24h ?? 0).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AddCryptoForm = ({ onAdded }) => {
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    price: "",
    image: "",
    change24h: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      symbol: form.symbol.trim().toUpperCase(),
      price: parseFloat(form.price),
      image: form.image.trim() || undefined,
      change24h: form.change24h !== "" ? parseFloat(form.change24h) : 0,
    };

    try {
      const { data } = await api.post("/crypto", payload);
      const newCoin = data.coin ?? data.crypto ?? data;

      setForm({
        name: "",
        symbol: "",
        price: "",
        image: "",
        change24h: "",
      });

      onAdded(newCoin);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || "Failed to add crypto.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:border-blue-600 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className={inputClass}
          placeholder="Name e.g. Bitcoin"
          value={form.name}
          onChange={updateForm("name")}
          required
        />

        <input
          className={inputClass}
          placeholder="Symbol e.g. BTC"
          value={form.symbol}
          onChange={updateForm("symbol")}
          required
        />

        <input
          className={inputClass}
          type="number"
          step="any"
          min="0"
          placeholder="Price e.g. 60000"
          value={form.price}
          onChange={updateForm("price")}
          required
        />

        <input
          className={inputClass}
          type="number"
          step="any"
          placeholder="24h Change e.g. 2.5"
          value={form.change24h}
          onChange={updateForm("change24h")}
        />
      </div>

      <input
        className={inputClass}
        placeholder="Image URL"
        value={form.image}
        onChange={updateForm("image")}
      />

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold text-sm transition-colors mt-1"
      >
        {loading ? "Adding…" : "Add New Coin"}
      </button>
    </form>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [wallets, setWallets] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  const [activeTab, setActiveTab] = useState(0);
  const [allCoins, setAllCoins] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [newListings, setNewListings] = useState([]);
  const [loadingCrypto, setLoadingCrypto] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCrypto = () => {
    setLoadingCrypto(true);

    Promise.all([
      api.get("/crypto").catch(() => ({ data: [] })),
      api.get("/crypto/gainers").catch(() => ({ data: [] })),
      api.get("/crypto/new").catch(() => ({ data: [] })),
    ])
      .then(([all, gainersRes, newRes]) => {
        setAllCoins(all.data.coins ?? all.data.cryptos ?? all.data ?? []);
        setGainers(
          gainersRes.data.coins ??
            gainersRes.data.cryptos ??
            gainersRes.data ??
            []
        );
        setNewListings(
          newRes.data.coins ?? newRes.data.cryptos ?? newRes.data ?? []
        );
      })
      .finally(() => setLoadingCrypto(false));
  };

  useEffect(() => {
    Promise.all([
      api.get("/wallet/balances").catch(() => ({ data: { wallets: [] } })),
      api.get("/wallet/portfolio").catch(() => ({ data: null })),
    ])
      .then(([walletRes, portfolioRes]) => {
        setWallets(walletRes.data.wallets || []);
        setPortfolio(portfolioRes.data || null);
      })
      .finally(() => setLoadingWallets(false));

    fetchCrypto();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  const currentCoins = [allCoins, gainers, newListings][activeTab] || [];

  const filteredCoins = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return currentCoins.filter(
      (coin) =>
        coin.name?.toLowerCase().includes(term) ||
        coin.symbol?.toLowerCase().includes(term)
    );
  }, [currentCoins, searchTerm]);

  const topGainer = useMemo(() => {
    if (!allCoins.length) return null;

    return [...allCoins].sort(
      (a, b) => Number(b.change24h || 0) - Number(a.change24h || 0)
    )[0];
  }, [allCoins]);

  const newestCoin = newListings[0] || null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-900">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <a href="/">
          <Logo height={28} />
        </a>

        <button
      onClick={handleLogout}
        className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-sm transition-colors"
        >
           Sign out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || "User"} 
          </h1>
          <p className="text-gray-500">
            Track crypto prices, portfolio activity, and new market listings.
          </p>
        
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-500 text-sm">Portfolio Value</p>
            <h2 className="text-2xl font-bold mt-2">
              $
              {Number(portfolio?.totalUsd || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </h2>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-500 text-sm">24h Change</p>
            <h2
              className={`text-2xl font-bold mt-2 ${
                (portfolio?.change24hPercent ?? 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(portfolio?.change24hPercent ?? 0) >= 0 ? "+" : ""}
              {portfolio?.change24hPercent ?? 0}%
            </h2>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-500 text-sm">Coins Tracked</p>
            <h2 className="text-2xl font-bold mt-2">{allCoins.length}</h2>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-500 text-sm">Top Gainer</p>
            <h2 className="text-2xl font-bold mt-2">
              {topGainer?.symbol || "—"}
            </h2>
            <p className="text-green-600 text-sm font-semibold">
              {topGainer
                ? `+${Number(topGainer.change24h || 0).toFixed(2)}%`
                : "No data"}
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">User Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500 text-sm">Full Name</p>
              <p className="font-semibold mt-1">{user?.name || "—"}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500 text-sm">Email Address</p>
              <p className="font-semibold mt-1">{user?.email || "—"}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500 text-sm">Account Type</p>
              <p className="font-semibold mt-1 capitalize">
                {user?.accountType || "Personal"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500 text-sm">KYC Status</p>
              <p className="font-semibold mt-1 capitalize">
                {user?.kycStatus || "None"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Wallets</h2>

          {loadingWallets ? (
            <Loader fullScreen={false} />
          ) : wallets.length === 0 ? (
            <p className="text-gray-500">No wallets found.</p>
          ) : (
            wallets.map((wallet) => (
              <div
                key={wallet._id || wallet.asset}
                className="flex justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <span className="font-bold">{wallet.asset}</span>
                <span className="font-semibold">
                  {wallet.balance} {wallet.asset}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">CoinTrack Market Overview</h2>
              <p className="text-gray-500 text-sm">
                Search, view, and add cryptocurrency records.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm((value) => !value)}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              {showAddForm ? "Cancel" : "+ Add New Coin"}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-base font-semibold mb-4">
                Add New Cryptocurrency
              </h3>

              <AddCryptoForm
                onAdded={(newCoin) => {
                  setAllCoins((prev) => [newCoin, ...prev]);
                  setActiveTab(0);
                  setShowAddForm(false);
                  fetchCrypto();
                }}
              />
            </div>
          )}

          <div className="mb-5">
            <input
              type="text"
              placeholder="Search by coin name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
            {TABS.map((tab, index) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(index);
                  setSearchTerm("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === index
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <CryptoTable coins={filteredCoins} loading={loadingCrypto} />

          {newestCoin && (
            <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-700 font-semibold">
                Newest Listing
              </p>
              <p className="text-gray-900 font-bold mt-1">
                {newestCoin.name} ({newestCoin.symbol})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;