export const kernelAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'ticketHash',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'ticketOwner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'receiver',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'inboxLevel',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'inboxMsgId',
        type: 'uint256'
      }
    ],
    name: 'Deposit',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'ticketHash',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'sender',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'tiketOwner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'receiver',
        type: 'bytes'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'outboxLevel',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'outboxMsgId',
        type: 'uint256'
      }
    ],
    name: 'Withdraw',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'bytes22',
        name: 'ticketer',
        type: 'bytes22'
      },
      {
        internalType: 'bytes',
        name: 'content',
        type: 'bytes'
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'getBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'ticketReceiver',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'bytes22',
        name: 'ticketer',
        type: 'bytes22'
      },
      {
        internalType: 'bytes',
        name: 'identifier',
        type: 'bytes'
      }
    ],
    name: 'inboxDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'ticketOwner',
        type: 'address'
      },
      {
        internalType: 'bytes',
        name: 'receiver',
        type: 'bytes'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'bytes22',
        name: 'ticketer',
        type: 'bytes22'
      },
      {
        internalType: 'bytes',
        name: 'content',
        type: 'bytes'
      }
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
