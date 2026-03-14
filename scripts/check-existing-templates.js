const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplates() {
  console.log('📊 Checking prompt_templates table...\n');

  // Get all active templates grouped by category
  const { data: templates } = await supabase
    .from('prompt_templates')
    .select('id, type, category, prompt_text')
    .eq('is_active', true)
    .order('category');

  if (!templates) {
    console.log('Error fetching templates');
    process.exit(1);
  }

  console.log(`Total active templates: ${templates.length}\n`);

  // Group by category
  const byCategory = {};
  templates.forEach(t => {
    const cat = t.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(t);
  });

  console.log('Templates by category:');
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([cat, temps]) => {
      console.log(`  ${cat}: ${temps.length} prompts`);
    });

  // Check for childhood, teenage, high_school, etc.
  console.log('\n\nLife chapter categories:');
  const lifeChapters = ['childhood', 'teenage', 'high_school', 'college', 'jobs_career', 'career', 'relationships', 'travel', 'spirituality', 'faith', 'wisdom_legacy'];
  
  lifeChapters.forEach(ch => {
    const count = byCategory[ch]?.length || 0;
    console.log(`  ${ch}: ${count} prompts`);
    if (count > 0 && count < 5) {
      byCategory[ch].forEach(t => {
        console.log(`    - ${t.prompt_text.substring(0, 60)}...`);
      });
    }
  });

  process.exit(0);
}

checkTemplates();
