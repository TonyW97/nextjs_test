// SUPABASE TABLE
import {db} from '../../db.js';
import Pusher from 'pusher';

export default async (req, res) => {
  const push = req.body;
  console.log('Processing push', JSON.stringify(push));

  const t0 = Date.now();
  try {
    await db.tx(async t => {
      const {nextval: version} = await t.one("SELECT nextval('version')");
      let lastMutationID = await getLastMutationID(t, push.clientID);

      console.log('version', version, 'lastMutationID:', lastMutationID);

      for (const mutation of push.mutations) {
        const t1 = Date.now();

        const expectedMutationID = lastMutationID + 1;

        if (mutation.id < expectedMutationID) {
          console.log(
            `Mutation ${mutation.id} has already been processed - skipping`,
          );
          continue;
        }
        if (mutation.id > expectedMutationID) {
          console.warn(`Mutation ${mutation.id} is from the future - aborting`);
          break;
        }

        console.log('Processing mutation:', JSON.stringify(mutation));

        switch (mutation.name) {
          case 'createRow':
            await createRow(t, mutation.args, version);
            break;
          case 'modifyRow':
            await modifyRow(t, mutation.args, version);
            break;
          default:
            throw new Error(`Unknown mutation: ${mutation.name}`);
        }

        lastMutationID = expectedMutationID;
        console.log('Processed mutation in', Date.now() - t1);
      }

      console.log(
        'setting',
        push.clientID,
        'last_mutation_id to',
        lastMutationID,
      );
      await t.none(
        'UPDATE replicache_client SET last_mutation_id = $2 WHERE id = $1',
        [push.clientID, lastMutationID],
      );
      res.send('{}');
    });

    // We need to await here otherwise, Next.js will frequently kill the request
    // and the poke won't get sent.
    await sendPoke();
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  } finally {
    console.log('Processed push in', Date.now() - t0);
  }
};

async function getLastMutationID(t, clientID) {
  const clientRow = await t.oneOrNone(
    'SELECT last_mutation_id FROM replicache_client WHERE id = $1',
    clientID,
  );
  if (clientRow) {
    return parseInt(clientRow.last_mutation_id);
  }

  console.log('Creating new client', clientID);
  await t.none(
    'INSERT INTO replicache_client (id, last_mutation_id) VALUES ($1, 0)',
    clientID,
  );
  return 0;
}

async function createRow(t, {id, col1, col2, order}, version) {
  await t.none(
    `INSERT INTO row (
    id, col1, col2, ord, version) values 
    ($1, $2, $3, $4, $5)`,
    [id, col1, col2, order, version],
  );
}

async function modifyRow(t, {id, col1, col2, order}, version) {
   await t.none(
    `UPDATE row SET col1 = $2,
    col2 = $3,
    ord = $4,
    version = $5
    WHERE id = $1`,
    [id, col1, col2, order, version],
  ); 
}

// WIP TABLE + PRISMA
/*
import {db} from '../../db.js';
import Pusher from 'pusher';
import { sharedPrisma } from './prisma.js';
import client from '@prisma/client';

export default async(req, res) => {
  const push = req.body;
  console.log('Processing push', JSON.stringify(push));

  const t0 = Date.now();
  const dbVersion = await sharedPrisma.replicache.findFirst.version;
  console.log(dbVersion)
  const version = (dbVersion === null || dbVersion === NaN || dbVersion === undefined) ? 0 : dbVersion + 1;
  let lastMutationID = await getLastMutationID(push.clientID, version);

  console.log('version', version, 'lastMutationID:', lastMutationID);

  let transactions = [];
  for (const mutation of push.mutations) {
    console.log(mutation)
    const t1 = Date.now()

    const expectedMutationID = lastMutationID + 1;

    if (mutation.id < expectedMutationID) {
      console.log(
        `Mutation ${mutation.id} has already been processed - skipping`,
      );
      continue;
    }
    if (mutation.id > expectedMutationID) {
      console.warn(`Mutation ${mutation.id} is from the future - aborting`);
      break;
    }

    console.log('Processing mutation:', JSON.stringify(mutation));

    switch (mutation.name) {
      case 'createMessage':
        transactions.push(sharedPrisma.message.create({
          data: {
            id: mutation.args.id,
            sender: mutation.args.from,
            content: mutation.args.content,
            ord: mutation.args.order,
            version: version
          }}));
        // VER1
        transactions.push(sharedPrisma.message.upsert({
          where: {id: mutation.args.id},
          update: {
            sender: mutation.args.from,
            content: mutation.args.content,
            ord: mutation.args.order,
            version: version
          },
          create: {
            id: mutation.args.id,
            sender: mutation.args.from,
            content: mutation.args.content,
            ord: mutation.args.order,
            version: version
          }
        }))
        // VER2
        transactions.push(sharedPrisma.$queryRaw`INSERT INTO message (
          id, sender, content, ord, version) values 
          (${mutation.args.id} ${mutation.args.from} ${mutation.args.content} ${mutation.args.order} ${mutation.args.version})`)
        break;
        // VER END
      default:
        console.log(`Unknown mutation: ${mutation.name}`)
    }

    lastMutationID = expectedMutationID;
    console.log('Processed mutation in', Date.now() - t1);
    console.log(
      'setting',
      push.clientID,
      'last_mutation_id to',
      lastMutationID,
    );
  }
  // COMMENT START
  transactions.push(sharedPrisma.replicache.update({
    where: {id: push.clientID},
    data: {
      last_mutation_id: lastMutationID,
      version: version
    }
  }))
  //COMMENT END
  await sharedPrisma.$transaction(transactions);
} 

async function getLastMutationID(clientID, version) {
  const lastMutationID = await sharedPrisma.replicache.findFirst({where: {id: clientID}})?.lastMutationID;
  if (lastMutationID) {
    return lastMutationID;
  }

  console.log('Creating new client', clientID);
  sharedPrisma.replicache.create({data: {id: clientID, lastMutationID: 0, version: version}})
  return 0;
}

*/


// ORIGINAL
/*
export default async (req, res) => {
  const push = req.body;
  console.log('Processing push', JSON.stringify(push));

  const t0 = Date.now();
  try {
    await db.tx(async t => {
      const {nextval: version} = await t.one("SELECT nextval('version')");
      let lastMutationID = await getLastMutationID(t, push.clientID);

      console.log('version', version, 'lastMutationID:', lastMutationID);

      for (const mutation of push.mutations) {
        const t1 = Date.now();

        const expectedMutationID = lastMutationID + 1;

        if (mutation.id < expectedMutationID) {
          console.log(
            `Mutation ${mutation.id} has already been processed - skipping`,
          );
          continue;
        }
        if (mutation.id > expectedMutationID) {
          console.warn(`Mutation ${mutation.id} is from the future - aborting`);
          break;
        }

        console.log('Processing mutation:', JSON.stringify(mutation));

        switch (mutation.name) {
          case 'createMessage':
            await createMessage(t, mutation.args, version);
            break;
          default:
            throw new Error(`Unknown mutation: ${mutation.name}`);
        }

        lastMutationID = expectedMutationID;
        console.log('Processed mutation in', Date.now() - t1);
      }

      console.log(
        'setting',
        push.clientID,
        'last_mutation_id to',
        lastMutationID,
      );
      await t.none(
        'UPDATE replicache_client SET last_mutation_id = $2 WHERE id = $1',
        [push.clientID, lastMutationID],
      );
      res.send('{}');
    });

    // We need to await here otherwise, Next.js will frequently kill the request
    // and the poke won't get sent.
    await sendPoke();
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  } finally {
    console.log('Processed push in', Date.now() - t0);
  }
};

async function getLastMutationID(t, clientID) {
  const clientRow = await t.oneOrNone(
    'SELECT last_mutation_id FROM replicache_client WHERE id = $1',
    clientID,
  );
  if (clientRow) {
    return parseInt(clientRow.last_mutation_id);
  }

  console.log('Creating new client', clientID);
  await t.none(
    'INSERT INTO replicache_client (id, last_mutation_id) VALUES ($1, 0)',
    clientID,
  );
  return 0;
}

async function createMessage(t, {id, from, content, order}, version) {
  await t.none(
    `INSERT INTO message (
    id, sender, content, ord, version) values 
    ($1, $2, $3, $4, $5)`,
    [id, from, content, order, version],
  );
}
*/
async function sendPoke() {
    const pusher = new Pusher({
      appId: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY,
      secret: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER,
      useTLS: true,
    });
    const t0 = Date.now();
    await pusher.trigger('default', 'poke', {});
    console.log('Sent poke in', Date.now() - t0);
  }
  