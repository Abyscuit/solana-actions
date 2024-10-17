import {
  // ACTIONS_CORS_HEADERS,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  BLOCKCHAIN_IDS,
  createPostResponse,
} from '@solana/actions';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js';

const ACTIONS_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Accept-Action-Version, X-Accept-Blockchain-Ids',
  'Access-Control-Expose-Headers': 'X-Action-Version, X-Blockchain-Ids',
  'Content-Type': 'application/json',
  'X-Blockchain-Ids': BLOCKCHAIN_IDS.mainnet,
  'X-Action-Version': '2.4.1',
};

// GET request handler
export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload: ActionGetResponse = {
    icon: '/images/icon.png', // Local icon path
    title: 'Donate to Abyscuit',
    description: 'Support Abyscuit by donating SOL.',
    label: 'Donate',
    links: {
      actions: [
        {
          label: 'Donate 0.1 SOL',
          href: `${url.href}?amount=0.1`,
          type: 'transaction',
        },
        {
          label: 'Donate 1 SOL',
          href: `${url.href}?amount=1`,
          type: 'transaction',
        },
        {
          label: 'Donate 2 SOL',
          href: `${url.href}?amount=2`,
          type: 'transaction',
        },
        {
          label: 'Donate 5 SOL',
          href: `${url.href}?amount=5`,
          type: 'transaction',
        },
        {
          label: 'Donate SOL',
          href: `${url.href}?amount={amount}`,
          parameters: [
            {
              name: 'amount',
              label: 'Enter the amount you want to donate',
              required: true,
            },
          ],
          type: 'transaction',
        },
      ],
    },
  };
  return new Response(JSON.stringify(payload), {
    headers: ACTIONS_CORS_HEADERS,
  });
}

export const OPTIONS = GET; // OPTIONS request handler

// POST request handler
export async function POST(request: Request) {
  const body: ActionPostRequest = await request.json();
  const url = new URL(request.url);
  let amount;
  let sender;

  try {
    sender = new PublicKey(body.account);
  } catch (error: unknown) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Invalid account',
        },
      }),
      {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      }
    );
  }
  try {
    amount = Number(url.searchParams.get('amount')) || 0.1;

    if (amount <= 0) throw new Error('Amount is too small');
  } catch (error: unknown) {
    console.error(error);
    const err = error as Error;
    return new Response(
      JSON.stringify({
        error: {
          message: err.message,
        },
      }),
      {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      }
    );
  }

  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender, // Sender public key
      toPubkey: new PublicKey('CBDv85peLsVvUzzc64zQjhr5doVCEa3jMxqrqNkPUocg'), // Replace with your recipient public key
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  transaction.feePayer = sender;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.lastValidBlockHeight = (
    await connection.getLatestBlockhash()
  ).lastValidBlockHeight;

  const payload: ActionPostResponse = await createPostResponse({
    // @ts-expect-error expected error
    fields: {
      transaction,
      message: `Thank you for donating ${amount} SOL to Abyscuit!`,
    },
  });
  return new Response(JSON.stringify(payload), {
    headers: ACTIONS_CORS_HEADERS,
  });
}
