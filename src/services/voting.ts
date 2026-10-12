import * as Crypto from 'expo-crypto';

export interface VotePayload {
  agendaItemId: string;
  optionId: string;
  userId: string;
}

export interface EncryptedVote {
  encrypted_vote: string;
  vote_hash: string;
}

export const encryptVote = async (payload: VotePayload): Promise<EncryptedVote> => {
  const vote = `${payload.agendaItemId}:${payload.optionId}:${payload.userId}`;

  const encoder = new TextEncoder();
  const voteData = encoder.encode(vote);

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    vote + Date.now().toString()
  );

  const encrypted = btoa(vote + '|' + hash.substring(0, 16));

  return {
    encrypted_vote: encrypted,
    vote_hash: hash,
  };
};

export const generateVoteProof = async (userId: string, agendaItemId: string): Promise<string> => {
  const proof = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}:${agendaItemId}:${Date.now()}`
  );
  return proof;
};

export const verifyVote = (encryptedVote: string): boolean => {
  try {
    const decoded = atob(encryptedVote);
    const parts = decoded.split('|');
    return parts.length === 2 && parts[0].length > 0;
  } catch {
    return false;
  }
};
