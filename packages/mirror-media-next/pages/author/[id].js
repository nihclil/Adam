import errors from '@twreporter/errors'
import styled from 'styled-components'

import client from '../../apollo/apollo-client'
import { fetchContact } from '../../apollo/query/contact'
import { fetchPosts } from '../../apollo/query/posts'
import AuthorArticles from '../../components/author/author-articles'
import { GCP_PROJECT_ID } from '../../config/index.mjs'

const AuthorContainer = styled.main`
  width: 320px;
  margin: 0 auto;

  ${({ theme }) => theme.breakpoint.md} {
    width: 672px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    width: 1024px;
    padding: 0;
  }
`

const AuthorTitle = styled.h1`
  display: inline-block;
  margin: 16px 0 16px 16px;
  padding: 4px 16px;
  font-size: 16px;
  line-height: 1.15;
  font-weight: 500;
  color: black;
  ${({ theme }) => theme.breakpoint.md} {
    margin: 18px 0 20px;
    font-size: 28px;
    font-weight: 600;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    margin: 24px 0 28px;
  }
`

const RENDER_PAGE_SIZE = 12

/**
 * @typedef {import('../../components/author/author-articles').Article} Article
 * @typedef {import('../../components/author/author-articles').Author} Author
 */

/**
 * @param {Object} props
 * @param {Article[]} props.posts
 * @param {Author} props.author
 * @param {number} props.postsCount
 * @returns {React.ReactElement}
 */
export default function Author({ postsCount, posts, author }) {
  return (
    <AuthorContainer>
      <AuthorTitle>{author?.name}</AuthorTitle>
      <AuthorArticles
        postsCount={postsCount}
        posts={posts}
        author={author}
        renderPageSize={RENDER_PAGE_SIZE}
      />
    </AuthorContainer>
  )
}

/**
 * @type {import('next').GetServerSideProps}
 */
export async function getServerSideProps({ query, req }) {
  const authorId = query.id
  const traceHeader = req.headers?.['x-cloud-trace-context']
  let globalLogFields = {}
  if (traceHeader && !Array.isArray(traceHeader)) {
    const [trace] = traceHeader.split('/')
    globalLogFields[
      'logging.googleapis.com/trace'
    ] = `projects/${GCP_PROJECT_ID}/traces/${trace}`
  }

  const responses = await Promise.allSettled([
    client.query({
      query: fetchPosts,
      variables: {
        take: RENDER_PAGE_SIZE * 2,
        skip: 0,
        orderBy: { publishedDate: 'desc' },
        filter: {
          state: { equals: 'published' },
          OR: [
            { writers: { some: { id: { equals: authorId } } } },
            { photographers: { some: { id: { equals: authorId } } } },
          ],
        },
      },
    }),
    client.query({
      query: fetchContact,
      variables: {
        where: { id: authorId },
      },
    }),
  ])

  const handledResponses = responses.map((response) => {
    if (response.status === 'fulfilled') {
      return response.value.data
    } else if (response.status === 'rejected') {
      const { graphQLErrors, clientErrors, networkError } = response.reason
      const annotatingError = errors.helpers.wrap(
        response.reason,
        'UnhandledError',
        'Error occurs while getting author page data'
      )

      console.log(
        JSON.stringify({
          severity: 'ERROR',
          message: errors.helpers.printAll(
            annotatingError,
            {
              withStack: true,
              withPayload: true,
            },
            0,
            0
          ),
          debugPayload: {
            graphQLErrors,
            clientErrors,
            networkError,
          },
          ...globalLogFields,
        })
      )
      return
    }
  })

  /** @type {number} postsCount */
  const postsCount = handledResponses[0]?.postsCount || 0
  /** @type {Article[]} */
  const posts = handledResponses[0]?.posts || []
  /** @type {Author} */
  const author = handledResponses[1]?.contact || {}

  const props = {
    postsCount,
    posts,
    author,
  }

  return { props }
}