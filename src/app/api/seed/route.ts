import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Demo profile data
const demoProfile = {
  full_name: 'Charlie Patterson',
  date_of_birth: '1986-07-07',
  gender: 'Male',
  biography: 'Hard working fool. Family man. Duke grad. Building things that matter.',
  personal_motto: 'spread love',
  occupation: 'Product Manager',
  interests: ['Reading', 'Music', 'Cooking', 'Singing', 'Photography', 'Travel'],
  skills: ['Leadership', 'Communication', 'Creativity', 'Problem Solving', 'Public Speaking'],
  personality_traits: ['Introvert', 'Energetic', 'Optimistic', 'Curious', 'Loyal', 'Creative'],
  life_goals: ['Start a family', 'Write a book', 'Visit 30 countries', 'Build a treehouse'],
  religions: ['Hindu'],
  city: 'Cary',
  state: 'NC',
  country: 'USA',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
};

const contacts = [
  { full_name: 'Margaret Patterson', relationship_type: 'mother', email: 'margaret.p@email.com', phone: '+1-919-555-0101', avatar_url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400', notes: 'Mom. Best cook in the family. Loves gardening and mystery novels.', date_of_birth: '1958-03-15' },
  { full_name: 'Robert Patterson Sr.', relationship_type: 'father', email: 'bob.patterson@email.com', phone: '+1-919-555-0102', avatar_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400', notes: 'Dad. Retired engineer. Taught me everything about fixing things.', date_of_birth: '1955-07-22' },
  { full_name: 'Sarah Patterson-Chen', relationship_type: 'sister', email: 'sarah.chen@email.com', phone: '+1-415-555-0103', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', notes: 'Little sis. Lives in San Francisco. Veterinarian.', date_of_birth: '1990-11-08' },
  { full_name: 'Emma Patterson', relationship_type: 'daughter', avatar_url: 'https://images.unsplash.com/photo-1518310952931-b1de897abd40?w=400', notes: 'My little princess. 8 years old. Loves dinosaurs and soccer.', date_of_birth: '2018-02-14' },
  { full_name: 'James Patterson', relationship_type: 'son', avatar_url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400', notes: 'The little man. 5 years old. Always asking "why?"', date_of_birth: '2021-06-30' },
  { full_name: 'Helen Patterson', relationship_type: 'grandmother', phone: '+1-919-555-0107', avatar_url: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400', notes: 'Grandma Helen. 89 years old. Still sharp as a tack.', date_of_birth: '1937-12-01' },
  { full_name: 'Jennifer Patterson', relationship_type: 'spouse', email: 'jen.patterson@email.com', phone: '+1-919-555-0109', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', notes: 'My everything. Met at Duke in 2010. Married 2015.', date_of_birth: '1987-09-23' },
  { full_name: 'Marcus Johnson', relationship_type: 'best_friend', email: 'marcus.j@email.com', phone: '+1-919-555-0111', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', notes: 'Best friend since high school. Brothers for life.', date_of_birth: '1986-01-15' },
  { full_name: 'Priya Sharma', relationship_type: 'close_friend', email: 'priya.sharma@email.com', phone: '+1-919-555-0112', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', notes: 'College roommate. Now a doctor at Duke.', date_of_birth: '1987-04-22' },
  { full_name: 'Dr. Richard Hayes', relationship_type: 'mentor', email: 'r.hayes@duke.edu', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400', notes: 'College professor who changed my life.', date_of_birth: '1958-09-11' },
];

const pets = [
  { name: 'Luna', species: 'dog', breed: 'Labrador Mix', date_of_birth: '2019-03-20', avatar_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400', personality: 'Chaos incarnate. Best snuggler.', is_deceased: false },
  { name: 'Whiskers', species: 'cat', breed: 'Tabby', date_of_birth: '2020-07-10', avatar_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', personality: "Emma's cat. Sleeps 20 hours a day.", is_deceased: false },
];

const memories = [
  { title: 'Learning to ride a bike', description: 'Dad taught me to ride my red Schwinn in the driveway. I fell at least 20 times but he never let me give up.', memory_date: '1992-06-15', location_name: 'Raleigh, NC', location_lat: 35.7796, location_lng: -78.6382, memory_type: 'milestone', ai_category: 'family', photo: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800' },
  { title: 'High school graduation', description: 'Class of 2004. Gave the speech as salutatorian. Dad gave me Grandpa\'s watch afterward.', memory_date: '2004-06-12', location_name: 'Sanderson High School, Raleigh, NC', location_lat: 35.8456, location_lng: -78.7053, memory_type: 'milestone', ai_category: 'celebration', photo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800' },
  { title: 'Study abroad in Barcelona', description: 'Summer 2007. Three months that changed my perspective on everything.', memory_date: '2007-06-15', location_name: 'Barcelona, Spain', location_lat: 41.3851, location_lng: 2.1734, memory_type: 'trip', ai_category: 'travel', photo: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800' },
  { title: 'Meeting Jennifer', description: 'Halloween party 2010. She was a cat, I was a terrible vampire. Made a dumb joke. She laughed anyway.', memory_date: '2010-10-30', location_name: 'Durham, NC', location_lat: 35.9940, location_lng: -78.8986, memory_type: 'milestone', ai_category: 'celebration', photo: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800' },
  { title: 'Wedding day', description: 'June 13, 2015. 150 people. Marcus as best man. Perfect imperfect day.', memory_date: '2015-06-13', location_name: 'The Umstead Hotel, Cary, NC', location_lat: 35.8484, location_lng: -78.8755, memory_type: 'milestone', ai_category: 'celebration', photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800' },
  { title: 'Emma was born', description: 'February 14, 2018. Valentine\'s Day baby. When they put her in my arms, everything else disappeared.', memory_date: '2018-02-14', location_name: 'Duke University Hospital', location_lat: 35.9940, location_lng: -78.9400, memory_type: 'milestone', ai_category: 'family', photo: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800' },
  { title: 'James was born', description: 'June 30, 2021. Pandemic baby. Pure love.', memory_date: '2021-06-30', location_name: 'WakeMed Hospital, Raleigh, NC', location_lat: 35.8051, location_lng: -78.6816, memory_type: 'milestone', ai_category: 'family', photo: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800' },
  { title: 'Family trip to Disney World', description: 'Emma met Elsa. James slept through most of it. Perfect.', memory_date: '2023-11-22', location_name: 'Walt Disney World, Orlando, FL', location_lat: 28.3852, location_lng: -81.5639, memory_type: 'trip', ai_category: 'travel', photo: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800' },
  { title: 'Beach week - Outer Banks', description: 'Three generations under one roof. This is what life is about.', memory_date: '2024-07-15', location_name: 'Outer Banks, NC', location_lat: 35.9582, location_lng: -75.6249, memory_type: 'trip', ai_category: 'travel', photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
];

const postscripts = [
  { 
    title: 'For Emma on her 18th birthday',
    recipient_name: 'Emma Patterson',
    delivery_type: 'date',
    delivery_date: '2036-02-14',
    message: `My dearest Emma,

You're 18 today. A legal adult. I'm probably a mess right now.

You were wanted. So deeply wanted. The day you were born changed everything.

I love you more than any words can capture.

Forever yours,
Dad`,
  },
  { 
    title: 'For Jennifer on our 20th anniversary',
    recipient_name: 'Jennifer Patterson',
    delivery_type: 'date',
    delivery_date: '2035-06-13',
    message: `My love,

20 years. Two decades of you and me.

I fall more in love with you every year.

All of me loves all of you,
Your vampire`,
  },
];

export async function POST() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // 1. Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update(demoProfile)
      .eq('id', user.id);
    if (profileError) throw profileError;

    // 2. Clear existing data
    await supabase.from('postscripts').delete().eq('user_id', user.id);
    await supabase.from('memory_media').delete().eq('user_id', user.id);
    await supabase.from('memories').delete().eq('user_id', user.id);
    await supabase.from('pets').delete().eq('user_id', user.id);
    await supabase.from('contacts').delete().eq('user_id', user.id);

    // 3. Insert contacts
    const contactsWithUser = contacts.map(c => ({ ...c, user_id: user.id }));
    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(contactsWithUser)
      .select('id, full_name');
    if (contactsError) throw contactsError;

    // Create contact lookup
    const contactLookup: Record<string, string> = {};
    insertedContacts?.forEach(c => { contactLookup[c.full_name] = c.id; });

    // 4. Insert pets
    const petsWithUser = pets.map(p => ({ ...p, user_id: user.id }));
    const { error: petsError } = await supabase.from('pets').insert(petsWithUser);
    if (petsError) throw petsError;

    // 5. Insert memories and their photos
    const memoriesForInsert = memories.map(({ photo, ...m }) => ({ ...m, user_id: user.id }));
    const { data: insertedMemories, error: memoriesError } = await supabase
      .from('memories')
      .insert(memoriesForInsert)
      .select('id');
    if (memoriesError) throw memoriesError;

    // 6. Insert memory_media (photos) for each memory
    if (insertedMemories) {
      const mediaEntries = insertedMemories.map((mem, i) => ({
        memory_id: mem.id,
        user_id: user.id,
        file_url: memories[i].photo,
        file_key: `seed-${mem.id}`,
        file_type: 'image',
        mime_type: 'image/jpeg',
        is_cover: true,
      }));
      const { error: mediaError } = await supabase.from('memory_media').insert(mediaEntries);
      if (mediaError) throw mediaError;
    }

    // 7. Insert postscripts
    const postscriptsWithUser = postscripts.map(p => ({
      ...p,
      user_id: user.id,
      recipient_contact_id: contactLookup[p.recipient_name] || null,
      status: 'scheduled',
    }));
    const { error: psError } = await supabase.from('postscripts').insert(postscriptsWithUser);
    if (psError) throw psError;

    return NextResponse.json({ 
      success: true,
      message: 'Demo data seeded!',
      counts: {
        contacts: contacts.length,
        pets: pets.length,
        memories: memories.length,
        postscripts: postscripts.length,
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
