import styled from 'styled-components'
import { useEffect } from 'react'
import { SECOND } from '../constants/time-unit'
import LayoutFull from '../components/shared/layout-full'
import FormWrapper from '../components/login/form-wrapper'
import { useRouter } from 'next/router'

const REDIRECTION_DELAY = 3 // 秒

const Container = styled.div`
  flex-grow: 1;

  background-color: #fff;
  ${({ theme }) => theme.breakpoint.md} {
    background-color: #f2f2f2;
  }
`

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const PrimaryText = styled.p`
  color: rgba(0, 0, 0, 0.87);
  font-size: 24px;
  font-weight: 500;
  line-height: 150%;
`

const SecondaryText = styled.p`
  color: rgba(0, 0, 0, 0.3);
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  margin-top: 32px;
`

export default function PasswordChangeSuccess() {
  const router = useRouter()

  useEffect(() => {
    const task = setTimeout(
      () =>
        router.push({
          pathname: '/login',
        }),
      SECOND * REDIRECTION_DELAY
    )

    return () => {
      clearTimeout(task)
    }
  }, [router])

  return (
    <LayoutFull header={{ type: 'default' }} footer={{ type: 'default' }}>
      <Container>
        <Main>
          <FormWrapper>
            <PrimaryText>
              變更密碼成功！
              <br />
              請重新登入
            </PrimaryText>
            <SecondaryText>
              將於 {REDIRECTION_DELAY} 秒後自動跳轉至會員登入...
            </SecondaryText>
          </FormWrapper>
        </Main>
      </Container>
    </LayoutFull>
  )
}
