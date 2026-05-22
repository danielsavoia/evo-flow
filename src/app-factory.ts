import { RunMode } from './modules/processing/enums/run-mode.enum';
import { getProcessingConfig } from './modules/processing/config/processing.config';

export class AppFactory {
  /**
   * Returns true when Temporal should be used.
   *
   * Resolution order:
   * 1. TEMPORAL_ENABLED=false|0|no  → disabled (explicit opt-out)
   * 2. TEMPORAL_ENABLED=true|1|yes  → enabled (explicit opt-in)
   * 3. RUN_MODE=single + QUEUE_MODE=redis → disabled by default
   *    (beta / single-node deployments without a Temporal server)
   * 4. Otherwise → enabled (dedicated worker modes expect Temporal)
   */
  static isTemporalEnabled(): boolean {
    const explicit = (process.env.TEMPORAL_ENABLED || '').toLowerCase();
    if (explicit === 'false' || explicit === '0' || explicit === 'no')
      return false;
    if (explicit === 'true' || explicit === '1' || explicit === 'yes')
      return true;

    const runMode = (process.env.RUN_MODE || '').toLowerCase();
    const queueMode = (
      process.env.QUEUE_MODE ||
      'kafka'
    ).toLowerCase();
    if (runMode === 'single' && queueMode === 'redis') return false;

    return true;
  }

  static shouldStartHttpServer(): boolean {
    const config = getProcessingConfig();
    // Only API and SINGLE modes need HTTP server
    return [
      RunMode.SINGLE, // Development: everything
      RunMode.API, // Production: API gateway only
    ].includes(config.runMode);
  }

  static shouldStartEventWorker(): boolean {
    const config = getProcessingConfig();
    // Event worker modes
    return [
      RunMode.SINGLE, // Development: all workers
      RunMode.EVENT_WORKER, // Production: dedicated event worker
    ].includes(config.runMode);
  }

  static shouldStartSegmentWorker(): boolean {
    const config = getProcessingConfig();
    // Segment worker modes
    return [
      RunMode.SINGLE, // Development: all workers
      RunMode.SEGMENT_WORKER, // Production: dedicated segment worker
    ].includes(config.runMode);
  }

  static shouldStartJourneyWorker(): boolean {
    if (!AppFactory.isTemporalEnabled()) return false;
    const config = getProcessingConfig();
    // Journey worker modes
    return [
      RunMode.SINGLE, // Development: all workers
      RunMode.TEMPORAL_WORKER, // Production: dedicated journey worker
    ].includes(config.runMode);
  }

  static shouldStartCampaignWorker(): boolean {
    if (!AppFactory.isTemporalEnabled()) return false;
    const config = getProcessingConfig();
    // Campaign worker modes
    return [
      RunMode.SINGLE, // Development: all workers
      RunMode.CAMPAIGN_WORKER, // Production: dedicated campaign worker
    ].includes(config.runMode);
  }

  static shouldStartTemporalWorker(): boolean {
    // Backward-compatible helper used for TemporalModule import decisions
    return (
      AppFactory.shouldStartJourneyWorker() ||
      AppFactory.shouldStartCampaignWorker()
    );
  }
}
