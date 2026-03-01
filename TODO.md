
## Future Migration: Supabase → AWS

**Status:** Planned (after app changes complete)

### Approach
- Create NEW RDS PostgreSQL instance (don't touch existing yourstruly-db)
- Migrate to AWS Cognito for auth
- Direct RDS connection instead of Supabase client
- S3 for storage

### Steps (when ready)
1. Create new RDS PostgreSQL instance
2. Export Supabase schema + data
3. Import to new RDS
4. Set up AWS Cognito user pool
5. Update auth code to use Cognito
6. Update database queries (remove Supabase client, use direct pg)
7. Migrate storage to S3
8. Test thoroughly
9. Switch over

### Why
- Consolidate on AWS infrastructure
- Reduce vendor dependencies
- Better long-term control

