import { ethers } from "ethers";
import { toast } from "react-toastify";

export const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
];

/**
 * Asegura que haya suficiente allowance antes de hacer la operación
 */
export async function ensureApproval({ tokenAddress, spender, amount, signer, userAddress }) {
  try {
    const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
    const allowance = await token.allowance(userAddress, spender);

    if (allowance.lt(amount)) {
      toast.info(`Aprobando token...`);
      const tx = await token.approve(spender, amount);
      await tx.wait();
      toast.success(`Token aprobado`);
    } else {
      console.log("✅ Ya hay allowance suficiente");
    }
  } catch (error) {
    console.error("⛔ Error al aprobar", error);
    toast.error("Error al aprobar el token");
    throw error;
  }
}
