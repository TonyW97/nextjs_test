import { sharedPrisma } from "./prisma"

const API_KEY = process.env.LIVEBLOCKS_SECRET_KEY;
export default async function handler(req, res) {
    // Get JWT from Liveblocks
    console.log("here")
    const ret = await fetch("https://liveblocks.io/api/authorize", 
    {method: "GET", headers: {"Authorization": "Bearer " + API_KEY}})
    const jwt = (await ret.json()).token

    const storage = await fetch("https://liveblocks.net/api/v1/room/table-storage-v4/storage",
     {method: "GET", headers: {"Authorization": "Bearer " + jwt}})
    
    const jsonStorage = await storage.json()
    
    console.log(jsonStorage.data.rows.data)
    await sharedPrisma.row.deleteMany()
    for (const row of jsonStorage.data.rows.data) {
        console.log(row)
        await sharedPrisma.row.create({
            data: {
                col1: row.col1,
                col2: row.col2
            }
        })
    }
    res.status(200).json({ text: 'Saved' })
  }
  