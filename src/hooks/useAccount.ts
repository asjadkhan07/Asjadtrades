import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Account } from '../types';

/**
 * getAllAccounts fetches all accounts from the Firestore collection.
 * It dynamically maps and checks both 'accounts' and 'users' collections
 * (or any other potential locations) to ensure no hardcoding locks out actual data.
 */
export async function getAllAccounts(): Promise<Account[]> {
  console.log('[getAllAccounts] Initializing broad fetch of accounts...');
  const collectionsToQuery = ['accounts', 'users'];
  let combinedAccounts: Account[] = [];

  for (const colName of collectionsToQuery) {
    try {
      console.log(`[getAllAccounts] Attempting to fetch documents from collection: "${colName}"`);
      const colRef = collection(db, colName);
      const querySnapshot = await getDocs(colRef);
      
      console.log(`[getAllAccounts] SUCCESS: db.collection("${colName}") returned ${querySnapshot.docs.length} documents.`);
      
      if (querySnapshot.docs.length === 0) {
        console.log(`[getAllAccounts] WARNING: Array of documents in "${colName}" is empty. This could indicate that the collection has no records or a security rule / query filter is restricting access.`);
      }

      querySnapshot.docs.forEach((docSnap, index) => {
        const rawData = docSnap.data();
        console.log(`[getAllAccounts] Document [${index}] inside "${colName}" ID: "${docSnap.id}":`, rawData);
        
        // Heuristic mapping: Identify if this document is structured as a trading evaluation account.
        // It should have typical Account fields like 'balance', 'initialBalance', 'challengeSize', or 'userId'.
        if (rawData && (
          rawData.balance !== undefined || 
          rawData.initialBalance !== undefined || 
          rawData.challengeSize !== undefined ||
          rawData.challengeName !== undefined
        )) {
          combinedAccounts.push({
            id: docSnap.id,
            ...rawData
          } as Account);
        }
      });
    } catch (err) {
      console.warn(`[getAllAccounts] ERROR querying collection "${colName}":`, err);
    }
  }

  // Deduplicate by ID just in case
  const uniqueAccountsMap = new Map<string, Account>();
  combinedAccounts.forEach(acc => {
    uniqueAccountsMap.set(acc.id, acc);
  });
  const finalAccounts = Array.from(uniqueAccountsMap.values());

  console.log(`[getAllAccounts] Broad Fetch completed. Found ${finalAccounts.length} unique accounts:`, finalAccounts);
  return finalAccounts;
}

/**
 * React hook to retrieve all accounts dynamically on the frontend.
 */
export function useAccount() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await getAllAccounts();
      setAccounts(data);
      setError(null);
    } catch (err: any) {
      console.error('[useAccount Hook] Fetch failed:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    accounts,
    loading,
    error,
    refetch
  };
}
