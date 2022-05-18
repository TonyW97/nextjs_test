import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import Date from '../components/dates'
import { PrismaClient } from '@prisma/client'

export default function Home({ allUsers, allPostsData }) {
  return (
    <Layout home>
    <Head>
      <title>A app</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
      <h2 className={utilStyles.headingLg}>Emails from DB</h2>
      <button onClick={callCreateUser}>Click to generate new DB entry</button>
      <br/>
      <a href={"table/"}>Liveblocks</a>
      <br/>
      <a href={"replicache/"}>Replicache</a>
    </Layout>
  );
}

async function callCreateUser() {
  console.log("here");
  await fetch("api/createuser",
   {method: "POST"}
   );
};