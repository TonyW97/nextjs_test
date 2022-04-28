import { sharedPrisma } from "./prisma"
const API_KEY = process.env.LIVEBLOCKS_SECRET_KEY;
export default async function handler(req, res) {
    // Get JWT from Liveblocks
    console.log("here")
    const ret = await fetch("https://liveblocks.io/api/authorize", 
    {method: "GET", headers: {"Authorization": "Bearer " + API_KEY}})
    const jwt = (await ret.json()).token

    const dbRows = await sharedPrisma.row.findMany()
    console.log(dbRows);

    // build data to load into liveblocks storage
    let data = {
        liveblocksType: "LiveObject",
        data: {
            rows: { liveblocksType: "LiveList", data: dbRows}
        }
    }

    const del = await fetch("https://liveblocks.net/api/v1/room/table-storage-v4/storage",
     {method: "DELETE", headers: {"Authorization": "Bearer " + jwt}})
     console.log(del)

    const storage = await fetch("https://liveblocks.net/api/v1/room/table-storage-v4/storage",
     {method: "POST", headers: {"Authorization": "Bearer " + jwt}, body: JSON.stringify(data)})

     console.log(await storage.json())
    res.status(200).json({ text: 'Loaded' })
  }
  