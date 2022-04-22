import { RoomProvider, useBroadcastEvent, useEventListener, useList, useUpdateMyPresence, useMap, useOthers, useBatch, useObject } from "@liveblocks/react";
import React, { useEffect, useMemo, useState } from "react";
import MaterialTable from 'material-table'
import { Column, useTable } from "react-table";
import Cursor from "../../components/Cursor"
import { Presence, User } from "@liveblocks/client";
import { stringify } from "querystring";

type Row = {
  col1: string;
  col2: string;
};

export default function Room() {
  return (
    <RoomProvider id="table-storage-v4">
      <Table />
    </RoomProvider>
  );
}

function Table() {
  const data = useList<Row>("rows", [
    {
      col1: "Test11",
      col2: "Test12"
    }, 
    {
      col1: "Test21",
      col2: "Test22"
    },
    {
      col1: "Test31",
      col2: "Test32"
    }
  ]);

  const selected = useObject<Record<number, string>>("selected");
  const batch = useBatch();
  const broadcast = useBroadcastEvent();
  const id = useMemo(() => Math.random() * 10000, []);

  useEventListener(({ connectionId, event: BroadcastEvent }) => {
    console.log('here')
  });

  const [trigger , triggerUpdate]= useState(0);

  const columns: Column<{ col1: string; col2: string }>[] = React.useMemo(
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
  const updateMyPresence = useUpdateMyPresence()
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateMyPresence({
      cursor: {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY)
      }
    })
  }

  const onPointerLeave = () => {
    updateMyPresence({ cursor: null })
  }

  const others = useOthers()

  // Function to display a user's presence
  const showOther = (user: User<Presence>) => {
    // If presence or cursor null or undefined, don't display
    if (!user.presence || !user.presence.cursor) {
      return null
    }

    // Display cursor
    const { x, y } = (user.presence as any).cursor
    return (
      <Cursor key={user.connectionId} x={x} y={y} />
    )
  }

  /*const tableData = useMemo(() => {
    
    let tableData: Row[] = [];
    if (data != null) {
      const it = data.values()
      while (true) {
        const res = it.next();
        if (res.done) break;
        tableData.push(res.value);
      }
    }
    tableData.sort((a, b) => a.id - b.id )
    console.log(tableData);
    console.log("-------")
    return tableData
    console.log("memo trigger")
    return data?.toArray() ?? [];
  }, [data, trigger])*/

  if (data == null || selected == null) {
    return <div>Loading</div>;
  }

  console.log("Rendering")
  console.log("Gen id %d", id)
  return (
    <div onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {others.map(showOther)}
    <table style={{ border: "solid 1px red" }}>
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
        {data.toArray().map((row, index) => {
                const onChangeCol1 = (e: React.FormEvent<HTMLInputElement>) => {
                  const newValue = e.currentTarget.value;
                  batch(() => {
                    const newRow = data?.get(index);
                    if (newRow != null) {
                      newRow.col1 = newValue;
                      data?.insert(newRow, index);
                      data?.delete(index + 1)
                    }
                  })
                }
                const onChangeCol2 = (e: React.FormEvent<HTMLInputElement>) => {
                  const newValue = e.currentTarget.value;
                  batch(() => {
                    const newRow = data?.get(index);
                    if (newRow != null) {
                      newRow.col2 = newValue;
                      data?.insert(newRow, index);
                      data?.delete(index + 1)
                    }
                  })
                }
                const onSelectCol1 = (e: React.FormEvent<HTMLInputElement>) => {
                  selected?.set(id, "col1"+index.toString())
                  console.log("Here1")
                }
                const onSelectCol2 = (e: React.FormEvent<HTMLInputElement>) => {
                  selected?.set(id, "col2"+index.toString())
                  console.log("Here2")
                }
                const onAbortCol1 = (e: React.FormEvent<HTMLInputElement>) => {
                  selected?.set(id, "")
                  console.log("Abort1")
                }
                const onAbortCol2 = (e: React.FormEvent<HTMLInputElement>) => {
                  selected?.set(id, "")
                  console.log("Abort2")
                }
              for (const i in selected.toObject()) {
                console.log(selected)
              }
          return (
            <tr>
            <input style={{}} value={row.col1} onBlur={onAbortCol1} onSelect={onSelectCol1} onChange={onChangeCol1}></input>
            <input value={row.col2} onSelect={onSelectCol2} onBlur={onAbortCol2} onChange={onChangeCol2}></input>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
/*

    () => {
      return data?.toArray() ?? []
    },
    [data]
*/
/*
              {propertiesOf< row.keys.map((cell) => {
                const row: number = cell.row.index
                let col: "col1" | "col2" = "col1"
                switch(cell.column.id) {
                  case "col1":
                    col = "col1"
                    break
                  case "col2":
                    col = "col2"
                    break
                }
                const onChange = (e: React.FormEvent<HTMLInputElement>) => {
                  const newValue = e.currentTarget.value;
                  batch(() => {
                    const newRow = data?.get(row);
                    if (newRow != null) {
                      newRow[col] = newValue;
                      data?.insert(newRow, row);
                      data?.delete(row + 1)
                    }
                  })
                }
                return (
                  <td
                    {...cell.getCellProps()}
                  >
                    <input value={cell.value} onChange={onChange}></input>
                  </td>
                );
              })}
            </tr>
            */