import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import { getSortedPostsData } from '../lib/posts'
import utilStyles from '../styles/utils.module.css'
import Date from '../components/dates'
import { PrismaClient } from '@prisma/client'

export async function getStaticProps() {
  const prisma = new PrismaClient();
  const allUsers = await prisma.user.findMany();
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allUsers,
      allPostsData
    }
  }
}

export default function Home({ allUsers, allPostsData }) {
  return (
    <Layout home>
    <Head>
      <title>A app</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Blog</h2>
        <ul className={utilStyles.list}>
          {allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
            <Link href={`/posts/${id}`}>
              <a>{title}</a>
            </Link>
            <br />
            <small className={utilStyles.lightText}>
              <Date dateString={date} />
            </small>
          </li>
          ))}
        </ul>
      </section>
      <h2 className={utilStyles.headingLg}>Emails from DB</h2>
      <button onClick={callCreateUser}>Click to generate new DB entry</button>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        {
          allUsers.map((user) => (
            <p id={user.id}>{user.email} {user.first_name} {user.last_name}</p>
          ))
        }
      </section>
      <a href={"table/"}>Liveblocks</a>
    </Layout>
  );
}

async function callCreateUser() {
  console.log("here");
  await fetch("api/createuser",
   {method: "POST"}
   );
};