import { ethers } from "ethers";
import { toast } from "react-toastify";

export const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
];

/**
 * Ensure there is sufficient allowance before performing the operation
 */
export async function ensureApproval({ tokenAddress, spender, amount, signer, userAddress }) {
  try {
    const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
    const allowance = await token.allowance(userAddress, spender);

    if (allowance.lt(amount)) {
      toast.info(`Approving token...`);
      const tx = await token.approve(spender, amount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.toString();
      toast.success(`Token approved (gas used: ${gasUsed})`);
    } else {
      console.log("✅ There is already enough allowance");
    }
  } catch (error) {
    console.error("⛔ Error approving", error);
    toast.error("Error approving token");
    throw error;
  }
}
