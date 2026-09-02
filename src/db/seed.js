import { query } from '../lib/database.js';
import logger from '../utils/logger.js';

export const seedDatabase = async () => {
  try {
    logger.info('Seeding database with fresh initial records...');

    // Seed Events
    await query(`
      INSERT INTO events (title, slug, description, event_type, start_date, end_date, location, capacity, status)
      VALUES 
        ('HackShastra National Hackathon 2026', 'hackshastra-national-2026', 'India Premier 36-Hour Student Hackathon & Innovation Codefest at SRM University-AP', 'HACKATHON', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 'SRM University-AP, Amaravati', 500, 'PUBLISHED'),
        ('AI & Web3 Innovation Bootcamp', 'ai-web3-bootcamp-2026', 'Hands-on Masterclasses, Live Project Build Sessions & Industry Creator Mentorship', 'WORKSHOP', NOW() + INTERVAL '14 days', NOW() + INTERVAL '15 days', 'SRM AP Central Auditorium', 250, 'PUBLISHED')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed Blogs
    await query(`
      INSERT INTO blogs (title, slug, excerpt, content, author_name, tags, status, published_at)
      VALUES 
        ('Building Scalable Web3 Apps at HackShastra', 'building-scalable-web3-apps', 'Learn how student developers are creating high-speed decentralized tools.', 'Detailed technical walkthrough of decentralized app development, smart contracts, and agentic workflows...', 'Uday Sharma', ARRAY['Web3', 'Blockchain', 'Tutorial'], 'PUBLISHED', NOW()),
        ('Why Creator-Led Tech Communities Are the Future', 'creator-led-tech-communities', 'Discover why student builders thrive in project-first hacker environments.', 'Traditional lectures are giving way to live build sprints, hackathons, and open source collaboration...', 'Aniket Ghule', ARRAY['Community', 'Hackathon', 'Culture'], 'PUBLISHED', NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed Projects
    await query(`
      INSERT INTO projects (title, description, tech_stack, github_url, live_url, submitter_name, submitter_email, status)
      VALUES 
        ('CipherCore AI Agent', 'Autonomous AI agent assistant for student project management', ARRAY['TypeScript', 'React', 'Python', 'FastAPI'], 'https://github.com/hackshastra/cipher-core', 'https://cipher.hackshastra.org', 'Rishabh Surana', 'rishabh@srmap.edu.in', 'APPROVED'),
        ('BlockForge DEX', 'Lightweight decentralized token swap built during BlockForge 2026', ARRAY['Solidity', 'Ethers.js', 'Next.js'], 'https://github.com/hackshastra/blockforge-dex', 'https://dex.hackshastra.org', 'Venkata Ramana', 'venkata@srmap.edu.in', 'APPROVED');
    `);

    // Seed Site Content
    await query(`
      INSERT INTO site_contents (key, title, content, metadata)
      VALUES 
        ('hero', 'HackShastra SRM-AP', 'Student Chapter - Creator Led Movement', '{"banner": "HackShastra 2026 Active"}'),
        ('manifesto', 'Our Mission', 'Building India premier creator-led student hacker community.', '{"version": "2026.1"}')
      ON CONFLICT (key) DO NOTHING;
    `);

    logger.info('Database seeded successfully!');
  } catch (error) {
    logger.error('Failed to seed database:', error.message);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
