import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import * as express from 'express';
import { activityPub } from 'activitypub-core-server-express';
import { MongoClient } from 'mongodb';
import { MongoDbAdapter } from 'activitypub-core-db-mongo';
import { FirebaseAuthAdapter } from 'activitypub-core-auth-firebase';
import { FtpStorageAdapter } from 'activitypub-core-storage-ftp';
import { DeliveryAdapter } from 'activitypub-core-delivery';
import { ServiceAccount } from 'firebase-admin';
import { ServerResponse, IncomingMessage } from 'http';
import { getId, LOCAL_DOMAIN } from 'activitypub-core-utilities';
import * as nunjucks from 'nunjucks';
import { AP } from 'activitypub-core-types';
import * as path from 'path';
import { GroupsPlugin } from 'activitypub-core-plugin-groups';

const app = express.default();
app.use(express.static(path.resolve(__dirname, '../static')));

const nunjucksConfig = nunjucks.configure('views', {
  autoescape: true,
});

nunjucksConfig.addFilter('getHostname', (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return '';
  }
});

nunjucksConfig.addFilter('getPathname', (url: string) => {
  try {
    return new URL(url).pathname;
  } catch (error) {
    return '';
  }
});

nunjucksConfig.addFilter('getId', (entity: AP.Entity) => {
  return getId(entity)?.toString() ?? '';
});

nunjucksConfig.addFilter('dateFromNow', (dateString: string) => {
  const date = new Date(dateString);
  const nowDate = Date.now();
  const rft = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  const intervals = [
    { ge: YEAR, divisor: YEAR, unit: 'year' },
    { ge: MONTH, divisor: MONTH, unit: 'month' },
    { ge: WEEK, divisor: WEEK, unit: 'week' },
    { ge: DAY, divisor: DAY, unit: 'day' },
    { ge: HOUR, divisor: HOUR, unit: 'hour' },
    { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
    { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
    { ge: 0, divisor: 1, text: 'just now' },
  ];
  const now = new Date(nowDate).getTime();
  const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
  const diffAbs = Math.abs(diff);
  for (const interval of intervals) {
    if (diffAbs >= interval.ge) {
      const x = Math.round(Math.abs(diff) / interval.divisor);
      const isFuture = diff < 0;
      return interval.unit ? rft.format(isFuture ? x : -x, interval.unit as unknown as Intl.RelativeTimeFormatUnit) : interval.text;
    }
  }
})

const envServiceAccount = process.env.AP_SERVICE_ACCOUNT;

if (!envServiceAccount) {
  throw new Error('Bad Service Account.');
}

const firebaseServiceAccount: ServiceAccount = JSON.parse(decodeURIComponent(envServiceAccount));

const firebaseAuthAdapter =
  new FirebaseAuthAdapter(
    firebaseServiceAccount,
    'pickpuck-com'
  );

const ftpStorageAdapter =
  new FtpStorageAdapter(
    JSON.parse(decodeURIComponent(process.env.AP_FTP_CONFIG)),
    '/uploads'
  );

const renderLoginPage = async (): Promise<string> => {
  return nunjucks.render('login.html');
};

const renderHomePage = async (homePageProps: {
  actor: AP.Actor;
  shared: AP.Announce[];
  requests: AP.Follow[];
  members: AP.Actor[];
  blocks: AP.Block[];
}): Promise<string> => {
  return nunjucks.render('home.html', homePageProps);
};

const renderEntityPage = async (entityPageProps: { entity: AP.Entity; actor?: AP.Actor; shared: AP.Announce[]; followersCount: number; }): Promise<string> => {
  return nunjucks.render('entity.html', entityPageProps);
};

(async () => {
  const mongoClient = new MongoClient(process.env.AP_MONGO_CLIENT_URL ?? 'mongodb://127.0.0.1:27017');
  await mongoClient.connect();
  const mongoDb = mongoClient.db(process.env.AP_MONGO_DB_NAME ?? 'groups');

  const mongoDbAdapter =
    new MongoDbAdapter(mongoDb);

  const defaultDeliveryAdapter =
    new DeliveryAdapter({
      adapters: {
        db: mongoDbAdapter,
      },
    });
    
  app.use(
    activityPub({
      pages: {
        login: renderLoginPage,
        home: renderHomePage,
        entity: renderEntityPage,
      },

      adapters: {
        auth: firebaseAuthAdapter,
        db: mongoDbAdapter,
        delivery: defaultDeliveryAdapter,
        storage: ftpStorageAdapter,
      },
      plugins: [
        GroupsPlugin(),
        {
          generateActorId: () => (preferredUsername: string) => {
            return `${LOCAL_DOMAIN}/@${preferredUsername}`;
          },
        }
      ]
    }),
  );

  app.listen(process.env.PORT ?? 3000, () => {
    console.log('Running...');
  });
})();