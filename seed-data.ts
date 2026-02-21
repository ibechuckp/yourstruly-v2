/**
 * YoursTruly v2 — Demo Seed Data
 * 
 * Run this against Supabase to populate with realistic demo content.
 * Usage: npx ts-node seed-data.ts (or import into a seed script)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo user ID - replace with actual user after auth
const DEMO_USER_ID = 'demo-user-uuid';

// ============================================================================
// CONTACTS (25 people across family, friends, professional)
// ============================================================================

export const contacts = [
  // FAMILY (10)
  {
    id: 'contact-001',
    user_id: DEMO_USER_ID,
    name: 'Margaret Patterson',
    relationship_type: 'mother',
    email: 'margaret.p@email.com',
    phone: '+1-919-555-0101',
    photo_url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400',
    notes: 'Mom. Best cook in the family. Loves gardening and mystery novels.',
    birth_date: '1958-03-15',
  },
  {
    id: 'contact-002',
    user_id: DEMO_USER_ID,
    name: 'Robert Patterson Sr.',
    relationship_type: 'father',
    email: 'bob.patterson@email.com',
    phone: '+1-919-555-0102',
    photo_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400',
    notes: 'Dad. Retired engineer. Taught me everything about fixing things.',
    birth_date: '1955-07-22',
  },
  {
    id: 'contact-003',
    user_id: DEMO_USER_ID,
    name: 'Sarah Patterson-Chen',
    relationship_type: 'sister',
    email: 'sarah.chen@email.com',
    phone: '+1-415-555-0103',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    notes: 'Little sis. Lives in San Francisco. Veterinarian. Has two cats.',
    birth_date: '1990-11-08',
  },
  {
    id: 'contact-004',
    user_id: DEMO_USER_ID,
    name: 'David Chen',
    relationship_type: 'brother_in_law',
    email: 'david.chen@email.com',
    phone: '+1-415-555-0104',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    notes: "Sarah's husband. Software engineer at Google. Great guy.",
    birth_date: '1988-04-12',
  },
  {
    id: 'contact-005',
    user_id: DEMO_USER_ID,
    name: 'Emma Patterson',
    relationship_type: 'daughter',
    email: null,
    phone: null,
    photo_url: 'https://images.unsplash.com/photo-1518310952931-b1de897abd40?w=400',
    notes: 'My little princess. 8 years old. Loves dinosaurs and soccer.',
    birth_date: '2018-02-14',
  },
  {
    id: 'contact-006',
    user_id: DEMO_USER_ID,
    name: 'James Patterson',
    relationship_type: 'son',
    email: null,
    phone: null,
    photo_url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400',
    notes: 'The little man. 5 years old. Always asking "why?" Love it.',
    birth_date: '2021-06-30',
  },
  {
    id: 'contact-007',
    user_id: DEMO_USER_ID,
    name: 'Helen Patterson',
    relationship_type: 'grandmother',
    email: null,
    phone: '+1-919-555-0107',
    photo_url: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400',
    notes: 'Grandma Helen. 89 years old. Still sharp as a tack. WWII stories.',
    birth_date: '1937-12-01',
    deceased: false,
  },
  {
    id: 'contact-008',
    user_id: DEMO_USER_ID,
    name: 'William Patterson',
    relationship_type: 'grandfather',
    email: null,
    phone: null,
    photo_url: 'https://images.unsplash.com/photo-1556889882-733a0c8b6e7f?w=400',
    notes: 'Grandpa Bill. Passed in 2019. Navy veteran. Miss him every day.',
    birth_date: '1935-05-18',
    deceased: true,
    death_date: '2019-09-14',
  },
  {
    id: 'contact-009',
    user_id: DEMO_USER_ID,
    name: 'Jennifer Patterson',
    relationship_type: 'spouse',
    email: 'jen.patterson@email.com',
    phone: '+1-919-555-0109',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    notes: 'My everything. Met at Duke in 2010. Married 2015. Best decision ever.',
    birth_date: '1987-09-23',
  },
  {
    id: 'contact-010',
    user_id: DEMO_USER_ID,
    name: 'Uncle Ray',
    relationship_type: 'uncle',
    email: 'ray.patterson@email.com',
    phone: '+1-704-555-0110',
    photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    notes: "Dad's brother. Lives in Charlotte. Always has the best jokes.",
    birth_date: '1960-08-04',
  },

  // FRIENDS (10)
  {
    id: 'contact-011',
    user_id: DEMO_USER_ID,
    name: 'Marcus Johnson',
    relationship_type: 'best_friend',
    email: 'marcus.j@email.com',
    phone: '+1-919-555-0111',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    notes: 'Best friend since high school. Stood at my wedding. Brothers for life.',
    birth_date: '1986-01-15',
  },
  {
    id: 'contact-012',
    user_id: DEMO_USER_ID,
    name: 'Priya Sharma',
    relationship_type: 'close_friend',
    email: 'priya.sharma@email.com',
    phone: '+1-919-555-0112',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    notes: 'College roommate. Now a doctor at Duke. Still get brunch monthly.',
    birth_date: '1987-04-22',
  },
  {
    id: 'contact-013',
    user_id: DEMO_USER_ID,
    name: 'Tommy Rodriguez',
    relationship_type: 'childhood_friend',
    email: 'tommy.r@email.com',
    phone: '+1-919-555-0113',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    notes: 'Grew up on the same street. Moved to Austin but we stay in touch.',
    birth_date: '1985-11-30',
  },
  {
    id: 'contact-014',
    user_id: DEMO_USER_ID,
    name: 'Lisa Wang',
    relationship_type: 'friend',
    email: 'lisa.wang@email.com',
    phone: '+1-919-555-0114',
    photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    notes: "Jen's college friend. Now part of our friend group. Amazing baker.",
    birth_date: '1988-07-19',
  },
  {
    id: 'contact-015',
    user_id: DEMO_USER_ID,
    name: 'Derek Williams',
    relationship_type: 'friend',
    email: 'derek.w@email.com',
    phone: '+1-919-555-0115',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    notes: 'Met through soccer league. Great defender, better friend.',
    birth_date: '1984-03-08',
  },
  {
    id: 'contact-016',
    user_id: DEMO_USER_ID,
    name: 'Amanda Foster',
    relationship_type: 'friend',
    email: 'amanda.foster@email.com',
    phone: '+1-919-555-0116',
    photo_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
    notes: 'Neighbor. Kids play together. Always there when we need her.',
    birth_date: '1989-10-25',
  },
  {
    id: 'contact-017',
    user_id: DEMO_USER_ID,
    name: 'Chris Martinez',
    relationship_type: 'close_friend',
    email: 'chris.martinez@email.com',
    phone: '+1-512-555-0117',
    photo_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
    notes: 'Fraternity brother. Moved to Austin with Tommy. Annual fishing trips.',
    birth_date: '1986-06-14',
  },
  {
    id: 'contact-018',
    user_id: DEMO_USER_ID,
    name: 'Nicole Brown',
    relationship_type: 'friend',
    email: 'nicole.b@email.com',
    phone: '+1-919-555-0118',
    photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    notes: "Emma's soccer coach. Became good friends with the whole family.",
    birth_date: '1982-12-03',
  },
  {
    id: 'contact-019',
    user_id: DEMO_USER_ID,
    name: 'Kevin O\'Brien',
    relationship_type: 'childhood_friend',
    email: 'kevin.obrien@email.com',
    phone: '+1-617-555-0119',
    photo_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400',
    notes: 'Elementary school best friend. Moved to Boston. See him at reunions.',
    birth_date: '1986-02-28',
  },
  {
    id: 'contact-020',
    user_id: DEMO_USER_ID,
    name: 'Aisha Patel',
    relationship_type: 'friend',
    email: 'aisha.patel@email.com',
    phone: '+1-919-555-0120',
    photo_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    notes: 'Met at parent-teacher night. Kids are in same class. Great conversations.',
    birth_date: '1988-05-17',
  },

  // PROFESSIONAL (5)
  {
    id: 'contact-021',
    user_id: DEMO_USER_ID,
    name: 'Dr. Richard Hayes',
    relationship_type: 'mentor',
    email: 'r.hayes@duke.edu',
    phone: '+1-919-555-0121',
    photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    notes: 'College professor who changed my life. Still grab coffee quarterly.',
    birth_date: '1958-09-11',
  },
  {
    id: 'contact-022',
    user_id: DEMO_USER_ID,
    name: 'Sandra Kim',
    relationship_type: 'colleague',
    email: 'sandra.kim@company.com',
    phone: '+1-919-555-0122',
    photo_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
    notes: 'Work partner on the Jenkins project. Sharp mind, great collaborator.',
    birth_date: '1990-01-29',
  },
  {
    id: 'contact-023',
    user_id: DEMO_USER_ID,
    name: 'Mike Thompson',
    relationship_type: 'boss',
    email: 'mike.thompson@company.com',
    phone: '+1-919-555-0123',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    notes: 'Best manager I ever had. Promoted me twice. Retired last year.',
    birth_date: '1965-04-05',
  },
  {
    id: 'contact-024',
    user_id: DEMO_USER_ID,
    name: 'Rachel Green',
    relationship_type: 'mentee',
    email: 'rachel.green@company.com',
    phone: '+1-919-555-0124',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    notes: 'Hired her as intern, now she runs her own team. So proud.',
    birth_date: '1995-08-20',
  },
  {
    id: 'contact-025',
    user_id: DEMO_USER_ID,
    name: 'James Wilson',
    relationship_type: 'business_partner',
    email: 'james.wilson@startup.io',
    phone: '+1-919-555-0125',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    notes: 'Co-founded the side project together. Great business mind.',
    birth_date: '1983-11-12',
  },
];

// ============================================================================
// MEMORIES (50 memories across different life stages and locations)
// ============================================================================

export const memories = [
  // CHILDHOOD (10)
  {
    id: 'memory-001',
    user_id: DEMO_USER_ID,
    title: 'Learning to ride a bike',
    description: 'Dad taught me to ride my red Schwinn in the driveway. I fell at least 20 times but he never let me give up. When I finally made it to the end of the street, he was running behind me cheering. One of my favorite memories with him.',
    date: '1992-06-15',
    location: '5126 Bur Oak Circle, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
    tags: ['childhood', 'dad', 'milestone', 'summer'],
    shared_with: ['contact-002'], // Dad
    is_public: false,
  },
  {
    id: 'memory-002',
    user_id: DEMO_USER_ID,
    title: 'First day of kindergarten',
    description: 'Mom walked me to the bus stop. I was so nervous I almost cried. She gave me her lucky penny to keep in my pocket. I still have that penny.',
    date: '1991-08-26',
    location: 'Bur Oak Elementary School, Raleigh, NC',
    location_lat: 35.7801,
    location_lng: -78.6390,
    media_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    tags: ['childhood', 'mom', 'school', 'milestone'],
    shared_with: ['contact-001'], // Mom
    is_public: false,
  },
  {
    id: 'memory-003',
    user_id: DEMO_USER_ID,
    title: 'Building the treehouse with Grandpa Bill',
    description: 'Summer of 1995. Grandpa Bill drove down from Virginia with his truck full of lumber. We spent two weeks building the treehouse in the backyard. He taught me how to use every tool. That treehouse lasted 15 years.',
    date: '1995-07-10',
    location: '5126 Bur Oak Circle, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1499578124509-1f2aba224b83?w=800',
    tags: ['childhood', 'grandpa', 'summer', 'building'],
    shared_with: ['contact-008', 'contact-002'], // Grandpa Bill, Dad
    is_public: true,
  },
  {
    id: 'memory-004',
    user_id: DEMO_USER_ID,
    title: 'The great snowball fight of 1996',
    description: 'Biggest snow Raleigh had seen in decades. Tommy, Kevin, and I built the most epic snow fort. We defended it against the older kids for three hours. Came home soaking wet and happy.',
    date: '1996-01-07',
    location: 'Oakwood Park, Raleigh, NC',
    location_lat: 35.7820,
    location_lng: -78.6350,
    media_url: 'https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=800',
    tags: ['childhood', 'friends', 'winter', 'adventure'],
    shared_with: ['contact-013', 'contact-019'], // Tommy, Kevin
    is_public: true,
  },
  {
    id: 'memory-005',
    user_id: DEMO_USER_ID,
    title: 'Catching my first fish',
    description: 'Lake Jordan with Uncle Ray. Used a worm I dug up myself. Caught a 2-pound bass. Uncle Ray made me kiss it before throwing it back. Disgusting but somehow felt right.',
    date: '1993-05-28',
    location: 'Jordan Lake, NC',
    location_lat: 35.7440,
    location_lng: -79.0530,
    media_url: 'https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=800',
    tags: ['childhood', 'uncle', 'fishing', 'nature'],
    shared_with: ['contact-010'], // Uncle Ray
    is_public: true,
  },
  {
    id: 'memory-006',
    user_id: DEMO_USER_ID,
    title: 'Sarah was born',
    description: 'I was 4 years old when they brought her home. I remember thinking she was so tiny. Mom let me hold her on the couch with pillows all around. I promised to always protect her.',
    date: '1990-11-08',
    location: 'Duke University Hospital, Durham, NC',
    location_lat: 35.9940,
    location_lng: -78.9400,
    media_url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800',
    tags: ['childhood', 'family', 'sister', 'milestone'],
    shared_with: ['contact-001', 'contact-002', 'contact-003'], // Mom, Dad, Sarah
    is_public: false,
  },
  {
    id: 'memory-007',
    user_id: DEMO_USER_ID,
    title: 'Grandma Helen\'s apple pie lesson',
    description: 'She finally agreed to teach me her secret recipe. The secret? A tiny bit of sharp cheddar in the crust. Spent all afternoon in her kitchen. The whole house smelled amazing.',
    date: '1997-11-25',
    location: 'Grandma Helen\'s house, Richmond, VA',
    location_lat: 37.5407,
    location_lng: -77.4360,
    media_url: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800',
    tags: ['childhood', 'grandma', 'cooking', 'thanksgiving', 'tradition'],
    shared_with: ['contact-007'], // Grandma Helen
    is_public: true,
  },
  {
    id: 'memory-008',
    user_id: DEMO_USER_ID,
    title: 'Little League championship',
    description: 'We were down by 2 runs in the last inning. Marcus hit a triple, I drove him in with a single up the middle. We won 6-5. Best feeling ever. Still have the trophy.',
    date: '1997-06-14',
    location: 'Optimist Park, Raleigh, NC',
    location_lat: 35.7880,
    location_lng: -78.6420,
    media_url: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800',
    tags: ['childhood', 'sports', 'friends', 'victory'],
    shared_with: ['contact-011', 'contact-002'], // Marcus, Dad
    is_public: true,
  },
  {
    id: 'memory-009',
    user_id: DEMO_USER_ID,
    title: 'Getting my first dog, Buster',
    description: '10th birthday present. Golden retriever from the shelter. He picked me, not the other way around. Walked right up and licked my face. Best friend for 14 years.',
    date: '1996-07-07',
    location: 'Wake County Animal Shelter, Raleigh, NC',
    location_lat: 35.7634,
    location_lng: -78.5276,
    media_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    tags: ['childhood', 'pet', 'birthday', 'milestone'],
    shared_with: ['contact-001', 'contact-002'], // Mom, Dad
    is_public: true,
  },
  {
    id: 'memory-010',
    user_id: DEMO_USER_ID,
    title: 'Mom teaching me to cook eggs',
    description: 'I wanted to make Dad breakfast for Father\'s Day. Mom woke up at 5am to teach me scrambled eggs. I burned the first batch. Second batch was perfect. Dad acted like it was the best meal he\'d ever had.',
    date: '1994-06-19',
    location: '5126 Bur Oak Circle, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1482049016gy-2cbe0e6f5b5e?w=800',
    tags: ['childhood', 'mom', 'dad', 'cooking', 'fathers-day'],
    shared_with: ['contact-001', 'contact-002'], // Mom, Dad
    is_public: false,
  },

  // HIGH SCHOOL & COLLEGE (15)
  {
    id: 'memory-011',
    user_id: DEMO_USER_ID,
    title: 'High school graduation',
    description: 'Class of 2004. Gave the speech as salutatorian. Saw Mom crying in the audience. Dad gave me Grandpa\'s watch afterward. Still wear it on special occasions.',
    date: '2004-06-12',
    location: 'Sanderson High School, Raleigh, NC',
    location_lat: 35.8456,
    location_lng: -78.7053,
    media_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    tags: ['milestone', 'graduation', 'family', 'achievement'],
    shared_with: ['contact-001', 'contact-002', 'contact-011'], // Mom, Dad, Marcus
    is_public: true,
  },
  {
    id: 'memory-012',
    user_id: DEMO_USER_ID,
    title: 'Moving into Duke dorm',
    description: 'Freshman year. Crammed my whole life into a tiny room. Met my roommate Priya. We stayed up until 3am talking about everything. Knew we\'d be friends for life.',
    date: '2004-08-21',
    location: 'Duke University, Durham, NC',
    location_lat: 36.0014,
    location_lng: -78.9382,
    media_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
    tags: ['college', 'duke', 'friends', 'milestone'],
    shared_with: ['contact-012'], // Priya
    is_public: true,
  },
  {
    id: 'memory-013',
    user_id: DEMO_USER_ID,
    title: 'First Duke basketball game',
    description: 'Cameron Indoor Stadium. The energy was unreal. We beat UNC by 12. Lost my voice completely. Became a fan for life that night.',
    date: '2005-02-09',
    location: 'Cameron Indoor Stadium, Durham, NC',
    location_lat: 36.0021,
    location_lng: -78.9425,
    media_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    tags: ['college', 'duke', 'basketball', 'sports'],
    shared_with: ['contact-012', 'contact-017'], // Priya, Chris
    is_public: true,
  },
  {
    id: 'memory-014',
    user_id: DEMO_USER_ID,
    title: 'Study abroad in Barcelona',
    description: 'Summer 2007. Three months that changed my perspective on everything. Learned Spanish, ate incredible food, made friends from all over the world. Still dream about those streets.',
    date: '2007-06-15',
    location: 'Barcelona, Spain',
    location_lat: 41.3851,
    location_lng: 2.1734,
    media_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    tags: ['college', 'travel', 'adventure', 'growth'],
    shared_with: ['contact-017'], // Chris
    is_public: true,
  },
  {
    id: 'memory-015',
    user_id: DEMO_USER_ID,
    title: 'Meeting Dr. Hayes',
    description: 'Intro to Economics. He asked a question nobody could answer. I took a guess and got it half right. After class he said "Come to my office hours." That conversation changed my career path.',
    date: '2005-09-08',
    location: 'Duke University, Durham, NC',
    location_lat: 36.0014,
    location_lng: -78.9382,
    media_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    tags: ['college', 'mentor', 'career', 'turning-point'],
    shared_with: ['contact-021'], // Dr. Hayes
    is_public: true,
  },
  {
    id: 'memory-016',
    user_id: DEMO_USER_ID,
    title: 'Spring break road trip',
    description: 'Marcus, Chris, Tommy and me. 10 days, 8 states, countless memories. The car broke down in Alabama. We spent 6 hours at a diner waiting for the mechanic. Best burgers I\'ve ever had.',
    date: '2006-03-15',
    location: 'Various - Southeast USA Road Trip',
    location_lat: 32.3182,
    location_lng: -86.9023,
    media_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    tags: ['college', 'friends', 'roadtrip', 'adventure'],
    shared_with: ['contact-011', 'contact-013', 'contact-017'], // Marcus, Tommy, Chris
    is_public: true,
  },
  {
    id: 'memory-017',
    user_id: DEMO_USER_ID,
    title: 'First internship',
    description: 'Summer analyst at a consulting firm in Charlotte. Learned more in 10 weeks than in two years of classes. Also learned I didn\'t want to be a consultant.',
    date: '2007-05-28',
    location: 'Charlotte, NC',
    location_lat: 35.2271,
    location_lng: -80.8431,
    media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    tags: ['college', 'career', 'internship', 'growth'],
    shared_with: ['contact-021'], // Dr. Hayes
    is_public: false,
  },
  {
    id: 'memory-018',
    user_id: DEMO_USER_ID,
    title: 'Proposing to start a band (failed hilariously)',
    description: 'Convinced Marcus and Chris we should start a band. I played guitar terribly. Marcus was worse on drums. Chris could actually sing but we drowned him out. Lasted exactly 3 practices.',
    date: '2006-10-20',
    location: 'Marcus\'s garage, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    tags: ['college', 'friends', 'music', 'funny'],
    shared_with: ['contact-011', 'contact-017'], // Marcus, Chris
    is_public: true,
  },
  {
    id: 'memory-019',
    user_id: DEMO_USER_ID,
    title: 'Duke graduation',
    description: 'Magna cum laude. Dr. Hayes came to watch. Mom and Dad sat front row. Felt like the beginning of everything.',
    date: '2008-05-11',
    location: 'Duke University, Durham, NC',
    location_lat: 36.0014,
    location_lng: -78.9382,
    media_url: 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?w=800',
    tags: ['milestone', 'graduation', 'duke', 'achievement'],
    shared_with: ['contact-001', 'contact-002', 'contact-021'], // Mom, Dad, Dr. Hayes
    is_public: true,
  },
  {
    id: 'memory-020',
    user_id: DEMO_USER_ID,
    title: 'Senior year apartment parties',
    description: 'Our apartment became the gathering spot. Friday night dinners that turned into all-night conversations. Priya\'s curry, Lisa\'s brownies, my terrible DJ skills. Pure magic.',
    date: '2008-02-15',
    location: 'Durham, NC',
    location_lat: 35.9940,
    location_lng: -78.8986,
    media_url: 'https://images.unsplash.com/photo-1529543544277-590748c03378?w=800',
    tags: ['college', 'friends', 'parties', 'memories'],
    shared_with: ['contact-012', 'contact-014'], // Priya, Lisa
    is_public: true,
  },
  {
    id: 'memory-021',
    user_id: DEMO_USER_ID,
    title: 'Prom with Amanda',
    description: 'Asked her with a ridiculous scavenger hunt. She said yes after 3 hours of clues. We danced terribly and laughed the whole night. Stayed friends even though we didn\'t date.',
    date: '2004-04-24',
    location: 'Raleigh Convention Center, Raleigh, NC',
    location_lat: 35.7721,
    location_lng: -78.6386,
    media_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    tags: ['high-school', 'prom', 'friends', 'dancing'],
    shared_with: ['contact-016'], // Amanda
    is_public: true,
  },
  {
    id: 'memory-022',
    user_id: DEMO_USER_ID,
    title: 'Getting my driver\'s license',
    description: 'Failed the first time (parallel parking). Passed the second time by 1 point. Dad let me drive us home. I was terrified and thrilled.',
    date: '2002-07-15',
    location: 'NC DMV, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    tags: ['high-school', 'milestone', 'driving', 'freedom'],
    shared_with: ['contact-002'], // Dad
    is_public: false,
  },
  {
    id: 'memory-023',
    user_id: DEMO_USER_ID,
    title: 'First job at the ice cream shop',
    description: 'Scooped ice cream all summer at Goodberry\'s. Gained 10 pounds from free custard. Made $7/hour and felt rich.',
    date: '2003-06-01',
    location: 'Goodberry\'s, Raleigh, NC',
    location_lat: 35.7870,
    location_lng: -78.6812,
    media_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800',
    tags: ['high-school', 'work', 'summer', 'first-job'],
    shared_with: ['contact-013'], // Tommy
    is_public: true,
  },
  {
    id: 'memory-024',
    user_id: DEMO_USER_ID,
    title: 'Camping trip at Hanging Rock',
    description: 'Just me and Dad. No phones, no schedule. We hiked, fished, told stories. He opened up about his own dad for the first time. Those 3 days taught me what kind of father I wanted to be.',
    date: '2003-08-10',
    location: 'Hanging Rock State Park, NC',
    location_lat: 36.3929,
    location_lng: -80.2629,
    media_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    tags: ['high-school', 'dad', 'camping', 'nature', 'meaningful'],
    shared_with: ['contact-002'], // Dad
    is_public: false,
  },
  {
    id: 'memory-025',
    user_id: DEMO_USER_ID,
    title: 'Teaching Sarah to drive',
    description: 'Mom was too nervous. Dad was working. So I took her to the empty parking lot. She almost hit a light pole twice. By the end, she could parallel park better than me.',
    date: '2006-06-20',
    location: 'Shopping center parking lot, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
    tags: ['siblings', 'sister', 'teaching', 'driving'],
    shared_with: ['contact-003'], // Sarah
    is_public: true,
  },

  // CAREER & ADULT LIFE (10)
  {
    id: 'memory-026',
    user_id: DEMO_USER_ID,
    title: 'First day at my real job',
    description: 'Walked into the office terrified. Realized I knew nothing about the real world. Sandra showed me where the coffee machine was. That small kindness meant everything.',
    date: '2008-07-14',
    location: 'Downtown Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    tags: ['career', 'milestone', 'first-job', 'adult-life'],
    shared_with: ['contact-022'], // Sandra
    is_public: false,
  },
  {
    id: 'memory-027',
    user_id: DEMO_USER_ID,
    title: 'Meeting Jennifer',
    description: 'Halloween party 2010. She was dressed as a cat, I was a terrible vampire. I made a dumb joke about wanting to bite her. She laughed anyway. Talked until 4am.',
    date: '2010-10-30',
    location: 'House party, Durham, NC',
    location_lat: 35.9940,
    location_lng: -78.8986,
    media_url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800',
    tags: ['love', 'jennifer', 'first-meeting', 'party'],
    shared_with: ['contact-009'], // Jennifer
    is_public: true,
  },
  {
    id: 'memory-028',
    user_id: DEMO_USER_ID,
    title: 'Our first apartment together',
    description: 'Tiny 1-bedroom in North Hills. The fridge made a weird noise. The neighbors were loud. We loved every square inch of it.',
    date: '2012-08-01',
    location: 'North Hills, Raleigh, NC',
    location_lat: 35.8380,
    location_lng: -78.6485,
    media_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    tags: ['love', 'jennifer', 'home', 'milestone'],
    shared_with: ['contact-009'], // Jennifer
    is_public: false,
  },
  {
    id: 'memory-029',
    user_id: DEMO_USER_ID,
    title: 'Proposing to Jennifer',
    description: 'Sunset at Pilot Mountain. The same spot where I told her I loved her two years before. She said yes before I finished asking. We both cried.',
    date: '2014-09-20',
    location: 'Pilot Mountain State Park, NC',
    location_lat: 36.3390,
    location_lng: -80.4740,
    media_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800',
    tags: ['love', 'jennifer', 'proposal', 'milestone', 'engagement'],
    shared_with: ['contact-009'], // Jennifer
    is_public: true,
  },
  {
    id: 'memory-030',
    user_id: DEMO_USER_ID,
    title: 'Wedding day',
    description: 'June 13, 2015. The Umstead in Cary. 150 people. Marcus as best man. Sarah cried during her toast. I forgot half my vows but Jen just squeezed my hand. Perfect imperfect day.',
    date: '2015-06-13',
    location: 'The Umstead Hotel, Cary, NC',
    location_lat: 35.8484,
    location_lng: -78.8755,
    media_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    tags: ['love', 'jennifer', 'wedding', 'milestone', 'family'],
    shared_with: ['contact-009', 'contact-011', 'contact-003', 'contact-001', 'contact-002'], // Jennifer, Marcus, Sarah, Mom, Dad
    is_public: true,
  },
  {
    id: 'memory-031',
    user_id: DEMO_USER_ID,
    title: 'First promotion',
    description: 'Mike called me into his office. I thought I was in trouble. Instead he said "You\'re ready." 40% raise and a team to lead. Called Dad first. He said "I knew it."',
    date: '2012-03-15',
    location: 'Downtown Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
    tags: ['career', 'promotion', 'milestone', 'achievement'],
    shared_with: ['contact-023', 'contact-002'], // Mike, Dad
    is_public: false,
  },
  {
    id: 'memory-032',
    user_id: DEMO_USER_ID,
    title: 'Buying our house',
    description: 'The moment we got the keys. Jen and I sat on the empty living room floor and ate takeout. No furniture, no curtains. Just us and our future.',
    date: '2016-04-22',
    location: '842 Maple Lane, Cary, NC',
    location_lat: 35.7915,
    location_lng: -78.7811,
    media_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    tags: ['home', 'jennifer', 'milestone', 'house'],
    shared_with: ['contact-009'], // Jennifer
    is_public: true,
  },
  {
    id: 'memory-033',
    user_id: DEMO_USER_ID,
    title: 'Starting the side project with James',
    description: 'Napkin sketches at a coffee shop turned into a real business plan. We shook hands and said "Let\'s do this." That energy still drives us.',
    date: '2019-02-10',
    location: 'Jubala Coffee, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
    tags: ['career', 'business', 'startup', 'partnership'],
    shared_with: ['contact-025'], // James
    is_public: false,
  },
  {
    id: 'memory-034',
    user_id: DEMO_USER_ID,
    title: 'Mentoring Rachel',
    description: 'She came in as an intern, nervous and unsure. Reminded me of myself. Spent hours teaching her everything Mike taught me. Watching her grow has been one of my greatest joys.',
    date: '2018-06-01',
    location: 'Downtown Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800',
    tags: ['career', 'mentoring', 'giving-back', 'growth'],
    shared_with: ['contact-024'], // Rachel
    is_public: true,
  },
  {
    id: 'memory-035',
    user_id: DEMO_USER_ID,
    title: 'Company retreat in Asheville',
    description: 'Team building that actually worked. Hiked to waterfalls, shared meals, had real conversations. Sandra opened up about her struggles. We all got closer.',
    date: '2017-09-15',
    location: 'Asheville, NC',
    location_lat: 35.5951,
    location_lng: -82.5515,
    media_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    tags: ['career', 'team', 'travel', 'asheville'],
    shared_with: ['contact-022'], // Sandra
    is_public: true,
  },

  // FAMILY & KIDS (15)
  {
    id: 'memory-036',
    user_id: DEMO_USER_ID,
    title: 'Emma was born',
    description: 'February 14, 2018. Valentine\'s Day baby. 14 hours of labor. When they put her in my arms, everything else disappeared. Cried harder than I ever have.',
    date: '2018-02-14',
    location: 'Duke University Hospital, Durham, NC',
    location_lat: 35.9940,
    location_lng: -78.9400,
    media_url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800',
    tags: ['kids', 'emma', 'birth', 'milestone', 'family'],
    shared_with: ['contact-009', 'contact-005', 'contact-001', 'contact-002'], // Jennifer, Emma, Mom, Dad
    is_public: false,
  },
  {
    id: 'memory-037',
    user_id: DEMO_USER_ID,
    title: 'James was born',
    description: 'June 30, 2021. Pandemic baby. Couldn\'t have visitors for days. But when Emma finally met her brother through the window, she pressed her hand to the glass. Pure love.',
    date: '2021-06-30',
    location: 'WakeMed Hospital, Raleigh, NC',
    location_lat: 35.8051,
    location_lng: -78.6816,
    media_url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800',
    tags: ['kids', 'james', 'birth', 'milestone', 'family', 'pandemic'],
    shared_with: ['contact-009', 'contact-005', 'contact-006'], // Jennifer, Emma, James
    is_public: false,
  },
  {
    id: 'memory-038',
    user_id: DEMO_USER_ID,
    title: 'Emma\'s first steps',
    description: 'Living room, 10 months old. She\'d been cruising furniture for weeks. Then she just let go and walked to me. Three whole steps before falling into my arms.',
    date: '2018-12-20',
    location: '842 Maple Lane, Cary, NC',
    location_lat: 35.7915,
    location_lng: -78.7811,
    media_url: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=800',
    tags: ['kids', 'emma', 'milestone', 'first-steps'],
    shared_with: ['contact-009', 'contact-005'], // Jennifer, Emma
    is_public: true,
  },
  {
    id: 'memory-039',
    user_id: DEMO_USER_ID,
    title: 'Teaching Emma to ride a bike',
    description: 'Full circle moment. Same way Dad taught me. She fell, cried, wanted to quit. Then something clicked. She rode to the end of the street. I chased her, cheering, crying.',
    date: '2023-06-10',
    location: '842 Maple Lane, Cary, NC',
    location_lat: 35.7915,
    location_lng: -78.7811,
    media_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
    tags: ['kids', 'emma', 'milestone', 'bike', 'parenting'],
    shared_with: ['contact-005', 'contact-002'], // Emma, Dad
    is_public: true,
  },
  {
    id: 'memory-040',
    user_id: DEMO_USER_ID,
    title: 'Emma\'s first soccer goal',
    description: 'She\'d been playing for two seasons without scoring. Then boom - assist from her friend, perfect shot, bottom corner. She ran straight to us in the stands.',
    date: '2024-04-13',
    location: 'Cary Soccer Complex, Cary, NC',
    location_lat: 35.7631,
    location_lng: -78.7931,
    media_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    tags: ['kids', 'emma', 'soccer', 'sports', 'milestone'],
    shared_with: ['contact-005', 'contact-009', 'contact-018'], // Emma, Jennifer, Nicole (coach)
    is_public: true,
  },
  {
    id: 'memory-041',
    user_id: DEMO_USER_ID,
    title: 'James\'s "why" phase begins',
    description: 'Everything is "why" now. Why is the sky blue? Why do dogs bark? Why do I have to eat vegetables? It\'s exhausting and wonderful. His curiosity is infectious.',
    date: '2024-08-15',
    location: '842 Maple Lane, Cary, NC',
    location_lat: 35.7915,
    location_lng: -78.7811,
    media_url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800',
    tags: ['kids', 'james', 'parenting', 'funny', 'development'],
    shared_with: ['contact-006', 'contact-009'], // James, Jennifer
    is_public: true,
  },
  {
    id: 'memory-042',
    user_id: DEMO_USER_ID,
    title: 'Family trip to Disney World',
    description: 'Emma met Elsa and froze (pun intended). James slept through most of it. Jen and I were exhausted. And it was absolutely perfect. The kids still talk about it.',
    date: '2023-11-22',
    location: 'Walt Disney World, Orlando, FL',
    location_lat: 28.3852,
    location_lng: -81.5639,
    media_url: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800',
    tags: ['kids', 'family', 'vacation', 'disney', 'travel'],
    shared_with: ['contact-009', 'contact-005', 'contact-006'], // Jennifer, Emma, James
    is_public: true,
  },
  {
    id: 'memory-043',
    user_id: DEMO_USER_ID,
    title: 'Grandpa Bill\'s last Thanksgiving',
    description: 'We didn\'t know it would be the last one. He was tired but happy. Held James for hours. Told Emma stories about the Navy. Grateful we have photos.',
    date: '2018-11-22',
    location: 'Grandma Helen\'s house, Richmond, VA',
    location_lat: 37.5407,
    location_lng: -77.4360,
    media_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    tags: ['family', 'grandpa', 'thanksgiving', 'memorial', 'bittersweet'],
    shared_with: ['contact-007', 'contact-008'], // Grandma Helen, Grandpa Bill
    is_public: false,
  },
  {
    id: 'memory-044',
    user_id: DEMO_USER_ID,
    title: 'Saying goodbye to Grandpa Bill',
    description: 'He went peacefully, surrounded by family. The church was packed. So many stories I\'d never heard. He touched more lives than I knew. I hope to be half the man he was.',
    date: '2019-09-18',
    location: 'St. Paul\'s Church, Richmond, VA',
    location_lat: 37.5407,
    location_lng: -77.4360,
    media_url: 'https://images.unsplash.com/photo-1516831906352-1623190ca036?w=800',
    tags: ['family', 'grandpa', 'memorial', 'grief', 'love'],
    shared_with: ['contact-007', 'contact-001', 'contact-002'], // Grandma Helen, Mom, Dad
    is_public: false,
  },
  {
    id: 'memory-045',
    user_id: DEMO_USER_ID,
    title: 'Emma\'s first day of school',
    description: 'She was so brave. Walked in without looking back. I sat in the car and cried for 10 minutes. Jen pretended she didn\'t, but her eyes were red too.',
    date: '2023-08-28',
    location: 'Davis Drive Elementary, Cary, NC',
    location_lat: 35.7545,
    location_lng: -78.7826,
    media_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    tags: ['kids', 'emma', 'school', 'milestone', 'parenting'],
    shared_with: ['contact-005', 'contact-009'], // Emma, Jennifer
    is_public: true,
  },
  {
    id: 'memory-046',
    user_id: DEMO_USER_ID,
    title: 'Sarah\'s wedding day',
    description: 'My little sister got married. David is perfect for her. I gave a toast that made everyone laugh and cry. She whispered "I love you, big brother" as they left.',
    date: '2019-05-18',
    location: 'Golden Gate Club, San Francisco, CA',
    location_lat: 37.8024,
    location_lng: -122.4058,
    media_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    tags: ['family', 'sarah', 'wedding', 'milestone', 'love'],
    shared_with: ['contact-003', 'contact-004'], // Sarah, David
    is_public: true,
  },
  {
    id: 'memory-047',
    user_id: DEMO_USER_ID,
    title: 'The kids meeting baby cousin',
    description: 'Sarah and David had their first. Emma was fascinated, kept asking if she could keep him. James was skeptical. The photo of all three is my phone wallpaper.',
    date: '2024-03-10',
    location: 'San Francisco, CA',
    location_lat: 37.7749,
    location_lng: -122.4194,
    media_url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800',
    tags: ['family', 'kids', 'cousins', 'new-baby'],
    shared_with: ['contact-003', 'contact-004', 'contact-005', 'contact-006'], // Sarah, David, Emma, James
    is_public: true,
  },
  {
    id: 'memory-048',
    user_id: DEMO_USER_ID,
    title: 'Beach week with the whole family',
    description: 'Outer Banks tradition. Three generations under one roof. Chaos and laughter and too much seafood. The kids built sandcastles with their grandparents. This is what life is about.',
    date: '2024-07-15',
    location: 'Outer Banks, NC',
    location_lat: 35.9582,
    location_lng: -75.6249,
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    tags: ['family', 'vacation', 'beach', 'tradition', 'summer'],
    shared_with: ['contact-001', 'contact-002', 'contact-003', 'contact-009', 'contact-005', 'contact-006'],
    is_public: true,
  },
  {
    id: 'memory-049',
    user_id: DEMO_USER_ID,
    title: 'Pandemic family movie nights',
    description: '2020 was hard, but we found magic in the small things. Every Friday was movie night. Blanket forts, popcorn, the same movies over and over. Emma still requests "Moana Fridays."',
    date: '2020-04-17',
    location: '842 Maple Lane, Cary, NC',
    location_lat: 35.7915,
    location_lng: -78.7811,
    media_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    tags: ['family', 'pandemic', 'movies', 'tradition', 'home'],
    shared_with: ['contact-009', 'contact-005'], // Jennifer, Emma
    is_public: true,
  },
  {
    id: 'memory-050',
    user_id: DEMO_USER_ID,
    title: 'Mom\'s 65th birthday party',
    description: 'Surprised her at the restaurant. She actually screamed. 40 people came - family, friends, neighbors. She kept saying "I can\'t believe you did this." That\'s all I wanted to hear.',
    date: '2023-03-15',
    location: 'The Angus Barn, Raleigh, NC',
    location_lat: 35.8423,
    location_lng: -78.7070,
    media_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
    tags: ['family', 'mom', 'birthday', 'surprise', 'celebration'],
    shared_with: ['contact-001', 'contact-002', 'contact-003', 'contact-009'],
    is_public: true,
  },
];

// ============================================================================
// POSTSCRIPTS (TimeDrops) - Future messages
// ============================================================================

export const postscripts = [
  {
    id: 'postscript-001',
    user_id: DEMO_USER_ID,
    title: 'For Emma on her 18th birthday',
    recipient_contact_id: 'contact-005',
    trigger_type: 'date',
    trigger_date: '2036-02-14',
    message: `My dearest Emma,

You're 18 today. A legal adult. I'm probably a mess right now, watching you become who you've always been meant to be.

I want you to know a few things I might not say well in person:

1. You were wanted. So deeply wanted. The day you were born changed everything.

2. Every time you fell and got back up, I was proud. Every time you were kind when it was hard, I was proud. Every time you stood up for someone else, I was proud.

3. The world is going to tell you who to be. Don't listen. You've always known exactly who you are. Trust that.

4. Call your grandmother. She won't be here forever, and her stories are gold.

5. Take risks. Fall in love. Get your heart broken. Travel somewhere that scares you. Say yes to the adventure.

I love you more than any words can capture. You are my greatest joy.

Now go be extraordinary. You already are.

Forever yours,
Dad`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-002',
    user_id: DEMO_USER_ID,
    title: 'For James on his first day of high school',
    recipient_contact_id: 'contact-006',
    trigger_type: 'date',
    trigger_date: '2035-08-25',
    message: `Hey buddy,

First day of high school. Big stuff.

I remember mine - I was terrified and tried to act cool. It didn't work. So here's what I wish someone had told me:

- Nobody has it figured out. Everyone is pretending. Even the cool kids.
- Find your people. They might not be who you expect.
- Try everything at least once. Drama, sports, band, whatever. You might surprise yourself.
- Grades matter, but not as much as being a good human.
- Call me whenever. Middle of the night. I mean it.

You're going to do great things, James. Not because you're perfect, but because you never stop asking "why?" Keep asking.

Love you, little man (probably not so little anymore),
Dad`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-003',
    user_id: DEMO_USER_ID,
    title: 'For Jennifer on our 20th anniversary',
    recipient_contact_id: 'contact-009',
    trigger_type: 'date',
    trigger_date: '2035-06-13',
    message: `My love,

20 years. Two decades of you and me.

Remember that Halloween party? The terrible vampire joke? You had every reason to walk away. Instead, you laughed, and here we are.

Thank you for:
- Saying yes (twice - to the date and to forever)
- Two incredible humans we made together
- Every 3am conversation
- Making our house a home
- Loving me even when I'm impossible
- The way you still laugh at my bad jokes

I fall more in love with you every year. The version of us at 20 years is better than the version at 10, which was better than 5, which was better than 1.

I can't wait to see who we become at 30.

All of me loves all of you,
Your vampire`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-004',
    user_id: DEMO_USER_ID,
    title: 'For Mom and Dad on their 50th anniversary',
    recipient_contact_id: 'contact-001',
    trigger_type: 'date',
    trigger_date: '2030-08-15',
    message: `Mom and Dad,

50 years. Half a century of love, partnership, and building a life together.

You taught me what marriage actually means. Not the fairy tale version - the real one. The one where you disagree and figure it out. The one where you sacrifice and don't keep score. The one where love is a verb, every single day.

Everything good in my life started with the two of you. The way I love Jennifer. The way I parent Emma and James. The way I see the world.

Thank you for showing me what's possible when two people choose each other, over and over, for 50 years.

Here's to 50 more (okay, maybe 30, let's be realistic).

I love you both,
Your son`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-005',
    user_id: DEMO_USER_ID,
    title: 'For Emma when she becomes a parent',
    recipient_contact_id: 'contact-005',
    trigger_type: 'event',
    trigger_event: 'first_child',
    message: `Emma,

You're a mom now. 

I don't know when this is being delivered. Maybe you're 25. Maybe you're 35. But you're holding your child, and everything just shifted.

A few things I learned:

1. You will feel like you're doing it wrong. You're not.

2. They don't need perfect. They need present.

3. Sleep when they sleep (everyone says this - no one does it - try anyway).

4. Your instincts are right. Trust them.

5. It's okay to miss who you were before. You're not losing yourself. You're expanding.

6. Take pictures of the boring stuff. The breakfast table. The messy room. The ordinary Tuesday. That's the stuff you'll treasure.

I remember the first night with you in our arms. I was terrified. And I've never been more certain of anything.

You're going to be an incredible mother. You already are.

Welcome to the greatest, hardest, most beautiful adventure.

I love you,
Dad (now Grandpa? This is weird.)`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-006',
    user_id: DEMO_USER_ID,
    title: 'For James on his college graduation',
    recipient_contact_id: 'contact-006',
    trigger_type: 'event',
    trigger_event: 'college_graduation',
    message: `James,

You did it. Whatever "it" is - because knowing you, you probably changed majors twice and found something no one saw coming.

I want you to know something: that curious kid who never stopped asking "why?" - he's still in there. Don't lose him. The world needs people who question everything.

Some unsolicited dad advice for what comes next:
- The first job isn't the last job. Learn everything you can, then move on.
- Money matters less than you think. Meaning matters more.
- Call your mother. And me. We miss you.
- Take care of your body. It's the only one you get.
- Be kind to yourself. You're doing better than you think.

I'm proud of the man you've become. Not because of this degree, but because of who you are when no one's watching.

Now go make some beautiful mistakes.

Love,
Dad`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-007',
    user_id: DEMO_USER_ID,
    title: 'For Marcus - if I go before you',
    recipient_contact_id: 'contact-011',
    trigger_type: 'event',
    trigger_event: 'my_passing',
    message: `Marcus,

Brother.

If you're reading this, I'm gone, and you're probably mad at me for leaving first. Sorry about that.

We've been through everything together. Little League. College. Weddings. Funerals. The good and the terrible and the ordinary Tuesday afternoons.

Thank you for 40+ years of friendship. For standing next to me on the best day of my life. For every late-night conversation. For never letting me take myself too seriously.

Take care of my family when I can't. Not because they need it - Jen is stronger than both of us combined. But because I know you will anyway.

Don't be sad too long. I had a good life. The best parts of it included you.

See you on the other side.

Your brother (in everything but blood),
Me`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-008',
    user_id: DEMO_USER_ID,
    title: 'For Sarah on her 40th birthday',
    recipient_contact_id: 'contact-003',
    trigger_type: 'date',
    trigger_date: '2030-11-08',
    message: `Little sis,

You're 40. I'm sorry. It happens to the best of us.

Remember when you were born and I promised to always protect you? I was 4. I had no idea what I was signing up for.

But I meant it. Still do.

You've grown into someone incredible. The way you care for animals. The way you love David. The way you light up every room.

I'm proud to be your big brother. Even when you beat me at Scrabble (still think you cheated that one time).

Here's to 40 more years of you being amazing and me pretending I'm not impressed.

Love you always,
Your favorite brother (your only brother, but still)`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-009',
    user_id: DEMO_USER_ID,
    title: 'For Emma on her wedding day',
    recipient_contact_id: 'contact-005',
    trigger_type: 'event',
    trigger_event: 'wedding',
    message: `My beautiful girl,

Today you become someone's partner for life. I'm crying. Obviously.

I've been preparing for this day since you were born. I'm still not ready.

Whoever you're marrying - I hope they know how lucky they are. They're getting someone who is kind, fierce, funny, and strong. Someone who never gives up. Someone extraordinary.

Marriage is hard. You'll fight. You'll wonder if you made the right choice. You'll have moments of doubt.

And then you'll look at them sleeping next to you, or laughing at something stupid, or holding your hand in a hard moment, and you'll know.

Choose each other every day. Even the bad days. Especially the bad days.

I love you more than you'll ever know. Until you have your own child. Then you'll understand.

Now go dance. I'll try not to embarrass you too much.

Forever and always,
Dad`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
  {
    id: 'postscript-010',
    user_id: DEMO_USER_ID,
    title: 'For Grandma Helen on her 95th birthday',
    recipient_contact_id: 'contact-007',
    trigger_type: 'date',
    trigger_date: '2032-12-01',
    message: `Grandma,

95 years on this earth. What a life.

You survived the Depression. You waited for Grandpa during the war. You raised three kids. You buried your husband with grace. You've taught us all how to live.

Your apple pie recipe lives on (yes, I still use the cheddar secret).

Thank you for every story. Every Sunday dinner. Every piece of wisdom you didn't know you were giving.

I hope I have half your strength when I'm your age.

I love you so much.

Your grandson,
Charlie

P.S. I still have the lucky penny Mom gave me on my first day of school. She got that idea from you.`,
    media_url: null,
    is_video: false,
    status: 'scheduled',
  },
];

// ============================================================================
// PETS
// ============================================================================

export const pets = [
  {
    id: 'pet-001',
    user_id: DEMO_USER_ID,
    name: 'Buster',
    species: 'dog',
    breed: 'Golden Retriever',
    birth_date: '1996-05-15',
    photo_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    personality: 'Gentle giant. Loved everyone. Would fetch until his legs gave out.',
    medical_notes: 'Hip dysplasia in later years. Still happy until the end.',
    passed_away: true,
    death_date: '2010-08-22',
  },
  {
    id: 'pet-002',
    user_id: DEMO_USER_ID,
    name: 'Luna',
    species: 'dog',
    breed: 'Labrador Mix',
    birth_date: '2019-03-20',
    photo_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
    personality: 'Chaos incarnate. Steals socks. Best snuggler in the house.',
    medical_notes: 'Allergic to chicken. On salmon-based food.',
    passed_away: false,
  },
  {
    id: 'pet-003',
    user_id: DEMO_USER_ID,
    name: 'Whiskers',
    species: 'cat',
    breed: 'Tabby',
    birth_date: '2020-07-10',
    photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
    personality: 'Emma\'s cat. Tolerates everyone except James. Sleeps 20 hours a day.',
    medical_notes: 'Indoor only. Annual checkups all clear.',
    passed_away: false,
  },
  {
    id: 'pet-004',
    user_id: DEMO_USER_ID,
    name: 'Goldie',
    species: 'fish',
    breed: 'Goldfish',
    birth_date: '2023-01-15',
    photo_url: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400',
    personality: 'James\'s first pet. He talks to it every morning.',
    medical_notes: 'Surprisingly long-lived for a carnival fish.',
    passed_away: false,
  },
];

// ============================================================================
// KNOWLEDGE ENTRIES (Pre-seeded wisdom)
// ============================================================================

export const knowledgeEntries = [
  {
    id: 'knowledge-001',
    user_id: DEMO_USER_ID,
    category: 'life_lessons',
    prompt_text: 'What\'s the most important lesson life has taught you?',
    response_text: 'That time is the only resource you can\'t get back. I spent too many years chasing promotions and missed too many of Emma\'s soccer games. Now I know: be present. The work will always be there. The moments won\'t.',
    word_count: 47,
    is_featured: true,
  },
  {
    id: 'knowledge-002',
    user_id: DEMO_USER_ID,
    category: 'relationships',
    prompt_text: 'What makes a good marriage?',
    response_text: 'Jennifer and I have been together 15 years. The secret? There is no secret. It\'s showing up every day. It\'s choosing each other when you\'re tired, angry, or just want to be alone. It\'s saying "I\'m sorry" more than "I\'m right." It\'s laughing together, even when things are hard. Especially when things are hard.',
    word_count: 68,
    is_featured: true,
  },
  {
    id: 'knowledge-003',
    user_id: DEMO_USER_ID,
    category: 'parenting',
    prompt_text: 'What do you hope your kids remember about you?',
    response_text: 'I hope they remember that I tried. That I showed up to their games and plays and science fairs. That I apologized when I was wrong. That I told them I loved them every single day. And I hope they remember the small things - the pancakes on Saturday mornings, the silly voices during bedtime stories, the way I always had time for one more question.',
    word_count: 74,
    is_featured: true,
  },
  {
    id: 'knowledge-004',
    user_id: DEMO_USER_ID,
    category: 'career',
    prompt_text: 'What\'s the best career advice you\'d give?',
    response_text: 'Find good people and stick with them. Mike Thompson, my first real boss, taught me everything. Not just about work, but about leadership, integrity, and taking care of your team. The skills I learned from him have mattered more than any degree or certification. Find your mentors. Be a mentor. That\'s how legacies are built.',
    word_count: 64,
  },
  {
    id: 'knowledge-005',
    user_id: DEMO_USER_ID,
    category: 'values',
    prompt_text: 'What principles guide your decisions?',
    response_text: 'Three things: Will I be proud of this tomorrow? Will this matter in five years? Would I be okay if my kids knew? If I can say yes to all three, I move forward. If not, I stop and reconsider. It\'s simple, but it\'s kept me on the right path.',
    word_count: 56,
  },
  {
    id: 'knowledge-006',
    user_id: DEMO_USER_ID,
    category: 'health',
    prompt_text: 'What\'s your secret to happiness?',
    response_text: 'Gratitude. Every morning, I think of three things I\'m grateful for. Sometimes it\'s big - my family\'s health, a roof over our heads. Sometimes it\'s small - good coffee, a sunny day, a text from an old friend. It reframes everything. Hard days become days with hard parts. Problems become challenges. It\'s not toxic positivity - it\'s perspective.',
    word_count: 67,
  },
  {
    id: 'knowledge-007',
    user_id: DEMO_USER_ID,
    category: 'faith',
    related_religion: 'Hindu',
    prompt_text: 'How has dharma guided your decisions?',
    response_text: 'My parents raised us Hindu, and while I\'m not as devout as they were, dharma - doing the right thing, fulfilling your duty - has shaped everything. When I\'m conflicted, I ask: what would a good father do? A good son? A good friend? The answer is usually clear. Dharma isn\'t about religious rules. It\'s about being who you\'re supposed to be.',
    word_count: 72,
  },
  {
    id: 'knowledge-008',
    user_id: DEMO_USER_ID,
    category: 'practical',
    related_interest: 'Cooking',
    prompt_text: 'What recipe absolutely must be passed down?',
    response_text: 'Grandma Helen\'s apple pie. The secret is sharp cheddar cheese in the crust - sounds crazy, but trust me. She taught me when I was 12. I\'ve made it every Thanksgiving since. Emma has already learned it. The recipe matters, but the tradition matters more. It\'s not about the pie. It\'s about standing in the kitchen together, flour on our hands, passing something forward.',
    word_count: 75,
    is_featured: true,
  },
  {
    id: 'knowledge-009',
    user_id: DEMO_USER_ID,
    category: 'legacy',
    prompt_text: 'How do you want to be remembered?',
    response_text: 'As someone who showed up. As a father who was present. As a husband who kept his promises. As a friend who could be counted on. As someone who made people feel seen. I don\'t need monuments or achievements. Just: "He was there when it mattered." That would be enough.',
    word_count: 55,
    is_featured: true,
  },
  {
    id: 'knowledge-010',
    user_id: DEMO_USER_ID,
    category: 'hobbies',
    related_hobby: 'Golf',
    prompt_text: 'What has golf taught you about patience?',
    response_text: 'Golf humbles you. You can\'t muscle your way through it. You can\'t rush it. The harder you try, the worse it gets. You have to breathe, trust your swing, and accept that some days the ball just won\'t go where you want. Life\'s the same way. Control what you can, accept what you can\'t, and enjoy the walk between shots.',
    word_count: 71,
  },
];

// ============================================================================
// ADDITIONAL MEMORIES (International + Diverse)
// ============================================================================

export const additionalMemories = [
  {
    id: 'memory-051',
    user_id: DEMO_USER_ID,
    title: 'Seeing the Northern Lights in Iceland',
    description: 'Jennifer and I went to Iceland for our 5th anniversary. We stayed in this tiny cabin outside Reykjavik. At 2am, the owner banged on our door - the lights were out. We ran outside in our pajamas, freezing, and watched the sky dance green and purple for an hour. Neither of us said a word. We just held hands.',
    date: '2020-02-15',
    location: 'Reykjavik, Iceland',
    location_lat: 64.1466,
    location_lng: -21.9426,
    media_url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
    tags: ['travel', 'jennifer', 'anniversary', 'bucket-list'],
    shared_with: ['contact-009'],
    is_public: true,
  },
  {
    id: 'memory-052',
    user_id: DEMO_USER_ID,
    title: 'Dad\'s retirement party',
    description: 'After 40 years at the same company, Dad finally retired. We threw him a surprise party. He cried - first time I\'d seen that since Grandpa Bill\'s funeral. He said he was proud of what he built, but prouder of what he\'s going home to. I want to be able to say that someday.',
    date: '2022-06-30',
    location: 'Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1529543544277-590748c03378?w=800',
    tags: ['family', 'dad', 'milestone', 'retirement'],
    shared_with: ['contact-002', 'contact-001'],
    is_public: false,
  },
  {
    id: 'memory-053',
    user_id: DEMO_USER_ID,
    title: 'James\'s first word',
    description: 'We thought it would be "mama" or "dada." It was "no." He said it clear as day, looked right at us, and said "no" to his vegetables. Jennifer and I laughed so hard we cried. He\'s been saying it ever since.',
    date: '2022-08-10',
    location: '842 Maple Lane, Cary, NC',
    location_lat: 35.7915,
    location_lng: -78.7811,
    media_url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800',
    tags: ['kids', 'james', 'milestone', 'funny'],
    shared_with: ['contact-006', 'contact-009'],
    is_public: true,
  },
  {
    id: 'memory-054',
    user_id: DEMO_USER_ID,
    title: 'Hiking Machu Picchu',
    description: 'The four-day Inca Trail with Marcus and Chris. We trained for months. Day three nearly killed us - 14 hours uphill. But when we reached the Sun Gate at sunrise and saw Machu Picchu below, covered in mist... worth every blister.',
    date: '2015-09-20',
    location: 'Machu Picchu, Peru',
    location_lat: -13.1631,
    location_lng: -72.5450,
    media_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    tags: ['travel', 'friends', 'adventure', 'hiking', 'bucket-list'],
    shared_with: ['contact-011', 'contact-017'],
    is_public: true,
  },
  {
    id: 'memory-055',
    user_id: DEMO_USER_ID,
    title: 'Learning to make Grandma\'s daal',
    description: 'Mom finally taught me her mother\'s daal recipe. The one Grandma made every Sunday. The secret is tempering the spices in ghee at the end - cumin seeds, dried chilies, asafoetida. The smell transported me back to Grandma\'s kitchen in India, a place I only visited twice but remember perfectly.',
    date: '2021-11-15',
    location: '5126 Bur Oak Circle, Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
    tags: ['family', 'mom', 'cooking', 'tradition', 'heritage'],
    shared_with: ['contact-001'],
    is_public: true,
  },
  {
    id: 'memory-056',
    user_id: DEMO_USER_ID,
    title: 'The day we adopted Luna',
    description: 'The kids had been asking for a dog for two years. We went to the shelter "just to look." Luna - scruffy, scared, shaking in the corner of her kennel - walked right up to Emma and licked her hand. That was it. She\'s been part of the family ever since.',
    date: '2019-04-13',
    location: 'Wake County Animal Shelter, Raleigh, NC',
    location_lat: 35.7634,
    location_lng: -78.5276,
    media_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    tags: ['family', 'pets', 'kids', 'adoption'],
    shared_with: ['contact-005', 'contact-006', 'contact-009'],
    is_public: true,
  },
  {
    id: 'memory-057',
    user_id: DEMO_USER_ID,
    title: 'Visiting ancestral village in Gujarat',
    description: 'Took the whole family to India in 2019. Visited the village where my grandparents grew up. Met cousins I\'d only seen in photos. Walked the same streets my dad played on as a boy. Emma and James didn\'t fully understand, but they will someday. Roots matter.',
    date: '2019-12-20',
    location: 'Gujarat, India',
    location_lat: 22.2587,
    location_lng: 71.1924,
    media_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
    tags: ['travel', 'family', 'heritage', 'india', 'roots'],
    shared_with: ['contact-001', 'contact-002', 'contact-005', 'contact-006'],
    is_public: true,
  },
  {
    id: 'memory-058',
    user_id: DEMO_USER_ID,
    title: 'Emma standing up to a bully',
    description: 'Got a call from school. My heart dropped. But it wasn\'t bad - Emma had stepped in when a kid was picking on a classmate with special needs. She told the bully to stop. When he didn\'t, she got a teacher. The principal called to praise her courage. I cried the whole drive to pick her up. That\'s my girl.',
    date: '2024-10-15',
    location: 'Davis Drive Elementary, Cary, NC',
    location_lat: 35.7545,
    location_lng: -78.7826,
    media_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    tags: ['kids', 'emma', 'proud', 'character'],
    shared_with: ['contact-005', 'contact-009'],
    is_public: false,
  },
  {
    id: 'memory-059',
    user_id: DEMO_USER_ID,
    title: 'New Year\'s Eve in Times Square',
    description: 'Everyone says don\'t do it. We did it anyway - Jennifer and I, before kids, before everything. Stood in the cold for 8 hours. Couldn\'t feel our toes. Watched the ball drop surrounded by a million strangers. Kissed at midnight. Would I do it again? No. Am I glad we did it once? Absolutely.',
    date: '2011-12-31',
    location: 'Times Square, New York, NY',
    location_lat: 40.7580,
    location_lng: -73.9855,
    media_url: 'https://images.unsplash.com/photo-1546271876-af6caec5fae5?w=800',
    tags: ['travel', 'jennifer', 'new-years', 'adventure', 'bucket-list'],
    shared_with: ['contact-009'],
    is_public: true,
  },
  {
    id: 'memory-060',
    user_id: DEMO_USER_ID,
    title: 'The big promotion (and what it cost)',
    description: 'Got the promotion I\'d been chasing for three years. VP title, corner office, the works. Called Jennifer to celebrate. She was quiet. Then she said, "Emma asked today why you\'re never home for dinner." I took the job. But I also made a change. Home by 6pm, no exceptions. The title wasn\'t worth missing their childhood.',
    date: '2022-03-01',
    location: 'Downtown Raleigh, NC',
    location_lat: 35.7796,
    location_lng: -78.6382,
    media_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    tags: ['career', 'family', 'balance', 'turning-point', 'lessons'],
    shared_with: ['contact-009'],
    is_public: false,
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clear existing data (optional - comment out if you want to preserve)
    console.log('Clearing existing data...');
    await supabase.from('postscripts').delete().neq('id', '');
    await supabase.from('memory_contacts').delete().neq('memory_id', '');
    await supabase.from('memories').delete().neq('id', '');
    await supabase.from('contacts').delete().neq('id', '');
    await supabase.from('pets').delete().neq('id', '');

    // Insert contacts
    console.log('📇 Inserting contacts...');
    const { error: contactsError } = await supabase.from('contacts').insert(contacts);
    if (contactsError) throw contactsError;
    console.log(`   ✓ ${contacts.length} contacts inserted`);

    // Insert pets
    console.log('🐾 Inserting pets...');
    const { error: petsError } = await supabase.from('pets').insert(pets);
    if (petsError) throw petsError;
    console.log(`   ✓ ${pets.length} pets inserted`);

    // Insert memories
    console.log('📝 Inserting memories...');
    const memoriesForInsert = memories.map(({ shared_with, ...memory }) => memory);
    const { error: memoriesError } = await supabase.from('memories').insert(memoriesForInsert);
    if (memoriesError) throw memoriesError;
    console.log(`   ✓ ${memories.length} memories inserted`);

    // Insert memory-contact relationships
    console.log('🔗 Linking memories to contacts...');
    const memoryContacts = memories.flatMap(memory =>
      (memory.shared_with || []).map(contactId => ({
        memory_id: memory.id,
        contact_id: contactId,
      }))
    );
    if (memoryContacts.length > 0) {
      const { error: linkError } = await supabase.from('memory_contacts').insert(memoryContacts);
      if (linkError) throw linkError;
    }
    console.log(`   ✓ ${memoryContacts.length} memory-contact links created`);

    // Insert postscripts
    console.log('💌 Inserting postscripts (TimeDrops)...');
    const { error: postscriptsError } = await supabase.from('postscripts').insert(postscripts);
    if (postscriptsError) throw postscriptsError;
    console.log(`   ✓ ${postscripts.length} postscripts inserted`);

    // Insert knowledge entries
    console.log('🧠 Inserting knowledge entries...');
    const { error: knowledgeError } = await supabase.from('knowledge_entries').insert(knowledgeEntries);
    if (knowledgeError) throw knowledgeError;
    console.log(`   ✓ ${knowledgeEntries.length} knowledge entries inserted`);

    // Insert additional memories
    console.log('📝 Inserting additional memories...');
    const additionalMemoriesForInsert = additionalMemories.map(({ shared_with, ...memory }) => memory);
    const { error: additionalMemoriesError } = await supabase.from('memories').insert(additionalMemoriesForInsert);
    if (additionalMemoriesError) throw additionalMemoriesError;
    console.log(`   ✓ ${additionalMemories.length} additional memories inserted`);

    // Insert additional memory-contact relationships
    const additionalMemoryContacts = additionalMemories.flatMap(memory =>
      (memory.shared_with || []).map(contactId => ({
        memory_id: memory.id,
        contact_id: contactId,
      }))
    );
    if (additionalMemoryContacts.length > 0) {
      await supabase.from('memory_contacts').insert(additionalMemoryContacts);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`
Summary:
- ${contacts.length} contacts (family, friends, professional)
- ${pets.length} pets
- ${memories.length + additionalMemories.length} memories with locations and photos
- ${postscripts.length} scheduled TimeDrops
- ${knowledgeEntries.length} knowledge/wisdom entries
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run if called directly
// seedDatabase();
