import { Injectable } from '@nestjs/common';
import { https } from 'follow-redirects';
import url from 'url';

type ExpandedUrl = {
  original: string;
  resolved: string;
};

@Injectable()
export class UrlService {
  async expand(source: string): Promise<ExpandedUrl> {
    const sourceUrl = new url.URL(source);

    return new Promise((resolve, reject) => {
      try {
        const rq = https.request(
          {
            host: sourceUrl.host,
            path: sourceUrl.pathname,
            protocol: sourceUrl.protocol,
            port: sourceUrl.port,
            headers: {
              'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36',
              cookie:
                'tt_webid=6933156765236905477; tt_webid_v2=6933156765236905477; d_ticket=8af1961d8d63d7304738d5c3f3e539da851b4;',
            },
          },
          (res) => {
            res.on('error', reject);
            resolve({
              original: source,
              resolved: res.responseUrl,
            });
          },
        );

        rq.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
