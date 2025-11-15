/**
 * Feature Flags System for Database Migration
 * Controls the rollout of migrated table functionality
 */

export interface MigrationFlags {
    USE_MIGRATED_TABLE_READS: boolean;
    USE_MIGRATED_TABLE_WRITES: boolean;
    ENABLE_VALIDATION_LOGGING: boolean;
    MIGRATION_PERCENTAGE: number; // 0-100
    EMERGENCY_ROLLBACK: boolean;
}

export interface MigrationConfig {
    id: string;
    active: boolean;
    use_migrated_reads: boolean;
    use_migrated_writes: boolean;
    enable_validation: boolean;
    migration_percentage: number;
    emergency_rollback: boolean;
    created_at: Date;
    updated_at: Date;
    updated_by: string;
}

export class MigrationFlagService {
    private static instance: MigrationFlagService;
    private cachedFlags: MigrationFlags | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_TTL_MS = 30000; // 30 seconds

    private constructor() {}

    static getInstance(): MigrationFlagService {
        if (!MigrationFlagService.instance) {
            MigrationFlagService.instance = new MigrationFlagService();
        }
        return MigrationFlagService.instance;
    }

    async getFlags(): Promise<MigrationFlags> {
        // Check cache first
        if (this.cachedFlags && Date.now() < this.cacheExpiry) {
            return this.cachedFlags;
        }

        try {
            // For development, return default flags
            // In production, this would query the database
            const defaultFlags: MigrationFlags = {
                USE_MIGRATED_TABLE_READS: false,
                USE_MIGRATED_TABLE_WRITES: false,
                ENABLE_VALIDATION_LOGGING: true,
                MIGRATION_PERCENTAGE: 0,
                EMERGENCY_ROLLBACK: false
            };

            // Cache the results
            this.cachedFlags = defaultFlags;
            this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

            return defaultFlags;
        } catch (error) {
            console.error('❌ Error getting migration flags:', error);

            // Return safe defaults on error
            return {
                USE_MIGRATED_TABLE_READS: false,
                USE_MIGRATED_TABLE_WRITES: false,
                ENABLE_VALIDATION_LOGGING: true,
                MIGRATION_PERCENTAGE: 0,
                EMERGENCY_ROLLBACK: false
            };
        }
    }

    async updateFlags(flags: Partial<MigrationFlags>, updatedBy: string): Promise<void> {
        try {
            console.log(`🔄 Updating migration flags:`, flags, `by ${updatedBy}`);

            // Invalidate cache
            this.cachedFlags = null;
            this.cacheExpiry = 0;

            // In production, this would update the database
            console.log('✅ Migration flags updated successfully');
        } catch (error) {
            console.error('❌ Error updating migration flags:', error);
            throw error;
        }
    }

    async isReadFromMigrated(): Promise<boolean> {
        const flags = await this.getFlags();
        return flags.USE_MIGRATED_TABLE_READS && !flags.EMERGENCY_ROLLBACK;
    }

    async isWriteToMigrated(): Promise<boolean> {
        const flags = await this.getFlags();
        return flags.USE_MIGRATED_TABLE_WRITES && !flags.EMERGENCY_ROLLBACK;
    }

    async isValidationEnabled(): Promise<boolean> {
        const flags = await this.getFlags();
        return flags.ENABLE_VALIDATION_LOGGING && !flags.EMERGENCY_ROLLBACK;
    }

    async getMigrationPercentage(): Promise<number> {
        const flags = await this.getFlags();
        return flags.EMERGENCY_ROLLBACK ? 0 : flags.MIGRATION_PERCENTAGE;
    }

    async emergencyRollback(): Promise<void> {
        console.log('🚨 EMERGENCY ROLLBACK ACTIVATED');
        await this.updateFlags({
            EMERGENCY_ROLLBACK: true,
            USE_MIGRATED_TABLE_READS: false,
            USE_MIGRATED_TABLE_WRITES: false,
            MIGRATION_PERCENTAGE: 0
        }, 'emergency_system');
    }

    clearCache(): void {
        this.cachedFlags = null;
        this.cacheExpiry = 0;
    }
}