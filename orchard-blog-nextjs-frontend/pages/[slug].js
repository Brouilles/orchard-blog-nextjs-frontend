import Head from 'next/head'
import styles from '../styles/Home.module.css'

import { ApolloClient, ApolloLink, InMemoryCache, gql, HttpLink } from '@apollo/client';

export const getServerSideProps = async (context) => {
    const slug = context.params.slug;

    const tokenReq = await fetch('https://localhost:7032/connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'client_id=62a934cf62a94a1e8d10c74f0c5d7779'
        + '&client_secret=52a9c9aba8dd448daee528ea6a417175'
        + '&grant_type=client_credentials'
    });
    const tokenData = await tokenReq.json();

    const httpLink = new HttpLink({ uri: 'https://localhost:7032/api/graphql' });
    const authLink = new ApolloLink((operation, forward) => {
        const token = tokenData.access_token;
    
        operation.setContext({
        headers: {
            authorization: token ? `Bearer ${token}` : ''
        }
        });
    
        return forward(operation);
    });

    const client = new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache()
    });

    const { data } = await client.query({
        query: gql`
            query GetBlogPost {
                blogPost(status: PUBLISHED, where: {alias: {alias: "${slug}"}}, first: 1) {
                    author
                    createdUtc
                    displayText
                    alias {
                        alias
                    }
                    markdownBody {
                        html
                    }
                }
            }
        `
    });

    return {
        props: {
            post: data.blogPost[0]
        }
    };
};

export default function Home({ post }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>NextJS Blog with Orchard</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
            {post.displayText}
        </h1>

        <p className={styles.description}>
            By {post.author} at {new Date(post.createdUtc).toLocaleString()}
        </p>

        <div dangerouslySetInnerHTML={{ __html: post.markdownBody.html }} className={styles.grid}>
        </div>
      </main>
    </div>
  )
}
