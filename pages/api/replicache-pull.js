import {db} from '../../db.js';

// SUPABASE Table
export default async (req, res) => {
  const pull = req.body;
  console.log(`Processing pull`, JSON.stringify(pull));
  const t0 = Date.now();

  try {
    await db.tx(async t => {
      const lastMutationID = parseInt(
        (
          await t.oneOrNone(
            'select last_mutation_id from replicache_client where id = $1',
            pull.clientID,
          )
        )?.last_mutation_id ?? '0',
      );
      const changed = await t.manyOrNone(
        'select id, col1, col2, ord from row where version > $1',
        parseInt(pull.cookie ?? 0),
      );
      const cookie = (
        await t.one('select max(version) as version from row')
      ).version;
      console.log({cookie, lastMutationID, changed});

      const patch = [];
      if (pull.cookie === null) {
        patch.push({
          op: 'clear',
        });
      }

      patch.push(
        ...changed.map(row => ({
          op: 'put',
          key: `row/${row.id}`,
          value: {
            col1: row.col1,
            col2: row.col2,
            order: parseInt(row.ord),
          },
        })),
      );

      res.json({
        lastMutationID,
        cookie,
        patch,
      });
      res.end();
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  } finally {
    console.log('Processed pull in', Date.now() - t0);
  }
};

// WIP/NOT WORKING: prisma+planetscale table
/*import {db} from '../../db.js';
import { sharedPrisma } from './prisma.js';

export default async (req, res) => {
  const pull = req.body;
  console.log(`Processing pull`, JSON.stringify(pull));
  const t0 = Date.now();
  
  const lastMutationID = await sharedPrisma.replicache.findFirst({where: {id: pull.id}})?.lastMutationID ?? 0;
  console.log(lastMutationID);

  const changed = await sharedPrisma.message.findMany({where: {version: {gt: parseInt(pull.cookie) || 0}}})
  const cookie = await sharedPrisma.message.findFirst({orderBy: {version: "desc"}});
  console.log({cookie, lastMutationID, changed});

  const patch = [];
  if (pull.cookie === null) {
    patch.push({
      op: 'clear',
    });
  }

  patch.push(
    ...changed.map(row => ({
      op: 'put',
      key: `message/${row.id}`,
      value: {
        from: row.sender,
        content: row.content,
        order: parseInt(row.ord),
      },
    })),
  );

  res.json({
    lastMutationID,
    cookie,
    patch,
  });
  res.end();
  console.log('Processed pull in', Date.now() - t0);
}*/

// ORIGINAL (chat app)
/*
export default async (req, res) => {
  const pull = req.body;
  console.log(`Processing pull`, JSON.stringify(pull));
  const t0 = Date.now();

  try {
    await db.tx(async t => {
      const lastMutationID = parseInt(
        (
          await t.oneOrNone(
            'select last_mutation_id from replicache_client where id = $1',
            pull.clientID,
          )
        )?.last_mutation_id ?? '0',
      );
      const changed = await t.manyOrNone(
        'select id, sender, content, ord from message where version > $1',
        parseInt(pull.cookie ?? 0),
      );
      const cookie = (
        await t.one('select max(version) as version from message')
      ).version;
      console.log({cookie, lastMutationID, changed});

      const patch = [];
      if (pull.cookie === null) {
        patch.push({
          op: 'clear',
        });
      }

      patch.push(
        ...changed.map(row => ({
          op: 'put',
          key: `message/${row.id}`,
          value: {
            from: row.sender,
            content: row.content,
            order: parseInt(row.ord),
          },
        })),
      );

      res.json({
        lastMutationID,
        cookie,
        patch,
      });
      res.end();
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  } finally {
    console.log('Processed pull in', Date.now() - t0);
  }
};
 */