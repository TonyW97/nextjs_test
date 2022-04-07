import { PrismaClient } from '@prisma/client'

export default async function handler(req, res) {
    const prisma = new PrismaClient();
    await prisma.user.create({
        data: {
            email: "tw@test.com",
            first_name: "T",
            last_name: "W"
        }
    }
    )
    res.status(200).json({ text: 'Created' })
  }
  