import { LiveblocksProvider } from "@liveblocks/react";
import { createClient } from "@liveblocks/client";
import '../styles/global.css'
const client = createClient({
  authEndpoint: "/api/auth",
});
export default function App({ Component, pageProps }) {
  return (
  <LiveblocksProvider client={client}>
   <Component {...pageProps} />
  </LiveblocksProvider>
  );
}