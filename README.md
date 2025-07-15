# 🦄 SimpleSwap

**SimpleSwap** is a decentralized web application (dApp) that allows users to swap ERC-20 tokens, add/remove liquidity from a pool, and view key metrics such as balances, reserves, and historical transactions. It runs on the Sepolia testnet and is built with React, Vite, TailwindCSS, and RainbowKit + Wagmi.

---

## ✨ Features

- ✅ Wallet connection (RainbowKit + MetaMask)
- 🔄 ERC-20 token swapping
- 💧 Add and remove liquidity
- 📊 Token and LP balance tracking
- 📈 Pool participation and reserves
- 📚 Full swap and liquidity history
- 🛎️ Toast notifications for errors, approvals, and warnings
- 📉 On-chain price fetching
- 📋 Dashboard summary

---

## 🛠️ Tech Stack

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Wagmi + RainbowKit](https://www.rainbowkit.com/)
- [ethers.js](https://docs.ethers.org/)
- [react-toastify](https://fkhadra.github.io/react-toastify/)
- [Vercel](https://vercel.com) for deployment

---

## 🚀 Deployment with Vercel

### 1. Push your project to GitHub
Make sure the following files are present:
- `package.json`
- `vite.config.js`
- `index.html`
- `src/`
- `.gitignore` with `.env` excluded

### 2. Create a [Vercel](https://vercel.com) account

### 3. Import the GitHub repo
- Framework: **Vite**
- Build Command: `vite build`
- Output Directory: `dist`

### 4. Click **Deploy** 🎉

---

## 🧪 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/your-username/simple-swap.git
cd simple-swap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Open your browser

```
http://localhost:5173
```

---

## ⚙️ Network Setup

The dApp runs on the **Sepolia** testnet. Make sure to:
- Use MetaMask
- Have Sepolia ETH from a [faucet](https://sepoliafaucet.com/)
- Use deployed contracts configured in `src/abi/SimpleSwap.json`

---

## 🧾 Smart Contract

The `SimpleSwap.sol` contract deployed to Sepolia enables:

- Adding/removing liquidity
- Swapping token A ↔ token B
- Calculating prices and accessing reserves

It also emits events:
- `TokenSwapped`
- `LiquidityAdded`
- `LiquidityRemoved`

---

## 📂 Project Structure

```
simple-swap/
├── abi/                    # ABI and ERC-20 helpers
├── public/
├── src/
│   ├── components/
│   ├── App.jsx
│   ├── main.jsx
│   └── SwapInterface.jsx   # Main logic
├── index.html
├── vite.config.js
└── package.json
```

---

## 📬 Contact

> Developed by Nicolás Ortiz.

---

## 🧠 License

MIT License.