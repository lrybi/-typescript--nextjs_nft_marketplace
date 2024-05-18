"use client";

import Image from "next/image";
import { useAccount } from 'wagmi';
import NFTBox from "@/components/NFTBox";
import { useChainId } from 'wagmi';
import { networkMappingAddresses } from "../../constants/index";
import GET_ACTIVE_ITEMS from "../../constants/subgraphQueries"
import { useQuery } from "@apollo/client";
  // (src\app\graphExample\page.js)
import type { NextPage } from "next";
  
interface nftInterface {
    price: bigint
    nftAddress: string
    tokenId: string
    marketplaceAddress: string
    seller: string
}

interface contractAddressesInterface {
  [key: string]: contractAddressesItemInterface
}

interface contractAddressesItemInterface {
  [key: string]: string[]
}
  
const Home: NextPage = () => {

  const { isConnected, isDisconnected /*, address, addresses */ } = useAccount()

  const chainId = useChainId();
  const addresses: contractAddressesInterface = networkMappingAddresses;
  const marketplaceAddress = chainId  in networkMappingAddresses ? addresses[chainId].NftMarketplace[0] : null;
  
  const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS);
  console.log(listedNfts);


  return (
    <div className="w-full">
      <div className=" flex flex-col items-center justify-center h-screen space-y-10">
        <h1 className=" text-4xl font-mono font-bold">
          {isDisconnected && ("Connet your wallet")}
        </h1> 
        {isConnected && (
          <div>
            {
              loading || !listedNfts ? ( 
                <div>Loading...</div>
              ) : (
                  listedNfts.activeItems.map((nft: nftInterface) => {
                    const { price, nftAddress, tokenId, seller } = nft
                    return marketplaceAddress ? (
                      <NFTBox
                        price={price}
                        nftAddress={nftAddress}
                        tokenId={tokenId}
                        marketplaceAddress={marketplaceAddress}
                        seller={seller}

                        key={`${nftAddress}${tokenId}`}
                      />
                    ) : (
                      <div>Network error, please switch to a supported network. </div>
                    )
                  })
              )
            }  
          </div>
        )}        
      </div>
    </div>
  );
}

export default Home;
