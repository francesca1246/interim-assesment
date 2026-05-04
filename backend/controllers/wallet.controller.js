const Wallet = require('../models/Wallet');
const { generateMockAddress } = require('../utils/wallet');
const { MOCK_PRICES_USD } = require('../utils/swap');

const getBalances = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user._id });
    res.json({ wallets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAddress = async (req, res) => {
  try {
    const asset = req.params.asset.toUpperCase();
    let wallet = await Wallet.findOne({ userId: req.user._id, asset });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        asset,
        balance: 0,
        address: generateMockAddress(asset),
      });
    }

    res.json({ asset: wallet.asset, address: wallet.address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPortfolioSummary = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user._id });

    let totalUsd = 0;
    const breakdown = wallets.map((w) => {
      const price = MOCK_PRICES_USD[w.asset] || 0;
      const valueUsd = w.balance * price;
      totalUsd += valueUsd;
      return {
        asset: w.asset,
        balance: w.balance,
        priceUsd: price,
        valueUsd: parseFloat(valueUsd.toFixed(2)),
      };
    });

    res.json({
      totalUsd: parseFloat(totalUsd.toFixed(2)),
      change24hPercent: -1.32,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBalances, getAddress, getPortfolioSummary };
