# Engagement System Philosophy

## Core Principle: Everything is a Thread to Pull

The engagement system should **never** ask generic questions. Every prompt should reference something the user has **already shared** and ask for deeper context, stories, or connections.

## The User's Data is the Source

Every piece of data the user provides is a seed for engagement:

### Profile Data → Personal Questions
| User Data | Example Prompts |
|-----------|-----------------|
| Interest: "Photography" | "Who taught you photography?" / "What was the first photo you were really proud of?" |
| Skill: "Cooking" | "What's your signature dish?" / "Whose recipe do you still use?" |
| Hobby: "Hiking" | "What's the most memorable trail you've hiked?" / "Who do you usually hike with?" |

### Lists → Story Prompts
| User Data | Example Prompts |
|-----------|-----------------|
| Movie: "The Godfather" | "Who introduced you to this film?" / "What scene hits you the hardest?" |
| Book: "To Kill a Mockingbird" | "When did you first read this?" / "What lesson from it stuck with you?" |
| Song: "Bohemian Rhapsody" | "What memory does this song bring back?" / "Who did you first hear it with?" |

### Contacts → Relationship Questions
| User Data | Example Prompts |
|-----------|-----------------|
| Contact: "Mom" | "What's your earliest memory with Mom?" / "What did she teach you that stuck?" |
| Contact: "Best Friend Jake" | "How did you and Jake meet?" / "What's your favorite adventure together?" |
| Contact: missing birthday | "When is [name]'s birthday?" (functional, but still personal) |

### Existing Memories → Follow-up Questions
| User Data | Example Prompts |
|-----------|-----------------|
| Memory about graduation | "Who was there celebrating with you?" / "What were you feeling that day?" |
| Memory without photo | "Do you have a photo from that day?" / "What would a photo of that moment look like?" |
| Memory with unnamed people | "Who else was in this photo?" |

## Prompt Types & Where They Live

**All user content lives in Memories.** Different prompt types create memories with different tags:

| Prompt Type | Creates | Tags |
|-------------|---------|------|
| `photo_backstory` | Memory + linked photo | `photo story` |
| `memory_prompt` | Memory | `memory`, category |
| `knowledge` (wisdom) | Memory | `wisdom`, related interest/skill |
| `missing_info` | Contact update | (updates contact, no memory) |
| `favorites_firsts` | Memory | `favorites`, `firsts` |

## Smart Generation Rules

### 1. Never Repeat
- Track which topics/contacts/items have been prompted recently
- Rotate through the user's data systematically
- Don't ask about the same contact twice in a week

### 2. Context-Aware Timing
- Birthday prompts near actual birthdays
- Holiday-themed prompts in season
- Anniversary prompts when relevant

### 3. Progressive Depth
- First prompt about a contact: "How did you meet?"
- Second prompt: "What's a favorite memory together?"
- Third prompt: "What have they taught you?"

### 4. Balance Types
- Mix photo prompts with text prompts
- Alternate between light (favorites) and deep (wisdom)
- Don't overwhelm with contact updates

## Example Prompt Generation Flow

```
User Profile:
- Interests: Photography, Travel, Cooking
- Contacts: Mom, Dad, Best Friend Sarah
- Movies: The Shawshank Redemption, Amélie

Generated Prompts (diverse, personal):
1. 📸 "What's the story behind this photo?" (untagged photo)
2. 💭 "What's a lesson Mom taught you that you still use today?" (contact + wisdom)
3. 🎬 "Why does The Shawshank Redemption resonate with you?" (movie list)
4. 👤 "When is Sarah's birthday?" (missing contact info)
5. 🧠 "What's something Photography has taught you about life?" (interest + wisdom)
```

## What NOT to Do

❌ "Tell us about a happy memory" (generic)
❌ "What are you grateful for?" (generic)
❌ "Describe your childhood" (too broad)
❌ Same question to everyone (not personal)

## What TO Do

✅ "Tell us about the first time you tried [user's hobby]"
✅ "What did [specific contact] teach you?"
✅ "Why is [specific movie from their list] special to you?"
✅ "What's the story behind [specific photo they uploaded]?"

---

## Implementation Notes

The `generate_engagement_prompts` database function should:
1. Query user's profile (interests, skills, hobbies)
2. Query user's contacts (prioritize those missing info or not mentioned recently)
3. Query user's media (photos without backstories)
4. Query user's lists (movies, books, music without context)
5. Generate prompts that reference SPECIFIC items from the above
6. Track prompt history to avoid repetition
7. Weight by priority (photos needing stories > generic questions)
