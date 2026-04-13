/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/authContext';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { transactions, loading, refetch: fetch };
}

export function useBufferedTransactions() {
  const { user } = useAuth();
  const [buffered, setBuffered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('receiver_id', user.id)
      .in('status', ['BUFFERED', 'PENDING'])
      .order('created_at', { ascending: false });

    if (!txData) {
      setLoading(false);
      return;
    }

    const senderIds = [...new Set(txData.map((t: any) => t.sender_id))];
    let senderMap: Record<string, any> = {};

    if (senderIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, name, email, mobile, upi_id')
        .in('user_id', senderIds);

      if (profileData) {
        senderMap = profileData.reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }
    }

    const enriched = txData.map((tx: any) => ({
      ...tx,
      sender_profile: senderMap[tx.sender_id] || null,
    }));

    setBuffered(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('buffer-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { buffered, loading, refetch: fetch };
}
