import BigNumber from "bignumber.js"
import { CHAIN_ID, toDecimals, zrxExchangeAddress } from "../constants"
import { signTypedData } from "../web3Methods"
import { postOrderConfig } from './zrxApi.js'

export async function getOrderHashAsync(order) {
    return null
}

export async function delayAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function attemptAsync(fn, opts = { interval: 1000, maxRetries: 10 }) {
    let result;
    let attempt = 0;
    let error;
    let isSuccess = false;
    while (!result && attempt < opts.maxRetries) {
        attempt++;
        try {
            result = await fn();
            isSuccess = true;
            error = undefined;
        } catch (err) {
            error = err;
            await delayAsync(opts.interval);
        }
    }
    if (!isSuccess) {
        throw error;
    }
    return result;
}

export const getSignedOrder = async (from, order) => {
    order.chainId = parseInt(CHAIN_ID)
    order.verifyingContract = zrxExchangeAddress
    const msg = getSignatureMessage(order)
    const signature = await signTypedData(from, JSON.stringify(msg))
    order.signature = {
      signatureType: 2,
      r: signature.r,
      s: signature.s,
      v: signature.v
    }
    return order
}

export const buildOrder = async (from, baseTokenAddress, quoteTokenAddress, amount, price, isBuy, expirationUnixTimeInSeconds, underlyingDecimals, strikeAssetDecimals) => {
    const orderAmount = new BigNumber(toDecimals(amount, underlyingDecimals))
    const orderPrice = new BigNumber(toDecimals(price, strikeAssetDecimals))
    const quoteAmount = orderAmount.times(orderPrice).div(new BigNumber(toDecimals("1", strikeAssetDecimals))).integerValue(BigNumber.ROUND_CEIL) 
    const makerToken = isBuy ? quoteTokenAddress : baseTokenAddress
    const takerToken = isBuy ? baseTokenAddress : quoteTokenAddress
    const makerAmount = isBuy ? quoteAmount.toString(10) : orderAmount.toString(10)
    const takerAmount = isBuy ? orderAmount.toString(10) : quoteAmount.toString(10)
    const maker = from
    const taker = "0x0000000000000000000000000000000000000000"
    const expiry = expirationUnixTimeInSeconds.toString()
    const verifyingContract = zrxExchangeAddress
  
    const orderConfigResult = await postOrderConfig({maker,taker,makerToken,takerToken,makerAmount,takerAmount,expiry,verifyingContract})
  
    return {
      makerToken: makerToken,
      takerToken: takerToken,
      makerAmount: makerAmount,
      takerAmount: takerAmount,
      takerTokenFeeAmount: orderConfigResult.takerTokenFeeAmount,
      maker: maker,
      taker: taker,
      sender: orderConfigResult.sender,
      feeRecipient: orderConfigResult.feeRecipient,
      pool: "0x0000000000000000000000000000000000000000000000000000000000000000",
      expiry: expiry,
      salt: Date.now().toString()
    }
  }

const getSignatureMessage = (order) => {
    return {
      "types": {
        "EIP712Domain": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "version",
            "type": "string"
          },
          {
            "name": "chainId",
            "type": "uint256"
          },
          {
            "name": "verifyingContract",
            "type": "address"
          }
        ],
        "LimitOrder": [
          {
            "name": "makerToken",
            "type": "address"
          },
          {
            "name": "takerToken",
            "type": "address"
          },
          {
            "name": "makerAmount",
            "type": "uint128"
          },
          {
            "name": "takerAmount",
            "type": "uint128"
          },
          {
            "name": "takerTokenFeeAmount",
            "type": "uint128"
          },
          {
            "name": "maker",
            "type": "address"
          },
          {
            "name": "taker",
            "type": "address"
          },
          {
            "name": "sender",
            "type": "address"
          },
          {
            "name": "feeRecipient",
            "type": "address"
          },
          {
            "name": "pool",
            "type": "bytes32"
          },
          {
            "name": "expiry",
            "type": "uint64"
          },
          {
            "name": "salt",
            "type": "uint256"
          }
        ]
      },
      "domain": {
        "name": "ZeroEx",
        "version": "1.0.0",
        "chainId": order.chainId,
        "verifyingContract": order.verifyingContract
      },
      "message": order,
      "primaryType": "LimitOrder"
    };
  };