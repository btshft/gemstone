import { Injectable, Logger } from '@nestjs/common';
import * as Scraper from 'tiktok-scraper';
import { Downloader } from 'tiktok-scraper';
import { RoundRobinPool } from './pool.round-robin';

@Injectable()
export class TtService {
  private readonly logger = new Logger(TtService.name);
  private readonly sessionPool: RoundRobinPool<string>;

  constructor(sessions: string[]) {
    this.sessionPool = new RoundRobinPool(sessions);
  }

  public async video(url: string): Promise<Buffer | null> {
    const session = this.sessionPool.rent();
    try {
      const result = await Scraper.getVideoMeta(url, {
        hdVideo: false,
        noWaterMark: false,
        sessionList: [session.$value],
      });

      this.logger.log({
        message: 'Video metadata downloaded',
        url: url,
      });

      if (result.collector?.length) {
        const [video] = result.collector;
        const downloader = this.createDownloader(result.headers);

        return await downloader.toBuffer(video);
      }

      return null;
    } finally {
      this.sessionPool.return(session);
    }
  }

  private createDownloader(headers: Scraper.Headers): Downloader {
    return new Downloader({
      noWaterMark: false,
      bulk: false,
      filepath: '',
      progress: false,
      proxy: '',
      headers: headers,
    });
  }
}
