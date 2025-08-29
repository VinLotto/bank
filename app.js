// app.js - VinBank DApp mới đồng bộ

let provider, signer, vinBank, vinToken, userAddress;

const CONTRACT_ADDRESS = "0xAFD8E0e13EF9d9F63b2af94264A34cFBd2F148Dd";
const TOKEN_ADDRESS = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

const BANK_ABI = [
  "function deposit(uint256 amount) external",
  "function borrow() external",
  "function repay() external",
  "function withdraw() external",
  "function getPosition(address user) view returns (uint256,uint256,uint256,uint256,uint256)"
];

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)"
];

document.getElementById("connectWallet").addEventListener("click", connectWallet);
async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    vinBank = new ethers.Contract(CONTRACT_ADDRESS, BANK_ABI, signer);
    vinToken = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

    // Hiển thị ví và số dư VIN
    document.getElementById("walletAddress").innerText = `🔗 Connected: ${userAddress}`;
    const balance = await vinToken.balanceOf(userAddress);
    document.getElementById("vinBalance").innerText = ethers.formatUnits(balance, 18);

    await loadSummary();
  } else {
    alert("🦊 Please install MetaMask or Viction Extension.");
  }
}

async function depositVIN() {
  const input = document.getElementById("depositAmount").value;
  const amount = ethers.parseUnits(input, 18);
  const allowance = await vinToken.allowance(userAddress, CONTRACT_ADDRESS);
  if (allowance < amount) {
    const tx1 = await vinToken.approve(CONTRACT_ADDRESS, amount);
    await tx1.wait();
  }
  const tx2 = await vinBank.deposit(amount);
  await tx2.wait();
  alert("✅ Deposit successful!");
  await loadSummary();
  await updateVinBalance();
}

async function borrowVIN() {
  const tx = await vinBank.borrow();
  await tx.wait();
  alert("✅ Borrowed 70% of your deposit!");
  await loadSummary();
  await updateVinBalance();
}
async function repayLoan() {
  const position = await vinBank.getPosition(userAddress);
  const totalDue = position[4];

  const allowance = await vinToken.allowance(userAddress, CONTRACT_ADDRESS);
  if (allowance < totalDue) {
    const tx1 = await vinToken.approve(CONTRACT_ADDRESS, totalDue);
    await tx1.wait();
  }

  const tx2 = await vinBank.repay();
  await tx2.wait();
  alert("✅ Loan repaid successfully!");
  await loadSummary();
  await updateVinBalance();
}

async function withdrawVIN() {
  const tx = await vinBank.withdraw();
  await tx.wait();
  alert("✅ Withdrawal successful!");
  await loadSummary();
  await updateVinBalance();
}

async function loadSummary() {
  const s = await vinBank.getPosition(userAddress);
  const format = ethers.formatUnits;
  const summaryText = `
📌 <b>Your Account Summary</b><br><br>
🟢 <b>Deposited:</b> ${format(s[0], 18)} VIN<br>
💰 <b>Interest Earned:</b> ${format(s[1], 18)} VIN<br>
🔴 <b>Borrowed:</b> ${format(s[2], 18)} VIN<br>
⚠️ <b>Interest Due:</b> ${format(s[3], 18)} VIN<br>
📤 <b>Total to Repay:</b> ${format(s[4], 18)} VIN
  `;
  document.getElementById("summaryBox").innerHTML = summaryText;
}

async function updateVinBalance() {
  const balance = await vinToken.balanceOf(userAddress);
  document.getElementById("vinBalance").innerText = ethers.formatUnits(balance, 18);
}

// Chặn F12, Ctrl+Shift+I, Ctrl+U, click chuột phải
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("keydown", function (e) {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
    (e.ctrlKey && e.key === "U")
  ) {
    e.preventDefault();
  }
});
