/**
 * YoursTruly v2 — Demo Seed Script
 * 
 * Maps seed-data.ts to actual Supabase schema and injects for current user.
 * 
 * Usage: 
 *   1. Login to the app first (need a real user_id)
 *   2. npx tsx scripts/seed-demo.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// DEMO USER PROFILE
// ============================================================================
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
};

// ============================================================================
// CONTACTS (mapped to schema)
// ============================================================================
const contacts = [
  // FAMILY
  { full_name: 'Margaret Patterson', relationship_type: 'mother', email: 'margaret.p@email.com', phone: '+1-919-555-0101', avatar_url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400', notes: 'Mom. Best cook in the family. Loves gardening and mystery novels.', date_of_birth: '1958-03-15' },
  { full_name: 'Robert Patterson Sr.', relationship_type: 'father', email: 'bob.patterson@email.com', phone: '+1-919-555-0102', avatar_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400', notes: 'Dad. Retired engineer. Taught me everything about fixing things.', date_of_birth: '1955-07-22' },
  { full_name: 'Sarah Patterson-Chen', relationship_type: 'sister', email: 'sarah.chen@email.com', phone: '+1-415-555-0103', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', notes: 'Little sis. Lives in San Francisco. Veterinarian. Has two cats.', date_of_birth: '1990-11-08' },
  { full_name: 'David Chen', relationship_type: 'in_law', email: 'david.chen@email.com', phone: '+1-415-555-0104', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', notes: "Sarah's husband. Software engineer at Google.", date_of_birth: '1988-04-12' },
  { full_name: 'Emma Patterson', relationship_type: 'daughter', avatar_url: 'https://images.unsplash.com/photo-1518310952931-b1de897abd40?w=400', notes: 'My little princess. 8 years old. Loves dinosaurs and soccer.', date_of_birth: '2018-02-14' },
  { full_name: 'James Patterson', relationship_type: 'son', avatar_url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400', notes: 'The little man. 5 years old. Always asking "why?"', date_of_birth: '2021-06-30' },
  { full_name: 'Helen Patterson', relationship_type: 'grandmother', phone: '+1-919-555-0107', avatar_url: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400', notes: 'Grandma Helen. 89 years old. Still sharp as a tack.', date_of_birth: '1937-12-01' },
  { full_name: 'William Patterson', relationship_type: 'grandfather', avatar_url: 'https://images.unsplash.com/photo-1556889882-733a0c8b6e7f?w=400', notes: 'Grandpa Bill. Passed in 2019. Navy veteran. Miss him every day.', date_of_birth: '1935-05-18', is_deceased: true },
  { full_name: 'Jennifer Patterson', relationship_type: 'spouse', email: 'jen.patterson@email.com', phone: '+1-919-555-0109', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', notes: 'My everything. Met at Duke in 2010. Married 2015.', date_of_birth: '1987-09-23' },
  { full_name: 'Uncle Ray', relationship_type: 'uncle', email: 'ray.patterson@email.com', phone: '+1-704-555-0110', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400', notes: "Dad's brother. Lives in Charlotte.", date_of_birth: '1960-08-04' },
  // FRIENDS
  { full_name: 'Marcus Johnson', relationship_type: 'best_friend', email: 'marcus.j@email.com', phone: '+1-919-555-0111', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', notes: 'Best friend since high school. Brothers for life.', date_of_birth: '1986-01-15' },
  { full_name: 'Priya Sharma', relationship_type: 'close_friend', email: 'priya.sharma@email.com', phone: '+1-919-555-0112', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', notes: 'College roommate. Now a doctor at Duke.', date_of_birth: '1987-04-22' },
  { full_name: 'Tommy Rodriguez', relationship_type: 'childhood_friend', email: 'tommy.r@email.com', phone: '+1-919-555-0113', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', notes: 'Grew up on the same street. Moved to Austin.', date_of_birth: '1985-11-30' },
  { full_name: 'Lisa Wang', relationship_type: 'friend', email: 'lisa.wang@email.com', phone: '+1-919-555-0114', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', notes: "Jen's college friend. Amazing baker.", date_of_birth: '1988-07-19' },
  { full_name: 'Derek Williams', relationship_type: 'friend', email: 'derek.w@email.com', phone: '+1-919-555-0115', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', notes: 'Met through soccer league.', date_of_birth: '1984-03-08' },
  // PROFESSIONAL
  { full_name: 'Dr. Richard Hayes', relationship_type: 'mentor', email: 'r.hayes@duke.edu', phone: '+1-919-555-0121', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400', notes: 'College professor who changed my life.', date_of_birth: '1958-09-11' },
  { full_name: 'Sandra Kim', relationship_type: 'colleague', email: 'sandra.kim@company.com', phone: '+1-919-555-0122', avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400', notes: 'Work partner on the Jenkins project.', date_of_birth: '1990-01-29' },
  { full_name: 'Mike Thompson', relationship_type: 'boss', email: 'mike.thompson@company.com', phone: '+1-919-555-0123', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', notes: 'Best manager I ever had.', date_of_birth: '1965-04-05' },
];

// ============================================================================
// PETS (mapped to schema)
// ============================================================================
const pets = [
  { name: 'Buster', species: 'dog', breed: 'Golden Retriever', date_of_birth: '1996-05-15', avatar_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', personality: 'Gentle giant. Loved everyone.', is_deceased: true, date_of_passing: '2010-08-22' },
  { name: 'Luna', species: 'dog', breed: 'Labrador Mix', date_of_birth: '2019-03-20', avatar_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400', personality: 'Chaos incarnate. Best snuggler.', is_deceased: false },
  { name: 'Whiskers', species: 'cat', breed: 'Tabby', date_of_birth: '2020-07-10', avatar_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', personality: "Emma's cat. Sleeps 20 hours a day.", is_deceased: false },
  { name: 'Goldie', species: 'fish', breed: 'Goldfish', date_of_birth: '2023-01-15', avatar_url: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400', personality: "James's first pet.", is_deceased: false },
];

// ============================================================================
// MEMORIES (mapped to schema) - Sample of 15
// ============================================================================
const memories = [
  { title: 'Learning to ride a bike', description: 'Dad taught me to ride my red Schwinn in the driveway. I fell at least 20 times but he never let me give up.', memory_date: '1992-06-15', location_name: 'Raleigh, NC', location_lat: 35.7796, location_lng: -78.6382, memory_type: 'milestone', ai_category: 'family' },
  { title: 'First day of kindergarten', description: 'Mom walked me to the bus stop. She gave me her lucky penny to keep in my pocket. I still have it.', memory_date: '1991-08-26', location_name: 'Raleigh, NC', location_lat: 35.7801, location_lng: -78.6390, memory_type: 'milestone', ai_category: 'family' },
  { title: 'Building the treehouse with Grandpa Bill', description: 'Summer of 1995. We spent two weeks building the treehouse in the backyard. He taught me every tool.', memory_date: '1995-07-10', location_name: 'Raleigh, NC', location_lat: 35.7796, location_lng: -78.6382, memory_type: 'moment', ai_category: 'family' },
  { title: 'High school graduation', description: 'Class of 2004. Gave the speech as salutatorian. Dad gave me Grandpa\'s watch afterward.', memory_date: '2004-06-12', location_name: 'Sanderson High School, Raleigh, NC', location_lat: 35.8456, location_lng: -78.7053, memory_type: 'milestone', ai_category: 'celebration' },
  { title: 'Moving into Duke dorm', description: 'Freshman year. Met my roommate Priya. We stayed up until 3am talking. Knew we\'d be friends for life.', memory_date: '2004-08-21', location_name: 'Duke University, Durham, NC', location_lat: 36.0014, location_lng: -78.9382, memory_type: 'milestone', ai_category: 'everyday' },
  { title: 'Study abroad in Barcelona', description: 'Summer 2007. Three months that changed my perspective on everything. Still dream about those streets.', memory_date: '2007-06-15', location_name: 'Barcelona, Spain', location_lat: 41.3851, location_lng: 2.1734, memory_type: 'trip', ai_category: 'travel' },
  { title: 'Meeting Jennifer', description: 'Halloween party 2010. She was a cat, I was a terrible vampire. Made a dumb joke. She laughed anyway.', memory_date: '2010-10-30', location_name: 'Durham, NC', location_lat: 35.9940, location_lng: -78.8986, memory_type: 'milestone', ai_category: 'celebration' },
  { title: 'Proposing to Jennifer', description: 'Sunset at Pilot Mountain. Same spot where I told her I loved her. She said yes before I finished asking.', memory_date: '2014-09-20', location_name: 'Pilot Mountain, NC', location_lat: 36.3390, location_lng: -80.4740, memory_type: 'milestone', ai_category: 'celebration' },
  { title: 'Wedding day', description: 'June 13, 2015. 150 people. Marcus as best man. I forgot half my vows but Jen squeezed my hand. Perfect.', memory_date: '2015-06-13', location_name: 'The Umstead Hotel, Cary, NC', location_lat: 35.8484, location_lng: -78.8755, memory_type: 'milestone', ai_category: 'celebration' },
  { title: 'Emma was born', description: 'February 14, 2018. Valentine\'s Day baby. When they put her in my arms, everything else disappeared.', memory_date: '2018-02-14', location_name: 'Duke University Hospital, Durham, NC', location_lat: 35.9940, location_lng: -78.9400, memory_type: 'milestone', ai_category: 'family' },
  { title: 'James was born', description: 'June 30, 2021. Pandemic baby. When Emma met her brother through the window, she pressed her hand to the glass.', memory_date: '2021-06-30', location_name: 'WakeMed Hospital, Raleigh, NC', location_lat: 35.8051, location_lng: -78.6816, memory_type: 'milestone', ai_category: 'family' },
  { title: 'Family trip to Disney World', description: 'Emma met Elsa. James slept through most of it. We were exhausted. And it was absolutely perfect.', memory_date: '2023-11-22', location_name: 'Walt Disney World, Orlando, FL', location_lat: 28.3852, location_lng: -81.5639, memory_type: 'trip', ai_category: 'travel' },
  { title: 'Teaching Emma to ride a bike', description: 'Full circle moment. Same way Dad taught me. She fell, cried, wanted to quit. Then something clicked.', memory_date: '2023-06-10', location_name: 'Cary, NC', location_lat: 35.7915, location_lng: -78.7811, memory_type: 'milestone', ai_category: 'family' },
  { title: 'Beach week with the whole family', description: 'Outer Banks tradition. Three generations under one roof. The kids built sandcastles with their grandparents.', memory_date: '2024-07-15', location_name: 'Outer Banks, NC', location_lat: 35.9582, location_lng: -75.6249, memory_type: 'trip', ai_category: 'travel' },
  { title: 'Mom\'s 65th birthday party', description: 'Surprised her at the restaurant. She actually screamed. 40 people came. She kept saying "I can\'t believe you did this."', memory_date: '2023-03-15', location_name: 'The Angus Barn, Raleigh, NC', location_lat: 35.8423, location_lng: -78.7070, memory_type: 'celebration', ai_category: 'celebration' },
];

// ============================================================================
// POSTSCRIPTS (mapped to schema) - Sample of 5
// ============================================================================
const postscripts = [
  { 
    title: 'For Emma on her 18th birthday',
    recipient_name: 'Emma Patterson',
    delivery_type: 'date',
    delivery_date: '2036-02-14',
    message: `My dearest Emma,

You're 18 today. A legal adult. I'm probably a mess right now.

I want you to know: You were wanted. So deeply wanted. The day you were born changed everything.

The world is going to tell you who to be. Don't listen. You've always known exactly who you are.

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

Remember that Halloween party? The terrible vampire joke? You had every reason to walk away. Instead, you laughed.

Thank you for saying yes. Twice.

I fall more in love with you every year.

All of me loves all of you,
Your vampire`,
  },
  { 
    title: 'For James on his college graduation',
    recipient_name: 'James Patterson',
    delivery_type: 'event',
    delivery_event: 'graduation',
    message: `James,

You did it. Whatever "it" is - because knowing you, you probably changed majors twice.

That curious kid who never stopped asking "why?" - he's still in there. Don't lose him.

I'm proud of the man you've become.

Now go make some beautiful mistakes.

Love,
Dad`,
  },
  { 
    title: 'For Marcus - if I go before you',
    recipient_name: 'Marcus Johnson',
    delivery_type: 'passing',
    requires_confirmation: true,
    message: `Marcus,

Brother.

If you're reading this, I'm gone. Sorry about that.

We've been through everything together. Thank you for 40+ years of friendship.

Take care of my family when I can't.

Don't be sad too long. I had a good life. The best parts included you.

See you on the other side.
Me`,
  },
  { 
    title: 'For Mom and Dad on their 50th anniversary',
    recipient_name: 'Margaret & Robert Patterson',
    delivery_type: 'date',
    delivery_date: '2030-08-15',
    message: `Mom and Dad,

50 years. Half a century of love.

You taught me what marriage actually means. Not the fairy tale - the real one.

Everything good in my life started with the two of you.

I love you both,
Your son`,
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
async function seedDatabase() {
  console.log('🌱 YoursTruly V2 Demo Seed\n');

  // Get the first user (or create one)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  if (!users.users.length) {
    console.error('No users found. Please create an account first via the app.');
    return;
  }

  const userId = users.users[0].id;
  console.log(`Using user: ${users.users[0].email} (${userId})\n`);

  try {
    // 1. Update profile
    console.log('📝 Updating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .update(demoProfile)
      .eq('id', userId);
    if (profileError) throw profileError;
    console.log('   ✓ Profile updated');

    // 2. Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('postscripts').delete().eq('user_id', userId);
    await supabase.from('memory_media').delete().eq('user_id', userId);
    await supabase.from('memories').delete().eq('user_id', userId);
    await supabase.from('pets').delete().eq('user_id', userId);
    await supabase.from('contacts').delete().eq('user_id', userId);
    console.log('   ✓ Cleared');

    // 3. Insert contacts
    console.log('📇 Inserting contacts...');
    const contactsWithUser = contacts.map(c => ({ ...c, user_id: userId }));
    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(contactsWithUser)
      .select('id, full_name');
    if (contactsError) throw contactsError;
    console.log(`   ✓ ${insertedContacts.length} contacts`);

    // Create contact lookup
    const contactLookup: Record<string, string> = {};
    insertedContacts.forEach(c => { contactLookup[c.full_name] = c.id; });

    // 4. Insert pets
    console.log('🐾 Inserting pets...');
    const petsWithUser = pets.map(p => ({ ...p, user_id: userId }));
    const { error: petsError } = await supabase.from('pets').insert(petsWithUser);
    if (petsError) throw petsError;
    console.log(`   ✓ ${pets.length} pets`);

    // 5. Insert memories
    console.log('📸 Inserting memories...');
    const memoriesWithUser = memories.map(m => ({ ...m, user_id: userId }));
    const { error: memoriesError } = await supabase.from('memories').insert(memoriesWithUser);
    if (memoriesError) throw memoriesError;
    console.log(`   ✓ ${memories.length} memories`);

    // 6. Insert postscripts
    console.log('💌 Inserting postscripts...');
    const postscriptsWithUser = postscripts.map(p => {
      // Try to find recipient contact
      const recipientId = contactLookup[p.recipient_name.split(' ')[0] + ' ' + (p.recipient_name.split(' ')[1] || '')];
      return {
        ...p,
        user_id: userId,
        recipient_contact_id: recipientId || null,
        status: 'scheduled',
      };
    });
    const { error: psError } = await supabase.from('postscripts').insert(postscriptsWithUser);
    if (psError) throw psError;
    console.log(`   ✓ ${postscripts.length} postscripts`);

    console.log('\n✅ Demo data seeded successfully!');
    console.log(`
Summary:
- Profile: Charlie Patterson
- ${contacts.length} contacts (family, friends, professional)
- ${pets.length} pets (2 dogs, 1 cat, 1 fish)
- ${memories.length} memories with locations
- ${postscripts.length} scheduled TimeDrops
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
}

// Run
seedDatabase();
