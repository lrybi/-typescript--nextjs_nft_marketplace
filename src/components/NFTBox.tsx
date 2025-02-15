"use client"

import { abiNftMarketplace, abiERC721 } from "../../constants/index";
   
import { config } from "../../helper-wagmi-config";
    
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { readContract } from '@wagmi/core';
import { useEffect, useState } from "react";
import { useAccount } from 'wagmi';
import { Card, Image, Skeleton } from 'antd';
import { formatUnits } from 'viem';
import { UpdateListingModal } from './UpdateListingModal';
import { useChainId } from 'wagmi';

import type { NextPage } from "next";
    
interface NFTBoxProps {
    price?: bigint
    nftAddress: string
    tokenId: string
    marketplaceAddress: string
    seller?: string
}


const truncateStr = (fullStr: string, strLen: number) => {
    if (fullStr.length <= strLen) return fullStr;
  
    const separator = '...';
    const separatorLength = separator.length;
    const charsToShow = strLen - separatorLength;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return (
        fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
            
  );
};


const NFTBox: NextPage<NFTBoxProps> = ({ price, nftAddress, tokenId, marketplaceAddress, seller } : NFTBoxProps) => {
    
    const { isConnected, address} = useAccount();
        
    const chainId = useChainId();
    
    const [imageURL, setImageURL] = useState("");
    const [tokenName, setTokenName] = useState('');
    const [tokenDescription, setTokenDescription] = useState('');
    const [showModal, setShowModal] = useState(false);
    const hideModal = () => setShowModal(false);
    const { Meta } = Card;

    
    async function updateUI() {
        
        const tokenURI = await readContract(config, {
            abi: abiERC721,
            address: `0x${nftAddress.slice(2)}`, 
            functionName: "tokenURI",
            args: [tokenId],
        });
        
        if (tokenURI) {
            console.log(`The token URI is: ${tokenURI}`);

            const requestURL = (tokenURI as string).replace('ipfs://', 'https://ipfs.io/ipfs/');
            const tokenURIResponse = await (await fetch(requestURL)).json();
            console.log(tokenURIResponse);
            const imageURI = tokenURIResponse.image;
            const imageURIURL = imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
            console.log(imageURIURL);
            setImageURL(imageURIURL);
            setTokenName(tokenURIResponse.name);
            setTokenDescription(tokenURIResponse.description);
        }
    }

    useEffect(() => {
        if (isConnected) {
            updateUI();
        }
      }, [isConnected]);
    
    const isOwnedByYou = seller && address? (seller!.toLowerCase() === address!.toLowerCase()) : undefined;
    const formattedSellerAddress = isOwnedByYou ? "You" : truncateStr(seller!, 12);

    
    return (
        <div>
            <div>
                {imageURL ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showModal}
                            tokenId={tokenId}
                            nftAddress={nftAddress}
                            marketplaceAddress={marketplaceAddress}
                            onClose={hideModal}
                            imageURL={imageURL}
                            currentPrice={price}
                            seller={seller}
                        />
                        <Card
                            hoverable
                            cover={<Image alt='nft' src={imageURL} height={200} width={200} preview={false} />}
                            onClick={() => { setShowModal(true)}}
                        >
                            <Meta
                                title={tokenName}
                                description={tokenDescription}
                            />
                            <div className=" p-2">
                                <div className=" flex flex-col items-end gap-2">
                                    <div>#{tokenId}</div>
                                    <div className="italic text-sm">Owned by {formattedSellerAddress}</div>
                                    <div className=" font-bold">{formatUnits(price!, 18)} ETH</div>
                                </div>
                                </div>
                        </Card>
                    </div>
                ) : (
                    <div> 
                        <Skeleton.Image /> 
                    </div>
                )}
            </div>
        </div>
    ); 
}

export default NFTBox;
        
