
import React, { useEffect, useRef, useMemo, useState } from "react";
import {Replicache} from 'replicache';
import {useSubscribe} from 'replicache-react';
import {nanoid} from 'nanoid';
import Pusher from 'pusher-js';


export default function Home() {
  const [rep, setRep] = useState(null);

  useEffect(async () => {
    const rep = new Replicache({
      name: 'chat-user-id',
      pushURL: '/api/replicache-push',
      pullURL: '/api/replicache-pull',
      mutators: {
        async createRow(tx, {id, col1, col2, order}) {
          await tx.put(`row/${id}`, {
            col1,
            col2,
            order,
          });
        },
        async modifyRow(tx, {id, col1, col2, order}) {
          await tx.put(`row/${id}`, {
            col1,
            col2,
            order,
          });
        },
      },
    });
    listen(rep);
    setRep(rep);
  }, []);

  return (
      rep && <Chat rep={rep} />
  );
}
function Chat({rep}) {

  const columns = React.useMemo(
    () => [
      {
        Header: "Column 1",
        accessor: "col1" // accessor is the "key" in the data
      },
      {
        Header: "Column 2",
        accessor: "col2"
      }
    ],
    []
  );
  const data = useSubscribe(
    rep,
    async tx => {
      // Note: Replicache also supports secondary indexes, which can be used
      // with scan. See:
      // https://js.replicachedev/classes/replicache.html#createindex
      const list = await tx.scan({prefix: 'row/'}).entries().toArray();
      list.sort(([, {order: a}], [, {order: b}]) => a - b);
      return list;
    },
    [],
  );

  const usernameRef = useRef();
  const contentRef = useRef();

  const onSubmit = e => {
    e.preventDefault();
    const last = messages.length && messages[messages.length - 1][1];
    const order = (last?.order ?? 0) + 1;
    rep.mutate.createRow({
      id: nanoid(),
      from: usernameRef.current.value,
      content: contentRef.current.value,
      order,
    });
    contentRef.current.value = '';
  };

  const onAddRow = e => {
    e.preventDefault();
    const last = data.length && data[data.length - 1][1];
    const order = (last?.order ?? 0) + 1;
    rep.mutate.createRow({
      id: nanoid(),
      col1: "",
      col2: "",
      order,
    });
  };

  return (
    <div>
      <table>
      <thead>
          <tr>
        {columns.map((headerGroup) => (
              <th style={{textAlign: "left"}}>
                {headerGroup.Header}
              </th>
        ))}
          </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
                const onChangeCol1 = (e) => {
                  const newValue = e.currentTarget.value;
                  const curRow = row[1];
                  if (curRow != null) {
                    rep.mutate.modifyRow({
                      id: row[0].split('/')[1],
                      col1: newValue,
                      col2: curRow.col2,
                      order: curRow.order
                    })
                  }
                }
                const onChangeCol2 = (e) => {
                  const newValue = e.currentTarget.value;
                  const curRow = row[1];
                  if (curRow != null) {
                    rep.mutate.modifyRow({
                      id: row[0].split('/')[1],
                      col1: curRow.col1,
                      col2: newValue,
                      order: curRow.order
                    })
                  }
                }
          return (
            <tr>
            <input value={row[1].col1} onChange={onChangeCol1}></input>
            <input value={row[1].col2} onChange={onChangeCol2}></input>
            </tr>
          );
        })}
      </tbody>
      </table>
    <button onClick={onAddRow}>Click to add new row</button>
    </div>
  );
}

function listen(rep) {
  console.log(process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY);
  // Listen for pokes, and pull whenever we get one.
  const pusher = new Pusher(process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER,
  });
  const channel = pusher.subscribe('default');
  channel.bind('poke', () => {
    console.log('got poked');
    rep.pull();
  });
}

// ORIGINAL
/*
import React, {useEffect, useRef, useState} from 'react';
import {Replicache} from 'replicache';
import {useSubscribe} from 'replicache-react';
import {nanoid} from 'nanoid';
import Pusher from 'pusher-js';

export default function Home() {
  const [rep, setRep] = useState(null);

  useEffect(async () => {
    const rep = new Replicache({
      name: 'chat-user-id',
      pushURL: '/api/replicache-push',
      pullURL: '/api/replicache-pull',
      mutators: {
        async createMessage(tx, {id, from, content, order}) {
          await tx.put(`message/${id}`, {
            from,
            content,
            order,
          });
        },
      },
    });
    listen(rep);
    setRep(rep);
  }, []);

  return rep && <Chat rep={rep} />;
}

function Chat({rep}) {
  const messages = useSubscribe(
    rep,
    async tx => {
      // Note: Replicache also supports secondary indexes, which can be used
      // with scan. See:
      // https://js.replicachedev/classes/replicache.html#createindex
      const list = await tx.scan({prefix: 'message/'}).entries().toArray();
      list.sort(([, {order: a}], [, {order: b}]) => a - b);
      return list;
    },
    [],
  );

  const usernameRef = useRef();
  const contentRef = useRef();

  const onSubmit = e => {
    e.preventDefault();
    const last = messages.length && messages[messages.length - 1][1];
    const order = (last?.order ?? 0) + 1;
    rep.mutate.createMessage({
      id: nanoid(),
      from: usernameRef.current.value,
      content: contentRef.current.value,
      order,
    });
    contentRef.current.value = '';
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={onSubmit}>
        <input ref={usernameRef} style={styles.username} required />
        says:
        <input ref={contentRef} style={styles.content} required />
        <input type="submit" />
      </form>
      <MessageList messages={messages} />
    </div>
  );
}

function MessageList({messages}) {
  return messages.map(([k, v]) => {
    return (
      <div key={k}>
        <b>{v.from}: </b>
        {v.content}
      </div>
    );
  });
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  form: {
    display: 'flex',
    flexDirection: 'row',
    flex: 0,
    marginBottom: '1em',
  },
  username: {
    flex: 0,
    marginRight: '1em',
  },
  content: {
    flex: 1,
    maxWidth: '30em',
    margin: '0 1em',
  },
};

function listen(rep) {
  console.log(process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY);
  // Listen for pokes, and pull whenever we get one.
  const pusher = new Pusher(process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER,
  });
  const channel = pusher.subscribe('default');
  channel.bind('poke', () => {
    console.log('got poked');
    rep.pull();
  });
}

*/