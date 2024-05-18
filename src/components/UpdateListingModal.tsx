"use client"

import { Modal, Image, InputNumber, message, Button, Skeleton } from 'antd';
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { abiNftMarketplace } from "../../constants/index";
import { parseEther, formatUnits } from 'viem';
import { useChainId } from 'wagmi';
import { config } from "../../helper-wagmi-config";
import { useAccount } from 'wagmi';
import { type BaseError } from 'wagmi'

export interface UpdateListingModalProps {
    isVisible: boolean
    onClose: () => void
    marketplaceAddress: string
    nftAddress: string
    tokenId: string
    imageURL: string | undefined
    currentPrice: bigint | undefined
    seller?: string
}


export const UpdateListingModal = ({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
    imageURL,
    currentPrice,
    seller
}: UpdateListingModalProps) => {
    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0);
    const { address} = useAccount();
    const isOwnedByYou = seller && address? (seller!.toLowerCase() === address!.toLowerCase()) : undefined;
    const chainId = useChainId();
    const blockConfirmations = (chainId == 31337) ? 1 : 6;
    const [messageApi, contextHolder] = message.useMessage();  

    const { isPending: isPendingWriteContract, writeContract } = useWriteContract();

    const WriteContractBuyItemVariables = {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "buyItem",
        args: [nftAddress, BigInt(tokenId)],
        value: currentPrice, 
    }
    async function handleBuyItemSuccess(hashBuyItem: `0x${string}`) {
        messageApi.destroy();
            // (tắt message loading)
        messageApi.open({
            type: 'loading',
            content: 'Waiting for block Confirmations...',
            duration: 0,
        });
        await waitForTransactionReceipt(config,
            {
                hash: hashBuyItem,
                confirmations: blockConfirmations,
            }
        );
        messageApi.destroy();
        messageApi.open({
            type: 'success',
            content: 'Buy Item confirmed!',
        });
    };
    
    const WriteContractUpdateListingVariables = {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "updateListing",
        args: [nftAddress, BigInt(tokenId), BigInt(parseEther(String(priceToUpdateListingWith || '0')))],
    }

    const WriteContractCancelListingVariables = {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "cancelListing",
        args: [nftAddress, BigInt(tokenId)],
    }

    async function handleUpdateListingSuccess(hashUpdateListing: any) {
        messageApi.destroy();
        messageApi.open({
            type: 'loading',
            content: 'Waiting for block Confirmations...',
            duration: 0,
        });
        await waitForTransactionReceipt(config,
            {
                hash: hashUpdateListing,
                confirmations: blockConfirmations,
            }
        );
        messageApi.destroy();
        onClose && onClose();
        setPriceToUpdateListingWith(0);
    
        messageApi.open({
            type: 'success',
            content: 'Update Listing confirmed!',
        });
    }

    async function handleCancelListingSuccess(hashCancelListing: `0x${string}`) {
        messageApi.destroy();
        messageApi.open({
            type: 'loading',
            content: 'Waiting for block Confirmations...',
            duration: 0,
        });
        await waitForTransactionReceipt(config,
            {
                hash: hashCancelListing,
                confirmations: blockConfirmations,
            }
        );
        messageApi.destroy();
        onClose && onClose();
            
        messageApi.open({
            type: 'success',
            content: 'Cancel Listing confirmed!',
        });
    }


    return (
        <>
            {contextHolder}
        
            <Modal
                open={isVisible}
                onCancel={() => { onClose(); setPriceToUpdateListingWith(0)}}
                onOk={isOwnedByYou ? (
                    () => {
                        messageApi.open({
                            type: 'loading',
                            content: 'Wait for confirming...',
                            duration: 0,
                        });
                        console.log("priceToUpdateListingWith:", priceToUpdateListingWith)
                        console.log("price:",BigInt(parseEther(String(priceToUpdateListingWith || '0'))))
                        writeContract(
                            {
                                abi: abiNftMarketplace,
                                address: `0x${marketplaceAddress.slice(2)}`, 
                                functionName: "updateListing",
                                args: [nftAddress, BigInt(tokenId), BigInt(parseEther(String(priceToUpdateListingWith || '0')))],
                            },
                            {
                                onError: (error: any) => {
                                    console.log((error as BaseError).message ?? (error as BaseError).shortMessage);
                                    messageApi.destroy();
                                    messageApi.open({
                                        type: 'error',
                                        content: (error as BaseError).shortMessage,
                                    });
                                },
                                onSuccess: async (hashUpdateListing) => await handleUpdateListingSuccess(hashUpdateListing)
                            }
                        )
                    }
                ) : (
                        () => {
                            messageApi.open({
                                type: 'loading',
                                content: 'Wait for confirming...',
                                duration: 0,
                            });
                            writeContract(
                                {
                                    abi: abiNftMarketplace,
                                    address: `0x${marketplaceAddress.slice(2)}`, 
                                    functionName: "buyItem",
                                    args: [nftAddress, BigInt(tokenId)],
                                    value: currentPrice, 
                                },
                                {
                                    onError: (error: any) => {
                                        console.log((error as BaseError).message ?? (error as BaseError).shortMessage);
                                        messageApi.destroy();
                                        messageApi.open({
                                        type: 'error',
                                        content: (error as BaseError).shortMessage,
                                        });
                                    },
                                    onSuccess: async (hashBuyItem) => await handleBuyItemSuccess(hashBuyItem)
                                }
                            )
                        }
                    )
                }
                title="NFT Details"
                okText={isOwnedByYou ? ("Save New Listing Price") : ("Buy NFT") }
                cancelText="Leave it"
                centered={true}
                confirmLoading={isPendingWriteContract}
                destroyOnClose={true}
            >
                <div
                    style={{
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <div className="flex flex-col items-center gap-4">
                        <p className="p-4 text-lg">
                            {isOwnedByYou ? ("This is your listing. You may either update the listing price or cancel it.") : ("You can buy this NFT") }
                        </p>
                        <div className="flex flex-col items-end gap-2 border-solid border-2 border-gray-400 rounded p-2 w-fit">
                            <div>#{tokenId}</div>
                            {imageURL ? (
                                <Image
                                    alt='nft'
                                    src={imageURL}
                                    height={200}
                                    width={200}
                                />
                            ) : (
                                    <Skeleton.Image />
                                )
                            }
                            <div className="font-bold">
                                {formatUnits(currentPrice || BigInt(0), 18)} ETH
                            </div>
                        </div>
                        {isOwnedByYou && 
                            <div className='flex items-center'>
                                <span className='text-gray-500 flex-shrink-0'>Update listing price in L1 Currency (ETH)：</span>
                                    
                                <InputNumber
                                    min={0}
                                    onChange={(value) => {
                                        setPriceToUpdateListingWith(value as number);
                                        
                                    }}
                                        
                                    size="large"
                                    addonAfter='ETH'
                                    disabled={isPendingWriteContract}
                                />
                            </div>
                        }
                        
                        {isOwnedByYou && 
                            <div>
                                <span className='text-gray-500 flex-shrink-0'>or </span>
                                <Button
                                    disabled={isPendingWriteContract}
                                    type="primary"
                                    size='large'
                                    onClick={() => {
                                        messageApi.open({
                                            type: 'loading',
                                            content: 'Wait for confirming...',
                                            duration: 0,
                                        });
                                        writeContract(
                                            {
                                                abi: abiNftMarketplace,
                                                address: `0x${marketplaceAddress.slice(2)}`, 
                                                functionName: "cancelListing",
                                                args: [nftAddress, BigInt(tokenId)],
                                            },
                                            {
                                                onError: (error) => {
                                                    console.log((error as BaseError).message ?? (error as BaseError).shortMessage);
                                                    messageApi.destroy();
                                                    messageApi.open({
                                                    type: 'error',
                                                    content: (error as BaseError).shortMessage,
                                                    });
                                                },
                                                onSuccess: async (hashCancelListing) => await handleCancelListingSuccess(hashCancelListing)
                                            }
                                        )
                                    }
                                    }

                                >
                                    Cancel Listing
                                </Button>
                            </div>
                        }
                    </div>
                </div>
            </Modal>
        </>
    )

}