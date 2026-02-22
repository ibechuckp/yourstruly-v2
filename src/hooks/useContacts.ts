'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Contact {
  id: string;
  name: string;
  photoUrl: string | null;
  relationshipType: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  howMet: string | null;
  isDeceased: boolean;
}

interface UseContactsReturn {
  contacts: Contact[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createContact: (contact: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
}

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.user.id)
        .order('full_name');

      if (fetchError) throw fetchError;

      const transformedContacts: Contact[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.full_name,
        photoUrl: c.avatar_url,
        relationshipType: c.relationship_type,
        email: c.email,
        phone: c.phone,
        birthDate: c.date_of_birth,
        howMet: c.how_met,
        isDeceased: c.is_deceased || false,
      }));

      setContacts(transformedContacts);

    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const createContact = useCallback(async (contact: Partial<Contact>): Promise<Contact> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error: createError } = await supabase
      .from('contacts')
      .insert({
        user_id: user.user.id,
        full_name: contact.name,
        avatar_url: contact.photoUrl,
        relationship_type: contact.relationshipType,
        email: contact.email,
        phone: contact.phone,
        date_of_birth: contact.birthDate,
        how_met: contact.howMet,
      })
      .select()
      .single();

    if (createError) throw createError;

    const newContact: Contact = {
      id: data.id,
      name: data.full_name,
      photoUrl: data.avatar_url,
      relationshipType: data.relationship_type,
      email: data.email,
      phone: data.phone,
      birthDate: data.date_of_birth,
      howMet: data.how_met,
      isDeceased: data.is_deceased || false,
    };

    setContacts(prev => [...prev, newContact].sort((a, b) => a.name.localeCompare(b.name)));

    return newContact;
  }, [supabase]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        full_name: updates.name,
        avatar_url: updates.photoUrl,
        relationship_type: updates.relationshipType,
        email: updates.email,
        phone: updates.phone,
        date_of_birth: updates.birthDate,
        how_met: updates.howMet,
        is_deceased: updates.isDeceased,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  }, [supabase]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
  };
}
