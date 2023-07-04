import { JsonRpcProvider, devnetConnection, RawSigner, TransactionBlock, Transactions, SuiTransactionBlockResponse } from '@mysten/sui.js';

export class RageEffectLib {
  publishedAtAddress: string;
  packageAddress: string;
  provider: JsonRpcProvider;

  constructor(publishedAtAddress: string, packageAddress: string, provider: JsonRpcProvider = new JsonRpcProvider(devnetConnection)) {
    this.publishedAtAddress = publishedAtAddress;
    this.packageAddress = packageAddress;
    this.provider = provider;
  }

  async executeTransactionBlock(txb: TransactionBlock, signatures: string[]): Promise<SuiTransactionBlockResponse> {
    const res = await this.provider.executeTransactionBlock({
      transactionBlock: await txb.build({ provider: this.provider }),
      signature: signatures,
    });

    return res;
  }

  async signTransaction(txb: TransactionBlock, signer: RawSigner): Promise<string> {
    return (await signer.signTransactionBlock({ transactionBlock: txb })).signature;
  }

  async addFeePayerAndGasBudgetInTransaction(
    txb: TransactionBlock,
    senderAddress: string,
    feePayerAddress: string | undefined = undefined,
    gasBudget: bigint | undefined,
    gasCoinObjectAddress: string | undefined = undefined
  ): Promise<TransactionBlock> {
    if (feePayerAddress != undefined) {
      txb.setGasOwner(feePayerAddress);
    }

    if (gasBudget != undefined) {
      txb.setGasBudget(gasBudget);
    }

    if (gasCoinObjectAddress != undefined) {
      const obData = (
        await this.provider.getObject({
          id: gasCoinObjectAddress as string,
        })
      )?.data;

      txb.setGasPayment([
        {
          objectId: obData?.objectId as string,
          version: obData?.version as string,
          digest: obData?.digest as string,
        },
      ]);
    }

    txb.setSender(senderAddress);

    return txb;
  }

  async mintTransaction(
    mintCapOwnerAddress: string,
    mintCapObjectAddress: string,
    name: string,
    description: string,
    imageUrl: string,
    metadataUrl: string,
    receiver: string,
    feePayer: string | undefined = undefined,
    gasBudget: bigint | undefined = undefined,
    gasCoinObjectAddress: string | undefined = undefined
  ): Promise<TransactionBlock> {
    const txb = new TransactionBlock();
    txb.add(
      Transactions.MoveCall({
        target: `${this.publishedAtAddress}::rage::mint`,
        arguments: [txb.pure(mintCapObjectAddress), txb.pure(name), txb.pure(description), txb.pure(imageUrl), txb.pure(metadataUrl), txb.pure(receiver)],
        typeArguments: [],
      })
    );

    await this.addFeePayerAndGasBudgetInTransaction(txb, mintCapOwnerAddress, feePayer, gasBudget, gasCoinObjectAddress);

    return txb;
  }

  async getRageObject(txDigest: string) {
    let objects: any[] = [];

    const objectType = `${this.packageAddress}::rage::Rage`;

    const txObject: SuiTransactionBlockResponse = await this.provider.getTransactionBlock({
      digest: txDigest,
      options: {
        showEffects: true,
      },
    });

    if (txObject.effects?.status?.status === 'success' && txObject.effects?.created !== undefined) {
      for (let i = 0; i < txObject.effects.created.length; i++) {
        const objectDetails = await this.provider.getObject({
          id: txObject.effects?.created[i].reference.objectId,
          options: {
            showType: true,
          },
        });

        if (objectDetails !== undefined && objectDetails.data?.type === objectType) {
          objects.push({
            objectId: objectDetails.data.objectId,
            objectOwner: (txObject.effects.created[i].owner as any).AddressOwner,
          });
        }
      }
    }

    return objects;
  }
}
