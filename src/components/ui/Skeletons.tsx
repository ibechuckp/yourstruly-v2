'use client';

import { motion } from 'framer-motion';

// Base skeleton with shimmer animation
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton ${className}`}>
      <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// ENGAGEMENT BUBBLES SKELETON
// ============================================================================

export function BubblesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bubbles-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="bubble-skeleton"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
        >
          <div className="bubble-header-skeleton">
            <Skeleton className="icon" />
            <Skeleton className="label" />
          </div>
          <Skeleton className="text-line" />
          <Skeleton className="text-line short" />
        </motion.div>
      ))}

      <style jsx>{`
        .bubbles-skeleton {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          padding: 20px;
        }

        .bubble-skeleton {
          width: 180px;
          min-height: 160px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
        }

        .bubble-header-skeleton {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .bubble-header-skeleton :global(.icon) {
          width: 24px;
          height: 24px;
          border-radius: 6px;
        }

        .bubble-header-skeleton :global(.label) {
          width: 60px;
          height: 14px;
        }

        :global(.text-line) {
          height: 14px;
          margin-bottom: 8px;
        }

        :global(.text-line.short) {
          width: 70%;
        }

        @media (max-width: 640px) {
          .bubble-skeleton {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// MEMORY CARD SKELETON
// ============================================================================

export function MemoryCardSkeleton() {
  return (
    <div className="memory-skeleton">
      <Skeleton className="image" />
      <div className="content">
        <Skeleton className="title" />
        <Skeleton className="text" />
        <Skeleton className="text short" />
        <div className="footer">
          <Skeleton className="date" />
          <Skeleton className="tags" />
        </div>
      </div>

      <style jsx>{`
        .memory-skeleton {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        :global(.image) {
          width: 100%;
          height: 180px;
          border-radius: 0;
        }

        .content {
          padding: 16px;
        }

        :global(.title) {
          height: 20px;
          width: 70%;
          margin-bottom: 12px;
        }

        :global(.text) {
          height: 14px;
          margin-bottom: 8px;
        }

        :global(.text.short) {
          width: 50%;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }

        :global(.date) {
          width: 80px;
          height: 14px;
        }

        :global(.tags) {
          width: 100px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// MEMORY GRID SKELETON
// ============================================================================

export function MemoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="memory-grid-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <MemoryCardSkeleton />
        </motion.div>
      ))}

      <style jsx>{`
        .memory-grid-skeleton {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// CONTACT CARD SKELETON
// ============================================================================

export function ContactCardSkeleton() {
  return (
    <div className="contact-skeleton">
      <Skeleton className="avatar" />
      <div className="info">
        <Skeleton className="name" />
        <Skeleton className="relationship" />
      </div>

      <style jsx>{`
        .contact-skeleton {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
        }

        :global(.avatar) {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .info {
          flex: 1;
        }

        :global(.name) {
          width: 120px;
          height: 16px;
          margin-bottom: 6px;
        }

        :global(.relationship) {
          width: 80px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// CONTACT LIST SKELETON
// ============================================================================

export function ContactListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="contact-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <ContactCardSkeleton />
        </motion.div>
      ))}

      <style jsx>{`
        .contact-list-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PROFILE SKELETON
// ============================================================================

export function ProfileSkeleton() {
  return (
    <div className="profile-skeleton">
      <div className="header">
        <Skeleton className="cover" />
        <div className="avatar-container">
          <Skeleton className="avatar" />
        </div>
      </div>
      <div className="content">
        <Skeleton className="name" />
        <Skeleton className="bio" />
        <Skeleton className="bio short" />
        <div className="stats">
          <Skeleton className="stat" />
          <Skeleton className="stat" />
          <Skeleton className="stat" />
        </div>
      </div>

      <style jsx>{`
        .profile-skeleton {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
        }

        .header {
          position: relative;
          padding-bottom: 50px;
        }

        :global(.cover) {
          width: 100%;
          height: 150px;
          border-radius: 0;
        }

        .avatar-container {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
        }

        :global(.avatar) {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 4px solid rgba(30, 30, 40, 1);
        }

        .content {
          padding: 24px;
          text-align: center;
        }

        :global(.name) {
          width: 150px;
          height: 24px;
          margin: 0 auto 16px;
        }

        :global(.bio) {
          height: 14px;
          margin-bottom: 8px;
        }

        :global(.bio.short) {
          width: 60%;
          margin: 0 auto 24px;
        }

        .stats {
          display: flex;
          justify-content: center;
          gap: 24px;
        }

        :global(.stat) {
          width: 60px;
          height: 40px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// DASHBOARD SKELETON
// ============================================================================

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="section">
        <Skeleton className="section-title" />
        <BubblesSkeleton count={5} />
      </div>

      <div className="section">
        <Skeleton className="section-title" />
        <div className="cards-row">
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
        </div>
      </div>

      <style jsx>{`
        .dashboard-skeleton {
          padding: 20px;
        }

        .section {
          margin-bottom: 40px;
        }

        :global(.section-title) {
          width: 150px;
          height: 24px;
          margin-bottom: 20px;
        }

        .cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// KNOWLEDGE ENTRY SKELETON
// ============================================================================

export function KnowledgeCardSkeleton() {
  return (
    <div className="knowledge-skeleton">
      <div className="header">
        <Skeleton className="category-icon" />
        <Skeleton className="category" />
      </div>
      <Skeleton className="question" />
      <Skeleton className="answer-line" />
      <Skeleton className="answer-line" />
      <Skeleton className="answer-line short" />

      <style jsx>{`
        .knowledge-skeleton {
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        :global(.category-icon) {
          width: 24px;
          height: 24px;
          border-radius: 6px;
        }

        :global(.category) {
          width: 80px;
          height: 14px;
        }

        :global(.question) {
          height: 18px;
          margin-bottom: 16px;
        }

        :global(.answer-line) {
          height: 14px;
          margin-bottom: 8px;
        }

        :global(.answer-line.short) {
          width: 60%;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// FULL PAGE LOADING
// ============================================================================

export function PageLoadingSkeleton() {
  return (
    <div className="page-loading">
      <motion.div
        className="logo-pulse"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        YT
      </motion.div>
      <p>Loading your story...</p>

      <style jsx>{`
        .page-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .logo-pulse {
          font-size: 48px;
          font-weight: 700;
          color: #6f6fd2;
          margin-bottom: 16px;
        }

        p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
