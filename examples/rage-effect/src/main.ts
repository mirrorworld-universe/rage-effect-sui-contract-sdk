import {
    Ed25519Keypair,
    JsonRpcProvider,
    testnetConnection,
    RawSigner,
    SuiTransactionBlockResponse,
    TransactionBlock,
    SuiEvent
} from "@mysten/sui.js";
import {Buffer} from "buffer";
import {RageEffectLib} from "@mirrorworld/sui.rageeffect";

const provider: JsonRpcProvider = new JsonRpcProvider(testnetConnection);
const OwnerKey: string = "";
const BuyerKey: string = "";
const SellerKey: string = "";
const RoyaltyKey: string = "";
const FeePayerKey: string = "";

const OwnerKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(OwnerKey, "base64").slice(1));
const BuyerKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(BuyerKey, "base64"));
const SellerKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(SellerKey, "base64"));
const RoyaltyKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(RoyaltyKey, "base64"));
const FeePayerKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(FeePayerKey, "base64"));

console.log("OwnerKey: ", OwnerKeypair.getPublicKey().toSuiAddress());
console.log("BuyerKeypair: ", BuyerKeypair.getPublicKey().toSuiAddress());
console.log("SellerKeypair: ", SellerKeypair.getPublicKey().toSuiAddress());
console.log("RoyaltyKeypair: ", RoyaltyKeypair.getPublicKey().toSuiAddress());
console.log("FeePayerKey: ", FeePayerKeypair.getPublicKey().toSuiAddress());

const OwnerSigner = new RawSigner(OwnerKeypair, provider);
const BuyerSigner = new RawSigner(BuyerKeypair, provider);
const SellerSigner = new RawSigner(SellerKeypair, provider);
const RoyaltySigner = new RawSigner(RoyaltyKeypair, provider);
const FeePayerSigner = new RawSigner(FeePayerKeypair, provider);

const PublishAtAddress: string = "0xa36367af6ca4e3712c7eab5edd3f1be8c39d091bc351815becec0de2844c4ab0";
const PackageAddress: string = "0xa36367af6ca4e3712c7eab5edd3f1be8c39d091bc351815becec0de2844c4ab0";

const MintCapAddress: string = "0xcd1d006408d82e3eb7e89c0355982b060c02504619e219380741683d84da459a";


const rageEffectLib: RageEffectLib = new RageEffectLib(PublishAtAddress, PackageAddress, provider);

(async () => {

    await mintTx(OwnerSigner, FeePayerSigner, MintCapAddress, "Bilal", "Bilal Afzal",
        "https://media.istockphoto.com/id/1408518230/photo/underwater-sea-deep-water-abyss-with-blue-sun-light.jpg?s=2048x2048&w=is&k=20&c=6X8YpzIJMPTSJNi46SJY09bIWD0V7qA5JvTZYa5Porg=",
        "https://media.istockphoto.com/id/1408518230",
        (SellerKeypair.getPublicKey().toSuiAddress()))

})();

async function requestSuiFromFaucet(address: string) {
    await provider.requestSuiFromFaucet(
        address
    );
}


async function splitCoins(senderSigner: RawSigner, feeSigner: RawSigner, coin: string, amount) {
    const txb = new TransactionBlock();

    const [coins] = txb.splitCoins(txb.pure(coin), [txb.pure(amount)])

    console.log([coins]);

    txb.transferObjects([coins], txb.pure((await senderSigner.getAddress())))

    txb.setSender((await senderSigner.getAddress()));
    txb.setGasOwner((await feeSigner.getAddress()));

    const senderSig = await senderSigner.signTransactionBlock({transactionBlock: txb});
    const feeSig = await feeSigner.signTransactionBlock({transactionBlock: txb});

    const result = await provider.executeTransactionBlock({
        transactionBlock: (await txb.build()),
        signature: [senderSig.signature, feeSig.signature]
    })

    console.log(result);
}

async function transferObject(signer: RawSigner, objectId: string, newOwner: string) {
    const tx = new TransactionBlock();
    tx.transferObjects([
            tx.object(objectId)
        ],
        tx.pure(newOwner)
    );

    const result: SuiTransactionBlockResponse = await signer.signAndExecuteTransactionBlock({transactionBlock: tx});
    console.log({result});
}


async function mintTx(senderSigner: RawSigner, feeSigner: RawSigner,  mintCap: string,
                      name: string, description: string, imageUrl: string, metadataUrl: string, receiver: string) {
    const txb: TransactionBlock = await rageEffectLib.mintTransaction((await senderSigner.getAddress()),
        mintCap, name, description, imageUrl, metadataUrl, receiver,
        (await feeSigner.getAddress()));

    const senderSig = await rageEffectLib.signTransaction(txb, senderSigner);

    const feeSig = await rageEffectLib.signTransaction(txb, feeSigner);

    const result = await rageEffectLib.executeTransactionBlock(txb, [senderSig, feeSig]);

    console.log(result);

    console.log("Rage Address: ", (await rageEffectLib.getRageObject(result.digest)))
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
