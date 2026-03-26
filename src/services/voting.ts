import * as Crypto from 'expo-crypto';

export const encryptVote = async (vote: string): Promise<{ encrypted: string; hash: string }> => {
  const encoder = new TextEncoder();
  const voteData = encoder.encode(vote);
  
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    vote + Date.now().toString()
  );
  
  const encrypted = btoa(vote + '|' + hash.substring(0, 16));
  
  return {
    encrypted,
    hash,
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
