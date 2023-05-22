//TODO: will fetch topic data twice (once in header, once in index),
//should fetch only once by using Redux.
//TODO: add typedef of editor choice data
//TODO: add component to add html head dynamically, not jus write head in every pag
//TODO: add jsDoc of `props.sectionsData`
import React from 'react'
import styled from 'styled-components'
import axios from 'axios'
import errors from '@twreporter/errors'
import client from '../apollo/apollo-client'
import Head from 'next/head'
import { gql } from '@apollo/client'
import {
  ENV,
  API_TIMEOUT,
  URL_STATIC_POST_FLASH_NEWS,
  URL_STATIC_POST_EXTERNAL,
  GCP_PROJECT_ID,
} from '../config/index.mjs'

import { fetchHeaderDataInDefaultPageLayout } from '../utils/api'
import { transformRawDataToArticleInfo } from '../utils'

import EditorChoice from '../components/editor-choice'
import LatestNews from '../components/latest-news'
import ShareHeader from '../components/shared/share-header'

/**
 * @typedef {import('../components/shared/share-header').HeaderData['flashNewsData']} FlashNewsData
 */
/**
 * @typedef {import('../components/shared/share-header').HeaderData['sectionsData']} SectionsData
 */
/**
 * @typedef {import('../components/shared/share-header').HeaderData['topicsData']} TopicsData
 */

const IndexContainer = styled.main`
  background-color: rgba(255, 255, 255, 1);
  max-width: 596px;

  ${({ theme }) => theme.breakpoint.xl} {
    max-width: 1024px;
    height: 500vh;
  }
  margin: 0 auto;
`

/**
 *
 * @param {Object} props
 * @param {import('../type').Topic[]} props.topicsData
 * @param {FlashNewsData} props.flashNewsData
 * @param {import('../type/raw-data.typedef').RawData[] } [props.editorChoicesData=[]]
 * @param {import('../type/raw-data.typedef').RawData[] } [props.latestNewsData=[]]
 * @param {Object[] } props.sectionsData
 * @param {String} [props.latestNewsTimestamp]
 * @returns {React.ReactElement}
 */
export default function Home({
  topicsData = [],
  flashNewsData = [],
  editorChoicesData = [],
  latestNewsData = [],
  latestNewsTimestamp,
  sectionsData = [],
}) {
  const editorChoice = transformRawDataToArticleInfo(editorChoicesData)

  return (
    <>
      <ShareHeader
        pageLayoutType="default-with-flash-news"
        headerData={{ sectionsData, topicsData, flashNewsData }}
      />
      <Head>
        <title>鏡週刊 Mirror Media</title>
      </Head>
      <IndexContainer>
        <EditorChoice editorChoice={editorChoice}></EditorChoice>
        <LatestNews
          latestNewsData={latestNewsData}
          latestNewsTimestamp={latestNewsTimestamp}
        />
      </IndexContainer>
    </>
  )
}

/**
 * @typedef {Object[]} Items
 */

/**
 * @typedef {Object} DataRes
 * @property {FlashNewsData} [posts]
 * @property {TopicsData} [topics]
 * @property {SectionsData} [sections]
 */

//TODO: rename typedef, make it more clear
/**
 * @typedef {Object} PostRes
 * @property {string} timestamp
 * @property {Array} choices
 * @property {Array} latest
 */

/** @typedef {import('axios').AxiosResponse<DataRes>} AxiosResponse */

//TODO: rename typedef, make it more clear
/** @typedef {import('axios').AxiosResponse<PostRes>} AxiosPostResponse */

/**
 * @type {import('next').GetServerSideProps}
 */
export async function getServerSideProps({ res, req }) {
  if (ENV === 'dev' || ENV === 'staging' || ENV === 'prod') {
    res.setHeader('Cache-Control', 'public, max-age=180')
  }

  const headers = req?.headers
  const traceHeader = headers?.['x-cloud-trace-context']
  let globalLogFields = {}
  if (traceHeader && !Array.isArray(traceHeader)) {
    const [trace] = traceHeader.split('/')
    globalLogFields[
      'logging.googleapis.com/trace'
    ] = `projects/${GCP_PROJECT_ID}/traces/${trace}`
  }

  let topicsData = []
  let flashNewsData = []
  let editorChoicesData = []
  let latestNewsData = []
  let latestNewsTimestamp = null
  let sectionsData = []
  try {
    const responses = await Promise.allSettled([
      axios({
        method: 'get',
        url: URL_STATIC_POST_FLASH_NEWS,
        timeout: API_TIMEOUT,
      }),
      axios({
        method: 'get',
        url: `${URL_STATIC_POST_EXTERNAL}01.json`,
        timeout: API_TIMEOUT,
      }),
      fetchHeaderDataInDefaultPageLayout(),
    ])

    responses.forEach((response) => {
      if (response.status === 'fulfilled') {
        //TODO: because `fetchHeaderDataInDefaultPageLayout` will not return `value` which contain `request?.res?.responseUrl`,
        //so we temporarily comment the console to prevent error.
        // console.log(
        //   JSON.stringify({
        //     severity: 'INFO',
        //     message: `Successfully fetch data on ${response.value?.request?.res?.responseUrl}`,
        //   })
        // )
      } else {
        const rejectedReason = response.reason
        const annotatingAxiosError =
          errors.helpers.annotateAxiosError(rejectedReason)
        console.error(
          JSON.stringify({
            severity: 'ERROR',
            message: errors.helpers.printAll(
              annotatingAxiosError,
              {
                withStack: true,
                withPayload: true,
              },
              0,
              0
            ),
            ...globalLogFields,
          })
        )
      }
    })

    /** @type {PromiseFulfilledResult<AxiosResponse>} */
    const flashNewsResponse =
      responses[0].status === 'fulfilled' && responses[0]

    /** @type {PromiseFulfilledResult<AxiosPostResponse>} */
    const postResponse = responses[1].status === 'fulfilled' && responses[1]
    const headerDataResponse =
      responses[2].status === 'fulfilled' && responses[2]
    flashNewsData = Array.isArray(flashNewsResponse.value?.data?.posts)
      ? flashNewsResponse.value?.data?.posts
      : []
    editorChoicesData = Array.isArray(postResponse.value?.data?.choices)
      ? postResponse.value?.data?.choices
      : []
    latestNewsData = Array.isArray(postResponse.value?.data?.latest)
      ? postResponse.value?.data?.latest
      : []
    latestNewsTimestamp = postResponse.value?.data?.timestamp
    sectionsData = Array.isArray(headerDataResponse.value?.sectionsData)
      ? headerDataResponse.value?.sectionsData
      : []
    topicsData = Array.isArray(headerDataResponse.value?.topicsData)
      ? headerDataResponse.value?.topicsData
      : []
  } catch (err) {
    const annotatingError = errors.helpers.wrap(
      err,
      'UnhandledError',
      'Error occurs while getting index page data'
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
        ...globalLogFields,
      })
    )
  }
  try {
    const headerData = await fetchHeaderDataInDefaultPageLayout()
    sectionsData = headerData.sectionsData
    topicsData = headerData.topicsData
  } catch (error) {
    console.error(
      JSON.stringify({
        severity: 'ERROR',
        message: errors.helpers.printAll(
          error,
          {
            withStack: true,
            withPayload: true,
          },
          0,
          0
        ),
        ...globalLogFields,
      })
    )
  }
  //request fetched by `apollo`, should replace request fetched by `axios` in the future
  try {
    const editorChoiceApollo = await client.query({
      query: gql`
        query GetEditorChoices {
          editorChoices(
            orderBy: { order: asc }
            where: {
              state: { equals: "published" }
              choices: { state: { equals: "published" } }
            }
          ) {
            id
            order
            choices {
              id
              slug
              title
              subtitle
              state
              publishedDate
              sections {
                id
                name
              }
              categories {
                id
                name
              }
            }
          }
        }
      `,
    })
    console.log(editorChoiceApollo)
  } catch (err) {
    const { graphQLErrors, clientErrors, networkError } = err
    const annotatingError = errors.helpers.wrap(
      err,
      'UnhandledError',
      'Error occurs while getting index page data'
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
  }

  return {
    props: {
      topicsData,
      flashNewsData,
      editorChoicesData,
      latestNewsData,
      latestNewsTimestamp,
      sectionsData,
    },
  }
}
