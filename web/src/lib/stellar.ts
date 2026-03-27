import {
  BASE_FEE,
  Contract,
  TransactionBuilder,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk"
import { rpc } from "@stellar/stellar-sdk"
import { getPublicKey, isConnected, requestAccess, signTransaction } from "@stellar/freighter-api"

export const RPC_URL = "https://soroban-testnet.stellar.org"
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
export const STROOPS = 10_000_000n

export function getContractId(): string {
  return import.meta.env.VITE_CONTRACT_ID ?? ""
}

export function isDeployed(id: string): boolean {
  return Boolean(id && id.startsWith("C") && id.length >= 50 && !id.includes("YOUR_"))
}

export function stroopsToXlm(st: bigint | number | string): number {
  const v = typeof st === "bigint" ? st : BigInt(String(st))
  return Number(v) / Number(STROOPS)
}

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * Number(STROOPS)))
}

function getServer() {
  return new rpc.Server(RPC_URL)
}

export function getContract(contractId: string) {
  return new Contract(contractId)
}

function scValFromSim(sim: rpc.Api.SimulateTransactionResponse) {
  if (rpc.Api.isSimulationError(sim)) {
    const err = sim.error
    throw new Error(typeof err === "string" ? err : (err as { message?: string }).message ?? "Simulation error")
  }
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error("Unexpected simulation response")
  }
  const raw = sim.result?.retval
  if (raw == null) throw new Error("No return value from simulation")
  return scValToNative(raw)
}

export async function simulateRead(
  _contractId: string,
  publicKey: string,
  operation: ReturnType<Contract["call"]>
) {
  const server = getServer()
  const account = await server.getAccount(publicKey)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build()
  const sim = await server.simulateTransaction(tx)
  return scValFromSim(sim)
}

export async function connectWallet(): Promise<string> {
  if (!(await isConnected())) await requestAccess()
  return getPublicKey()
}

export async function callContract(
  contractId: string,
  publicKey: string,
  funcName: string,
  ...args: xdr.ScVal[]
): Promise<{ hash: string }> {
  const server = getServer()
  const contract = getContract(contractId)
  const account = await server.getAccount(publicKey)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(funcName, ...args))
    .setTimeout(30)
    .build()

  const prepared = await server.prepareTransaction(tx)
  const signedXdr = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  })
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const response = await server.sendTransaction(signed)
  const hash = response.hash

  if (response.status === "PENDING" || response.status === "TRY_AGAIN_LATER") {
    for (let i = 0; i < 45; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const got = await server.getTransaction(hash)
      if (got.status === "SUCCESS") return { hash }
      if (got.status === "FAILED") throw new Error("Transaction failed on-chain")
    }
    throw new Error("Timeout waiting for ledger")
  }
  return { hash }
}

export type ChainCampaign = {
  creator: unknown
  goal: bigint
  deadline: bigint
  total: bigint
  finalized: boolean
}
